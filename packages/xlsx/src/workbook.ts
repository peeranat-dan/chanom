import type { CellValue, Relationship, SetCellValue, Warning } from './types.ts';

export interface SheetMeta {
  readonly name: string;
  readonly sheetId: number;
  readonly partName: string | null;
}

export interface SheetRow {
  /** 1-based worksheet row number this row occupies in the original file. */
  readonly line: number;
  readonly cells: ReadonlyArray<CellValue | undefined>;
}

export class Sheet {
  readonly name: string;
  readonly sheetId: number;
  readonly _partName: string | null;
  readonly _cells: Map<string, CellValue>;
  /**
   * Original worksheet Part bytes, retained so an unedited sheet round-trips
   * verbatim (formatting, merges, hyperlinks and all). Cleared to `null` the
   * moment the interpreted view is mutated, which marks the sheet dirty.
   */
  _rawXml: Uint8Array | null;

  constructor(name: string, sheetId: number, partName: string | null) {
    this.name = name;
    this.sheetId = sheetId;
    this._partName = partName;
    this._cells = new Map();
    this._rawXml = null;
  }

  /** A sheet is dirty once its interpreted view diverges from `_rawXml`. */
  get _dirty(): boolean {
    return this._rawXml === null;
  }

  getCell(address: string): CellValue | undefined {
    return this._cells.get(address.toUpperCase());
  }

  setCell(address: string, value: SetCellValue): void {
    // Editing forces the sheet to be rebuilt from the model on write, so the
    // verbatim pass-through of the original worksheet XML no longer applies.
    this._rawXml = null;
    this._cells.set(address.toUpperCase(), value as CellValue);
  }

  *cells(): Iterable<readonly [string, CellValue]> {
    yield* this._cells.entries();
  }

  /**
   * Yields one entry per occupied worksheet row, tagged with its original
   * 1-based `line`. Empty rows between occupied ones are skipped, but the
   * surviving `line` numbers stay faithful to the source file so callers (e.g.
   * bulk-import validation) can report errors against the right Excel row.
   */
  *rows(): Iterable<SheetRow> {
    const byRow = new Map<number, Map<number, CellValue>>();
    for (const [addr, cell] of this._cells) {
      const parsed = parseCellAddr(addr);
      if (!parsed) continue;
      let row = byRow.get(parsed.row);
      if (!row) {
        row = new Map();
        byRow.set(parsed.row, row);
      }
      row.set(parsed.colIdx, cell);
    }
    const sortedRows = [...byRow.keys()].sort((a, b) => a - b);
    for (const rowNum of sortedRows) {
      const row = byRow.get(rowNum)!;
      const maxCol = Math.max(...row.keys());
      const cells: Array<CellValue | undefined> = [];
      for (let i = 1; i <= maxCol; i++) {
        cells.push(row.get(i));
      }
      yield { line: rowNum, cells };
    }
  }
}

export class Workbook {
  readonly _rawFiles: Map<string, Uint8Array>;
  readonly _contentTypes: Map<string, string>;
  readonly _defaultContentTypes: Map<string, string>;
  readonly _relationships: Map<string, ReadonlyArray<Relationship>>;
  readonly _workbookPath: string;
  readonly _sheets: Sheet[];
  readonly _otherWorkbookRels: ReadonlyArray<Relationship>;
  readonly _warnings: Warning[];
  _fullCalcOnLoad: boolean;
  _nextSheetId: number;

  constructor(opts: {
    rawFiles: Map<string, Uint8Array>;
    contentTypes: Map<string, string>;
    defaultContentTypes: Map<string, string>;
    relationships: Map<string, ReadonlyArray<Relationship>>;
    workbookPath: string;
    sheets: Sheet[];
    otherWorkbookRels: Relationship[];
    warnings: Warning[];
    fullCalcOnLoad: boolean;
    nextSheetId: number;
  }) {
    this._rawFiles = opts.rawFiles;
    this._contentTypes = opts.contentTypes;
    this._defaultContentTypes = opts.defaultContentTypes;
    this._relationships = opts.relationships;
    this._workbookPath = opts.workbookPath;
    this._sheets = opts.sheets;
    this._otherWorkbookRels = opts.otherWorkbookRels;
    this._warnings = opts.warnings;
    this._fullCalcOnLoad = opts.fullCalcOnLoad;
    this._nextSheetId = opts.nextSheetId;
  }

  get sheets(): ReadonlyArray<Sheet> {
    return this._sheets;
  }

  addSheet(name: string): Sheet {
    const sheetId = this._nextSheetId++;
    const sheet = new Sheet(name, sheetId, null);
    this._sheets.push(sheet);
    return sheet;
  }
}

function parseCellAddr(addr: string): { row: number; colIdx: number } | null {
  const m = /^([A-Z]+)(\d+)$/.exec(addr);
  if (!m) return null;
  return { row: parseInt(m[2], 10), colIdx: colLettersToIndex(m[1]) };
}

export function colLettersToIndex(letters: string): number {
  let index = 0;
  for (const ch of letters) {
    index = index * 26 + (ch.charCodeAt(0) - 64);
  }
  return index;
}

export function colIndexToLetters(index: number): string {
  let result = '';
  let n = index;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}
