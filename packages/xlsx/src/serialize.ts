import { zipSync } from 'fflate';

import type { CellValue } from './types.ts';
import type { Sheet, Workbook } from './workbook.ts';

import { colLettersToIndex } from './workbook.ts';
import { encodeUtf8, escapeXml } from './xml.ts';

const NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_RELATIONSHIPS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const NS_CONTENT_TYPES = 'http://schemas.openxmlformats.org/package/2006/content-types';

const REL_TYPE_OFFICE_DOC =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument';
const REL_TYPE_WORKSHEET =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet';

const WORKSHEET_CT = 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml';
const WORKBOOK_CT = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml';
const RELS_CT = 'application/vnd.openxmlformats-package.relationships+xml';

function xmlDecl(): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
}

function buildWorkbookXml(sheets: ReadonlyArray<Sheet>, fullCalcOnLoad: boolean): string {
  const sheetEls = sheets
    .map((s, i) => {
      const rId = `rId${i + 1}`;
      return `    <sheet name="${escapeXml(s.name)}" sheetId="${s.sheetId}" r:id="${rId}"/>`;
    })
    .join('\n');

  const calcPrEl = fullCalcOnLoad ? '\n  <calcPr fullCalcOnLoad="1"/>' : '';

  return (
    xmlDecl() +
    `<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_R}">\n` +
    `  <sheets>\n${sheetEls}\n  </sheets>${calcPrEl}\n` +
    `</workbook>`
  );
}

function buildWorksheetXml(sheet: Sheet): string {
  const byRow = new Map<number, Array<[number, CellValue, string]>>();

  for (const [addr, cell] of sheet.cells()) {
    const m = /^([A-Z]+)(\d+)$/.exec(addr);
    if (!m) continue;
    const row = Number.parseInt(m[2], 10);
    const colIdx = colLettersToIndex(m[1]);
    let rowArr = byRow.get(row);
    if (!rowArr) {
      rowArr = [];
      byRow.set(row, rowArr);
    }
    rowArr.push([colIdx, cell, addr]);
  }

  const sortedRows = [...byRow.keys()].sort((a, b) => a - b);
  const rowEls: string[] = [];

  for (const rowNum of sortedRows) {
    const rowCells = byRow.get(rowNum)!.sort(([a], [b]) => a - b);
    const cellEls = rowCells.map(([, cell, addr]) => buildCellXml(addr, cell));
    rowEls.push(`    <row r="${rowNum}">\n${cellEls.join('\n')}\n    </row>`);
  }

  const sheetDataContent = rowEls.length > 0 ? `\n${rowEls.join('\n')}\n  ` : '';
  return (
    xmlDecl() +
    `<worksheet xmlns="${NS_MAIN}">\n` +
    `  <sheetData>${sheetDataContent}</sheetData>\n` +
    `</worksheet>`
  );
}

function buildCellXml(addr: string, cell: CellValue): string {
  const formula = 'formula' in cell ? cell.formula : undefined;
  const fEl = formula ? `      <f>${escapeXml(formula)}</f>\n` : '';

  if (cell.type === 'number') {
    return `      <c r="${addr}">\n${fEl}      <v>${cell.value}</v>\n      </c>`;
  }

  if (cell.type === 'boolean') {
    return `      <c r="${addr}" t="b">\n${fEl}      <v>${cell.value ? '1' : '0'}</v>\n      </c>`;
  }

  if (cell.type === 'error') {
    return `      <c r="${addr}" t="e">\n${fEl}      <v>${escapeXml(cell.value)}</v>\n      </c>`;
  }

  // Strings from rebuilt/new sheets are written inline so they never depend on
  // the shared-strings table, which passes through verbatim for the sake of any
  // unedited sheets that still index into it.
  if (formula) {
    return `      <c r="${addr}" t="str">\n${fEl}      <v>${escapeXml(cell.value)}</v>\n      </c>`;
  }
  return `      <c r="${addr}" t="inlineStr">\n      <is><t xml:space="preserve">${escapeXml(cell.value)}</t></is>\n      </c>`;
}

function buildRelsXml(rels: Array<{ id: string; type: string; target: string }>): string {
  const items = rels
    .map(
      (r) =>
        `  <Relationship Id="${escapeXml(r.id)}" Type="${escapeXml(r.type)}" Target="${escapeXml(r.target)}"/>`,
    )
    .join('\n');
  return (
    xmlDecl() +
    `<Relationships xmlns="${NS_RELATIONSHIPS}">\n` +
    (items ? `${items}\n` : '') +
    `</Relationships>`
  );
}

function buildContentTypesXml(
  defaults: Map<string, string>,
  overrides: Map<string, string>,
): string {
  const defaultEls = [...defaults.entries()]
    .map(([ext, ct]) => `  <Default Extension="${escapeXml(ext)}" ContentType="${escapeXml(ct)}"/>`)
    .join('\n');

  const overrideEls = [...overrides.entries()]
    .map(
      ([name, ct]) => `  <Override PartName="/${escapeXml(name)}" ContentType="${escapeXml(ct)}"/>`,
    )
    .join('\n');

  const content = [defaultEls, overrideEls].filter(Boolean).join('\n');
  return (
    xmlDecl() +
    `<Types xmlns="${NS_CONTENT_TYPES}">\n` +
    (content ? `${content}\n` : '') +
    `</Types>`
  );
}

function getWorkbookDir(workbookPath: string): string {
  const lastSlash = workbookPath.lastIndexOf('/');
  return lastSlash === -1 ? '' : workbookPath.slice(0, lastSlash);
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

/**
 * Resolves the part path each sheet is emitted at. An unedited sheet keeps its
 * original path so its bytes (and `_rels`) round-trip verbatim; edited or new
 * sheets get a fresh non-colliding path under the workbook directory.
 */
function assignSheetPaths(workbook: Workbook, wbDir: string): Map<Sheet, string> {
  const paths = new Map<Sheet, string>();
  const used = new Set<string>();

  for (const sheet of workbook._sheets) {
    if (!sheet._dirty && sheet._partName) {
      paths.set(sheet, sheet._partName);
      used.add(sheet._partName);
    }
  }

  let counter = 0;
  const nextFreshPath = (): string => {
    let path: string;
    do {
      counter++;
      const target = `worksheets/sheet${counter}.xml`;
      path = wbDir ? `${wbDir}/${target}` : target;
    } while (used.has(path));
    used.add(path);
    return path;
  };

  for (const sheet of workbook._sheets) {
    if (!paths.has(sheet)) {
      paths.set(sheet, nextFreshPath());
    }
  }

  return paths;
}

export function serialize(workbook: Workbook): Uint8Array {
  const wbDir = getWorkbookDir(workbook._workbookPath);
  const sheetPaths = assignSheetPaths(workbook, wbDir);

  // Reserved parts we regenerate ourselves; everything else in _rawFiles is a
  // pass-through candidate (unmodeled parts, verbatim sheets' _rels, etc.).
  const regenerated = new Set<string>([
    '[Content_Types].xml',
    '_rels/.rels',
    workbook._workbookPath,
    getRelsPath(workbook._workbookPath),
  ]);
  // A dirty sheet's original _rels no longer describes the rebuilt bytes, so
  // drop it; verbatim sheets keep theirs by not being listed here.
  for (const sheet of workbook._sheets) {
    if (sheet._dirty && sheet._partName) {
      regenerated.add(getRelsPath(sheet._partName));
    }
  }

  const workbookRels: Array<{ id: string; type: string; target: string }> = [];
  const newContentTypeOverrides = new Map<string, string>();

  workbook._sheets.forEach((sheet, i) => {
    const fullPath = sheetPaths.get(sheet)!;
    const rId = `rId${i + 1}`;
    const target =
      wbDir && fullPath.startsWith(`${wbDir}/`) ? fullPath.slice(wbDir.length + 1) : fullPath;
    workbookRels.push({ id: rId, type: REL_TYPE_WORKSHEET, target });
    newContentTypeOverrides.set(fullPath, WORKSHEET_CT);
  });

  for (const rel of workbook._otherWorkbookRels) {
    const nextId = `rId${workbookRels.length + 1}`;
    workbookRels.push({ id: nextId, type: rel.type, target: rel.target });
  }

  newContentTypeOverrides.set(workbook._workbookPath, WORKBOOK_CT);

  const finalContentTypeOverrides = new Map<string, string>();
  for (const [k, v] of workbook._contentTypes) {
    finalContentTypeOverrides.set(k, v);
  }
  for (const [k, v] of newContentTypeOverrides) {
    finalContentTypeOverrides.set(k, v);
  }

  const defaultContentTypes = new Map<string, string>();
  defaultContentTypes.set('rels', RELS_CT);
  defaultContentTypes.set('xml', 'application/xml');
  for (const [k, v] of workbook._defaultContentTypes) {
    if (k !== 'rels' && k !== 'xml') {
      defaultContentTypes.set(k, v);
    }
  }

  const files: Record<string, Uint8Array> = {};

  // Pass-through reservoir: every raw part we are not regenerating, including
  // verbatim sheet bytes' companion _rels and the shared-strings table.
  for (const [path, bytes] of workbook._rawFiles) {
    if (regenerated.has(path)) continue;
    files[path] = bytes;
  }

  const wbXml = buildWorkbookXml(workbook._sheets, workbook._fullCalcOnLoad);
  files[workbook._workbookPath] = encodeUtf8(wbXml);
  files[getRelsPath(workbook._workbookPath)] = encodeUtf8(buildRelsXml(workbookRels));

  for (const sheet of workbook._sheets) {
    const fullPath = sheetPaths.get(sheet)!;
    if (sheet._dirty || !sheet._rawXml) {
      files[fullPath] = encodeUtf8(buildWorksheetXml(sheet));
    } else {
      files[fullPath] = sheet._rawXml;
    }
  }

  files['_rels/.rels'] = encodeUtf8(
    buildRelsXml([{ id: 'rId1', type: REL_TYPE_OFFICE_DOC, target: workbook._workbookPath }]),
  );

  files['[Content_Types].xml'] = encodeUtf8(
    buildContentTypesXml(defaultContentTypes, finalContentTypeOverrides),
  );

  return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: 0 }]])));
}
