import type { OpcLimits } from './opc.ts';
import type { CellValue, Relationship, Warning } from './types.ts';

import { DEFAULT_OPC_LIMITS, getPartRelationships, parseOpc, resolveRelTarget } from './opc.ts';
import { Sheet, Workbook, colIndexToLetters, colLettersToIndex } from './workbook.ts';
import { attr, child, children, decodeUtf8, parseXml, textContent } from './xml.ts';

const REL_TYPE_WORKSHEET =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet';
const REL_TYPE_SHARED_STRINGS =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings';

const WORKSHEET_CT = 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml';
const SHARED_STRINGS_CT =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml';
const WORKBOOK_CT = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml';

interface SharedFormulaEntry {
  readonly formula: string;
  readonly masterAddr: string;
}

function parseSharedStrings(xml: string): string[] {
  const doc = parseXml(xml);
  const sst = (doc['sst'] as Record<string, unknown>) ?? {};
  const siItems = children(sst, 'si');
  return siItems.map((si) => extractSiText(si as Record<string, unknown>));
}

function extractSiText(si: Record<string, unknown>): string {
  const t = si['t'];
  if (t !== undefined) return textContent(t);

  const rItems = children(si, 'r');
  if (rItems.length > 0) {
    return rItems
      .map((r) => {
        const rt = (r as Record<string, unknown>)['t'];
        return rt !== undefined ? textContent(rt) : '';
      })
      .join('');
  }
  return '';
}

function parseCellAddr(addr: string): { col: string; row: number; colIdx: number } | null {
  const m = /^(\$?)([A-Z]+)(\$?)(\d+)$/.exec(addr.trim().toUpperCase());
  if (!m) return null;
  return {
    col: m[2],
    row: parseInt(m[4], 10),
    colIdx: colLettersToIndex(m[2]),
  };
}

function expandSharedFormula(
  masterFormula: string,
  masterAddr: string,
  targetAddr: string,
): string {
  const master = parseCellAddr(masterAddr);
  const target = parseCellAddr(targetAddr);
  if (!master || !target) return masterFormula;

  const rowOffset = target.row - master.row;
  const colOffset = target.colIdx - master.colIdx;

  return masterFormula.replace(/(\$?)([A-Z]+)(\$?)(\d+)/g, (_, colAbs, col, rowAbs, row) => {
    const newCol = colAbs ? col : colIndexToLetters(colLettersToIndex(col) + colOffset);
    const newRow = rowAbs ? row : String(Number(row) + rowOffset);
    return `${colAbs}${newCol}${rowAbs}${newRow}`;
  });
}

function parseCellValue(
  cellNode: Record<string, unknown>,
  cellAddr: string,
  sharedStrings: string[],
  sharedFormulas: Map<number, SharedFormulaEntry>,
  warnings: Warning[],
): CellValue | null {
  const t = attr(cellNode, 't') ?? '';

  const vNode = cellNode['v'];
  const vText = vNode !== undefined ? textContent(vNode) : undefined;

  const fNode = cellNode['f'];
  let formulaText: string | undefined;

  if (fNode !== undefined) {
    const fRecord =
      typeof fNode === 'object' && fNode !== null ? (fNode as Record<string, unknown>) : {};
    const fType = attr(fRecord, 't');
    const siAttr = attr(fRecord, 'si');
    const refAttr = attr(fRecord, 'ref');
    const rawFormula = textContent(fNode).trim();

    if (fType === 'shared' && siAttr !== undefined) {
      const siIndex = parseInt(siAttr, 10);
      if (rawFormula) {
        sharedFormulas.set(siIndex, { formula: rawFormula, masterAddr: cellAddr });
        formulaText = rawFormula;
      } else {
        const entry = sharedFormulas.get(siIndex);
        if (entry) {
          formulaText = expandSharedFormula(entry.formula, entry.masterAddr, cellAddr);
        }
      }
      void refAttr;
    } else {
      formulaText = rawFormula || undefined;
    }
  }

  if (t === 'b') {
    if (vText === undefined) {
      warnings.push({
        code: 'MISSING_VALUE',
        message: `Missing value for boolean cell`,
        address: cellAddr,
      });
      return null;
    }
    const value = vText.trim() === '1';
    return formulaText !== undefined
      ? { type: 'boolean', value, formula: formulaText }
      : { type: 'boolean', value };
  }

  if (t === 'e') {
    const value = vText ?? '#VALUE!';
    return formulaText !== undefined
      ? { type: 'error', value, formula: formulaText }
      : { type: 'error', value };
  }

  if (t === 's') {
    if (vText === undefined) {
      warnings.push({
        code: 'MISSING_VALUE',
        message: `Missing shared string index for cell`,
        address: cellAddr,
      });
      return null;
    }
    const idx = parseInt(vText.trim(), 10);
    if (isNaN(idx) || idx < 0 || idx >= sharedStrings.length) {
      warnings.push({
        code: 'INVALID_SHARED_STRING_INDEX',
        message: `Shared string index ${vText} out of range`,
        address: cellAddr,
      });
      return null;
    }
    const value = sharedStrings[idx];
    return formulaText !== undefined
      ? { type: 'string', value, formula: formulaText }
      : { type: 'string', value };
  }

  if (t === 'str') {
    const value = vText ?? '';
    return formulaText !== undefined
      ? { type: 'string', value, formula: formulaText }
      : { type: 'string', value };
  }

  if (t === 'inlineStr') {
    const isNode = child(cellNode, 'is') as Record<string, unknown> | undefined;
    if (!isNode) {
      warnings.push({
        code: 'MISSING_VALUE',
        message: `Missing inline string for cell`,
        address: cellAddr,
      });
      return null;
    }
    const value = extractSiText(isNode);
    return formulaText !== undefined
      ? { type: 'string', value, formula: formulaText }
      : { type: 'string', value };
  }

  if (vText === undefined) {
    if (formulaText !== undefined) {
      return { type: 'number', value: 0, formula: formulaText };
    }
    return null;
  }
  // `Number()` (unlike `parseFloat`) rejects trailing junk like "12junk", but
  // treats "" as 0 and "Infinity" as Infinity, so guard both explicitly.
  const trimmed = vText.trim();
  const num = trimmed === '' ? Number.NaN : Number(trimmed);

  if (!Number.isFinite(num)) {
    warnings.push({
      code: 'UNPARSEABLE_NUMBER',
      message: `Cannot parse number: ${vText}`,
      address: cellAddr,
    });
    return null;
  }
  return formulaText !== undefined
    ? { type: 'number', value: num, formula: formulaText }
    : { type: 'number', value: num };
}

function parseWorksheet(
  xml: string,
  sharedStrings: string[],
  sheetName: string,
  warnings: Warning[],
): Map<string, CellValue> {
  const cells = new Map<string, CellValue>();
  let doc: Record<string, unknown>;
  try {
    doc = parseXml(xml);
  } catch {
    warnings.push({
      code: 'MALFORMED_WORKSHEET',
      message: `Failed to parse worksheet XML for sheet "${sheetName}"`,
    });
    return cells;
  }

  const ws = (doc['worksheet'] as Record<string, unknown>) ?? {};
  const sheetData = (ws['sheetData'] as Record<string, unknown>) ?? {};
  const rows = children(sheetData, 'row');

  const sharedFormulas = new Map<number, SharedFormulaEntry>();

  let inferredRowNum = 0;
  for (const row of rows) {
    const rowRecord = row as Record<string, unknown>;
    const rAttr = attr(rowRecord, 'r');
    const rowNum = rAttr ? parseInt(rAttr, 10) : ++inferredRowNum;
    if (rAttr) inferredRowNum = rowNum;

    let inferredColIdx = 0;
    const cItems = children(rowRecord, 'c');
    for (const c of cItems) {
      const cellRecord = c as Record<string, unknown>;
      const rCell = attr(cellRecord, 'r');
      let cellAddr: string;

      if (rCell) {
        const parsed = parseCellAddr(rCell);
        if (!parsed) {
          warnings.push({ code: 'INVALID_CELL_REF', message: `Invalid cell reference: ${rCell}` });
          continue;
        }
        inferredColIdx = parsed.colIdx;
        cellAddr = `${parsed.col}${parsed.row}`;
      } else {
        inferredColIdx++;
        cellAddr = `${colIndexToLetters(inferredColIdx)}${rowNum}`;
      }

      try {
        const value = parseCellValue(cellRecord, cellAddr, sharedStrings, sharedFormulas, warnings);
        if (value !== null) {
          cells.set(cellAddr, value);
        }
      } catch {
        warnings.push({
          code: 'CELL_PARSE_ERROR',
          message: `Failed to parse cell ${cellAddr}`,
          address: cellAddr,
        });
      }
    }
  }

  return cells;
}

function parseWorkbookXml(xml: string): {
  sheets: Array<{ name: string; sheetId: number; rId: string }>;
  fullCalcOnLoad: boolean;
} {
  const doc = parseXml(xml);
  const wb = (doc['workbook'] as Record<string, unknown>) ?? {};
  const sheetsNode = (wb['sheets'] as Record<string, unknown>) ?? {};
  const sheetItems = children(sheetsNode, 'sheet');

  const sheets = sheetItems.map((s) => {
    const sr = s as Record<string, unknown>;
    return {
      name: attr(sr, 'name') ?? '',
      sheetId: parseInt(attr(sr, 'sheetId') ?? '0', 10),
      rId: (sr['@_r:id'] as string) ?? (sr['@_r:Id'] as string) ?? '',
    };
  });

  const calcPr = child(wb, 'calcPr') as Record<string, unknown> | undefined;
  const fullCalcOnLoad = calcPr ? attr(calcPr, 'fullCalcOnLoad') === '1' : false;

  return { sheets, fullCalcOnLoad };
}

export function parse(
  bytes: Uint8Array,
  limits?: Partial<OpcLimits>,
): { workbook: Workbook; warnings: Warning[] } {
  const pkg = parseOpc(bytes, limits ? { ...DEFAULT_OPC_LIMITS, ...limits } : undefined);
  const warnings: Warning[] = [];

  const workbookXml = pkg.rawFiles.get(pkg.workbookPath);
  if (!workbookXml) {
    throw new Error(`Workbook part missing from raw files: ${pkg.workbookPath}`);
  }

  const { sheets: sheetDefs, fullCalcOnLoad } = parseWorkbookXml(decodeUtf8(workbookXml));

  const workbookRels = getPartRelationships(pkg, pkg.workbookPath);

  const relsMap = new Map(workbookRels.map((r) => [r.id, r]));

  let sharedStrings: string[] = [];
  const ssRel = workbookRels.find((r) => r.type === REL_TYPE_SHARED_STRINGS);
  if (ssRel) {
    const ssPath = resolveRelTarget(pkg.workbookPath, ssRel.target);
    const ssBytes = pkg.rawFiles.get(ssPath);
    if (ssBytes) {
      try {
        sharedStrings = parseSharedStrings(decodeUtf8(ssBytes));
      } catch {
        warnings.push({
          code: 'MALFORMED_SHARED_STRINGS',
          message: 'Failed to parse sharedStrings.xml',
        });
      }
    }
  }

  const interpretedParts = new Set<string>([pkg.workbookPath]);

  const otherWorkbookRels: Relationship[] = [];
  const sheets: Sheet[] = [];
  let maxSheetId = 0;

  for (const sheetDef of sheetDefs) {
    const rel = relsMap.get(sheetDef.rId);
    if (!rel || rel.type !== REL_TYPE_WORKSHEET) {
      warnings.push({
        code: 'MISSING_SHEET_PART',
        message: `No worksheet relationship for sheet "${sheetDef.name}" (rId: ${sheetDef.rId})`,
      });
      const sheet = new Sheet(sheetDef.name, sheetDef.sheetId, null);
      sheets.push(sheet);
      if (sheetDef.sheetId > maxSheetId) maxSheetId = sheetDef.sheetId;
      continue;
    }

    const wsPath = resolveRelTarget(pkg.workbookPath, rel.target);
    interpretedParts.add(wsPath);

    const wsBytes = pkg.rawFiles.get(wsPath);
    if (!wsBytes) {
      warnings.push({ code: 'MISSING_SHEET_PART', message: `Worksheet file not found: ${wsPath}` });
      const sheet = new Sheet(sheetDef.name, sheetDef.sheetId, wsPath);
      sheets.push(sheet);
      if (sheetDef.sheetId > maxSheetId) maxSheetId = sheetDef.sheetId;
      continue;
    }

    const wsXml = decodeUtf8(wsBytes);
    const cells = parseWorksheet(wsXml, sharedStrings, sheetDef.name, warnings);
    const sheet = new Sheet(sheetDef.name, sheetDef.sheetId, wsPath);
    for (const [addr, cell] of cells) {
      sheet._cells.set(addr, cell);
    }
    // Keep the untouched worksheet bytes so an unedited sheet re-emits verbatim
    // (see serialize()); setCell() clears this to mark the sheet dirty.
    sheet._rawXml = wsBytes;
    sheets.push(sheet);
    if (sheetDef.sheetId > maxSheetId) maxSheetId = sheetDef.sheetId;
  }

  // sharedStrings.xml is now passed through verbatim (unedited sheets still
  // index into it), so it is NOT an interpreted part on write: keep its
  // content-type and its workbook relationship wired. Only worksheet rels are
  // regenerated by serialize().
  for (const rel of workbookRels) {
    if (rel.type !== REL_TYPE_WORKSHEET) {
      otherWorkbookRels.push(rel);
    }
  }

  const contentTypes = new Map(pkg.contentTypes);
  const defaultContentTypes = new Map(pkg.defaultContentTypes);

  for (const partPath of interpretedParts) {
    contentTypes.delete(partPath);
  }

  const filteredContentTypes = new Map<string, string>();
  for (const [k, v] of pkg.contentTypes) {
    if (!interpretedParts.has(k)) {
      filteredContentTypes.set(k, v);
    }
  }

  void contentTypes;
  void defaultContentTypes;

  const workbook = new Workbook({
    rawFiles: pkg.rawFiles,
    contentTypes: filteredContentTypes,
    defaultContentTypes: pkg.defaultContentTypes,
    relationships: pkg.relationships,
    workbookPath: pkg.workbookPath,
    sheets,
    otherWorkbookRels,
    warnings,
    fullCalcOnLoad,
    nextSheetId: maxSheetId + 1,
  });

  return { workbook, warnings };
}

export { WORKSHEET_CT, SHARED_STRINGS_CT, WORKBOOK_CT };
