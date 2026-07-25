import { unzipSync } from 'fflate';

import type { Relationship } from './types.ts';

import { XlsxParseError, XLSX_PARSE_ERROR_CODES } from './error.ts';
import { attr, children, decodeUtf8, parseXml } from './xml.ts';

export interface OpcPackage {
  readonly rawFiles: Map<string, Uint8Array>;
  readonly contentTypes: Map<string, string>;
  readonly defaultContentTypes: Map<string, string>;
  readonly relationships: Map<string, ReadonlyArray<Relationship>>;
  readonly workbookPath: string;
}

function getRelsPath(partPath: string): string {
  const lastSlash = partPath.lastIndexOf('/');
  if (lastSlash === -1) {
    return `_rels/${partPath}.rels`;
  }
  const dir = partPath.slice(0, lastSlash);
  const filename = partPath.slice(lastSlash + 1);
  return `${dir}/_rels/${filename}.rels`;
}

function resolveTarget(sourceDir: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  if (!sourceDir) return target;
  return `${sourceDir}/${target}`;
}

function parseRels(xml: string): Relationship[] {
  const doc = parseXml(xml);
  const rels = children((doc['Relationships'] as Record<string, unknown>) ?? {}, 'Relationship');
  return rels.map((rel) => ({
    id: attr(rel as Record<string, unknown>, 'Id') ?? '',
    type: attr(rel as Record<string, unknown>, 'Type') ?? '',
    target: attr(rel as Record<string, unknown>, 'Target') ?? '',
    targetMode: attr(rel as Record<string, unknown>, 'TargetMode'),
  }));
}

function parseContentTypes(xml: string): {
  overrides: Map<string, string>;
  defaults: Map<string, string>;
} {
  const doc = parseXml(xml);
  const types = (doc['Types'] as Record<string, unknown>) ?? {};
  const overrides = new Map<string, string>();
  const defaults = new Map<string, string>();

  for (const ovr of children(types, 'Override')) {
    const partName = attr(ovr as Record<string, unknown>, 'PartName') ?? '';
    const ct = attr(ovr as Record<string, unknown>, 'ContentType') ?? '';
    const normalized = partName.startsWith('/') ? partName.slice(1) : partName;
    overrides.set(normalized, ct);
  }

  for (const def of children(types, 'Default')) {
    const ext = attr(def as Record<string, unknown>, 'Extension') ?? '';
    const ct = attr(def as Record<string, unknown>, 'ContentType') ?? '';
    defaults.set(ext.toLowerCase(), ct);
  }

  return { overrides, defaults };
}

const REL_TYPE_OFFICE_DOC =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument';

/**
 * Structural caps that defuse ZIP bombs and pathological archives before they
 * exhaust memory. `originalSize` comes from the ZIP central directory, so an
 * oversized entry is rejected *before* it is decompressed.
 */
export interface OpcLimits {
  /** Max compressed input size (bytes). */
  readonly maxCompressedBytes: number;
  /** Max uncompressed size of any single part (bytes). */
  readonly maxPartBytes: number;
  /** Max total uncompressed size across all parts (bytes). */
  readonly maxTotalUncompressedBytes: number;
  /** Max number of parts in the archive. */
  readonly maxEntries: number;
}

export const DEFAULT_OPC_LIMITS: OpcLimits = {
  maxCompressedBytes: 100 * 1024 * 1024, // 100 MiB on the wire
  maxPartBytes: 200 * 1024 * 1024, // 200 MiB per part
  maxTotalUncompressedBytes: 500 * 1024 * 1024, // 500 MiB expanded
  maxEntries: 10_000,
};

export function parseOpc(bytes: Uint8Array, limits: OpcLimits = DEFAULT_OPC_LIMITS): OpcPackage {
  if (bytes.length > limits.maxCompressedBytes) {
    throw new XlsxParseError(
      XLSX_PARSE_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED,
      `Compressed input exceeds ${limits.maxCompressedBytes} bytes`,
    );
  }

  let rawFiles: Map<string, Uint8Array>;
  let entryCount = 0;
  let totalUncompressed = 0;
  // A limit hit inside the filter is surfaced via this holder because fflate
  // collapses any throw from the filter into its generic decode failure.
  let limitError: XlsxParseError | null = null;
  try {
    const unzipped = unzipSync(bytes, {
      filter: (file) => {
        if (limitError) return false;
        entryCount++;
        if (entryCount > limits.maxEntries) {
          limitError = new XlsxParseError(
            XLSX_PARSE_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED,
            `Archive has more than ${limits.maxEntries} entries`,
          );
          return false;
        }
        if (file.originalSize > limits.maxPartBytes) {
          limitError = new XlsxParseError(
            XLSX_PARSE_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED,
            `Part "${file.name}" exceeds ${limits.maxPartBytes} uncompressed bytes`,
          );
          return false;
        }
        totalUncompressed += file.originalSize;
        if (totalUncompressed > limits.maxTotalUncompressedBytes) {
          limitError = new XlsxParseError(
            XLSX_PARSE_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED,
            `Archive exceeds ${limits.maxTotalUncompressedBytes} total uncompressed bytes`,
          );
          return false;
        }
        return true;
      },
    });
    rawFiles = new Map(Object.entries(unzipped));
  } catch {
    if (limitError) throw limitError;
    throw new XlsxParseError(XLSX_PARSE_ERROR_CODES.NOT_A_ZIP, 'Input is not a valid ZIP archive');
  }
  if (limitError) throw limitError;

  const contentTypesBytes = rawFiles.get('[Content_Types].xml');
  if (!contentTypesBytes) {
    throw new XlsxParseError(
      XLSX_PARSE_ERROR_CODES.MISSING_CONTENT_TYPES,
      'ZIP is missing [Content_Types].xml — not an OPC Package',
    );
  }

  const { overrides: contentTypes, defaults: defaultContentTypes } = parseContentTypes(
    decodeUtf8(contentTypesBytes),
  );

  const relationships = new Map<string, ReadonlyArray<Relationship>>();

  for (const [path, fileBytes] of rawFiles) {
    if (!path.includes('/_rels/') && !path.startsWith('_rels/')) continue;
    try {
      const rels = parseRels(decodeUtf8(fileBytes));
      const relsPath = path;

      let sourcePart: string;
      if (relsPath === '_rels/.rels') {
        sourcePart = '';
      } else {
        const withoutRels = relsPath.replace('/_rels/', '/').replace(/\.rels$/, '');
        sourcePart = withoutRels;
      }
      relationships.set(sourcePart, rels);
    } catch {
      throw new XlsxParseError(
        XLSX_PARSE_ERROR_CODES.BROKEN_RELATIONSHIP_GRAPH,
        `Failed to parse relationships file: ${path}`,
      );
    }
  }

  const rootRels = relationships.get('') ?? [];
  const officeDocRel = rootRels.find((r) => r.type === REL_TYPE_OFFICE_DOC);
  if (!officeDocRel) {
    throw new XlsxParseError(
      XLSX_PARSE_ERROR_CODES.MISSING_WORKBOOK_PART,
      'No office document relationship found in root _rels/.rels',
    );
  }

  const workbookPath = officeDocRel.target.startsWith('/')
    ? officeDocRel.target.slice(1)
    : officeDocRel.target;

  if (!rawFiles.has(workbookPath)) {
    throw new XlsxParseError(
      XLSX_PARSE_ERROR_CODES.MISSING_WORKBOOK_PART,
      `Workbook part not found: ${workbookPath}`,
    );
  }

  const workbookRelsPath = getRelsPath(workbookPath);
  if (!rawFiles.has(workbookRelsPath) && !relationships.has(workbookPath)) {
    throw new XlsxParseError(
      XLSX_PARSE_ERROR_CODES.BROKEN_RELATIONSHIP_GRAPH,
      `Workbook relationships file not found: ${workbookRelsPath}`,
    );
  }

  return {
    rawFiles,
    contentTypes,
    defaultContentTypes,
    relationships,
    workbookPath,
  };
}

export function getPartRelationships(
  pkg: OpcPackage,
  partPath: string,
): ReadonlyArray<Relationship> {
  return pkg.relationships.get(partPath) ?? [];
}

export function resolveRelTarget(partPath: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  const dir = partPath.includes('/') ? partPath.slice(0, partPath.lastIndexOf('/')) : '';
  return resolveTarget(dir, target);
}
