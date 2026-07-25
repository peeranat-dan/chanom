import { strToU8, unzipSync, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import { XlsxParseError, XLSX_PARSE_ERROR_CODES } from '../src/error.ts';
import { parse } from '../src/parse.ts';
import { serialize } from '../src/serialize.ts';
import { createXlsx } from './fixtures/create.ts';

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// ──────────────────────────────────────────────────────────────
// Ticket 01 – OPC pass-through round-trip
// ──────────────────────────────────────────────────────────────
describe('parse + serialize (OPC pass-through)', () => {
  it('round-trips a minimal xlsx with no edits', async () => {
    const original = createXlsx({
      sheets: [{ name: 'Sheet1', cells: [{ addr: 'A1', value: 42 }] }],
    });

    const { workbook } = parse(original);
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);

    expect(wb2.sheets).toHaveLength(1);
    expect(wb2.sheets[0].name).toBe('Sheet1');
    expect(wb2.sheets[0].getCell('A1')).toEqual({ type: 'number', value: 42 });
  });

  it('preserves an unmodeled part (simulated chart) byte-for-byte', async () => {
    const CHART_CONTENT = '<?xml version="1.0"?><chart xmlns="fake">UNMODELED</chart>';
    const CHART_CT = 'application/vnd.fake.chart+xml';

    const original = createXlsx({
      sheets: [{ name: 'Sheet1', cells: [{ addr: 'A1', value: 1 }] }],
      extraParts: { 'xl/fakeChart.xml': CHART_CONTENT },
      extraContentTypes: { '/xl/fakeChart.xml': CHART_CT },
    });

    const { workbook } = parse(original);
    const out = serialize(workbook);

    const outFiles = unzipSync(out);
    expect(outFiles['xl/fakeChart.xml']).toBeDefined();
    expect(decodeUtf8(outFiles['xl/fakeChart.xml'])).toBe(CHART_CONTENT);
  });

  it('serialize is non-mutating – calling twice yields equivalent output', async () => {
    const original = createXlsx({
      sheets: [{ name: 'S1', cells: [{ addr: 'B2', value: 'hello' }] }],
    });
    const { workbook } = parse(original);
    const out1 = serialize(workbook);
    const out2 = serialize(workbook);

    const { workbook: wb1 } = parse(out1);
    const { workbook: wb2 } = parse(out2);
    expect(wb1.sheets[0].getCell('B2')).toEqual(wb2.sheets[0].getCell('B2'));
  });
});

// ──────────────────────────────────────────────────────────────
// Ticket 02 – Structural error model
// ──────────────────────────────────────────────────────────────
describe('XlsxParseError', () => {
  it('rejects non-zip input with NOT_A_ZIP', () => {
    expect(() => parse(strToU8('not a zip file'))).toThrow(XlsxParseError);
    try {
      parse(strToU8('not a zip file'));
    } catch (e) {
      expect(e).toBeInstanceOf(XlsxParseError);
      expect((e as XlsxParseError).code).toBe(XLSX_PARSE_ERROR_CODES.NOT_A_ZIP);
    }
  });

  it('rejects a zip missing [Content_Types].xml with MISSING_CONTENT_TYPES', () => {
    const files: Record<string, Uint8Array> = {
      'xl/workbook.xml': strToU8('<workbook/>'),
    };
    const noContentTypes = zipSync(
      Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: 0 }]])),
    );
    expect(() => parse(noContentTypes)).toThrow(XlsxParseError);
    try {
      parse(noContentTypes);
    } catch (e) {
      expect((e as XlsxParseError).code).toBe(XLSX_PARSE_ERROR_CODES.MISSING_CONTENT_TYPES);
    }
  });

  it('rejects a package with no workbook part (no office doc rel) with MISSING_WORKBOOK_PART', () => {
    const files: Record<string, Uint8Array> = {
      '[Content_Types].xml': strToU8(
        '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/></Types>',
      ),
      '_rels/.rels': strToU8(
        '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>',
      ),
    };
    const noWorkbook = zipSync(
      Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: 0 }]])),
    );
    try {
      parse(noWorkbook);
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(XlsxParseError);
      expect((e as XlsxParseError).code).toBe(XLSX_PARSE_ERROR_CODES.MISSING_WORKBOOK_PART);
    }
  });

  it('rejects broken relationship graph with BROKEN_RELATIONSHIP_GRAPH', () => {
    const files: Record<string, Uint8Array> = {
      '[Content_Types].xml': strToU8(
        '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/></Types>',
      ),
      '_rels/.rels': strToU8('not valid xml at all {{{{'),
    };
    const brokenRels = zipSync(
      Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: 0 }]])),
    );
    try {
      parse(brokenRels);
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(XlsxParseError);
    }
  });

  it('does not throw on a valid file (no regression)', () => {
    const bytes = createXlsx({ sheets: [{ name: 'Sheet1', cells: [] }] });
    expect(() => parse(bytes)).not.toThrow();
  });

  it('exports a distinguishable code on each error', () => {
    const codes = Object.values(XLSX_PARSE_ERROR_CODES);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

// ──────────────────────────────────────────────────────────────
// Ticket 03 – Read cell values
// ──────────────────────────────────────────────────────────────
describe('parse – cell values', () => {
  it('enumerates sheets with name and order', () => {
    const bytes = createXlsx({
      sheets: [
        { name: 'Alpha', cells: [] },
        { name: 'Beta', cells: [] },
      ],
    });
    const { workbook } = parse(bytes);
    expect(workbook.sheets).toHaveLength(2);
    expect(workbook.sheets[0].name).toBe('Alpha');
    expect(workbook.sheets[1].name).toBe('Beta');
  });

  it('reads a number cell', () => {
    const bytes = createXlsx({ sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 3.14 }] }] });
    const { workbook } = parse(bytes);
    expect(workbook.sheets[0].getCell('A1')).toEqual({ type: 'number', value: 3.14 });
  });

  it('reads a shared string cell', () => {
    const bytes = createXlsx({
      sheets: [{ name: 'S', cells: [{ addr: 'B2', value: 'hello', type: 's' }] }],
    });
    const { workbook } = parse(bytes);
    expect(workbook.sheets[0].getCell('B2')).toEqual({ type: 'string', value: 'hello' });
  });

  it('reads an inline string cell', () => {
    const bytes = createXlsx({
      sheets: [{ name: 'S', cells: [{ addr: 'C3', value: 'inline', type: 'inlineStr' }] }],
    });
    const { workbook } = parse(bytes);
    expect(workbook.sheets[0].getCell('C3')).toEqual({ type: 'string', value: 'inline' });
  });

  it('reads a boolean cell', () => {
    const bytes = createXlsx({
      sheets: [{ name: 'S', cells: [{ addr: 'A1', value: true, type: 'b' }] }],
    });
    const { workbook } = parse(bytes);
    expect(workbook.sheets[0].getCell('A1')).toEqual({ type: 'boolean', value: true });
  });

  it('reads an error cell', () => {
    const bytes = createXlsx({
      sheets: [{ name: 'S', cells: [{ addr: 'A1', value: '#REF!', type: 'e' }] }],
    });
    const { workbook } = parse(bytes);
    expect(workbook.sheets[0].getCell('A1')).toEqual({ type: 'error', value: '#REF!' });
  });

  it('blank cells read as absent (undefined)', () => {
    const bytes = createXlsx({ sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 1 }] }] });
    const { workbook } = parse(bytes);
    expect(workbook.sheets[0].getCell('B1')).toBeUndefined();
  });

  it('can iterate populated cells', () => {
    const bytes = createXlsx({
      sheets: [
        {
          name: 'S',
          cells: [
            { addr: 'A1', value: 1 },
            { addr: 'B1', value: 2 },
            { addr: 'A2', value: 3 },
          ],
        },
      ],
    });
    const { workbook } = parse(bytes);
    const entries = [...workbook.sheets[0].cells()];
    expect(entries).toHaveLength(3);
    const addrs = entries.map(([a]) => a).sort();
    expect(addrs).toEqual(['A1', 'A2', 'B1']);
  });

  it('can iterate rows', () => {
    const bytes = createXlsx({
      sheets: [
        {
          name: 'S',
          cells: [
            { addr: 'A1', value: 10 },
            { addr: 'B1', value: 20 },
            { addr: 'A2', value: 30 },
          ],
        },
      ],
    });
    const { workbook } = parse(bytes);
    const rows = [...workbook.sheets[0].rows()];
    expect(rows).toHaveLength(2);
    expect(rows[0].cells[0]).toEqual({ type: 'number', value: 10 });
    expect(rows[0].cells[1]).toEqual({ type: 'number', value: 20 });
    expect(rows[1].cells[0]).toEqual({ type: 'number', value: 30 });
  });

  it('rows() reports the original worksheet line number, surviving blank gaps', () => {
    const bytes = createXlsx({
      sheets: [
        {
          name: 'S',
          cells: [
            { addr: 'A1', value: 'header', type: 's' },
            // Rows 2 and 3 are intentionally blank.
            { addr: 'A4', value: 100 },
            { addr: 'A7', value: 200 },
          ],
        },
      ],
    });
    const { workbook } = parse(bytes);
    const rows = [...workbook.sheets[0].rows()];
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.line)).toEqual([1, 4, 7]);
    expect(rows[1].cells[0]).toEqual({ type: 'number', value: 100 });
    expect(rows[2].cells[0]).toEqual({ type: 'number', value: 200 });
  });

  it('one malformed cell triggers one warning and leaves the rest intact', () => {
    const bytes = createXlsx({
      sheets: [
        {
          name: 'S',
          cells: [
            { addr: 'A1', value: 999 },
            { addr: 'B1', value: 99, type: 's' },
          ],
        },
      ],
    });
    const { workbook, warnings } = parse(bytes);
    expect(workbook.sheets[0].getCell('A1')).toEqual({ type: 'number', value: 999 });
    expect(workbook.sheets[0].getCell('B1')).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(warnings[0].code).toBe('INVALID_SHARED_STRING_INDEX');
  });
});

// ──────────────────────────────────────────────────────────────
// Ticket 04 – Re-serialize interpreted view
// ──────────────────────────────────────────────────────────────
describe('re-serialize interpreted view', () => {
  it('no-edit parse→serialize→re-parse yields identical cell values', () => {
    const bytes = createXlsx({
      sheets: [
        {
          name: 'Sheet1',
          cells: [
            { addr: 'A1', value: 42 },
            { addr: 'B1', value: 'text', type: 's' },
            { addr: 'C1', value: true, type: 'b' },
          ],
        },
      ],
    });

    const { workbook } = parse(bytes);
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);

    expect(wb2.sheets[0].getCell('A1')).toEqual({ type: 'number', value: 42 });
    expect(wb2.sheets[0].getCell('B1')).toEqual({ type: 'string', value: 'text' });
    expect(wb2.sheets[0].getCell('C1')).toEqual({ type: 'boolean', value: true });
  });

  it('shared-string indices are recomputed without aliasing', () => {
    const bytes = createXlsx({
      sheets: [
        {
          name: 'S',
          cells: [
            { addr: 'A1', value: 'foo', type: 's' },
            { addr: 'B1', value: 'bar', type: 's' },
            { addr: 'C1', value: 'foo', type: 's' },
          ],
        },
      ],
    });

    const { workbook } = parse(bytes);
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);

    expect(wb2.sheets[0].getCell('A1')).toEqual({ type: 'string', value: 'foo' });
    expect(wb2.sheets[0].getCell('B1')).toEqual({ type: 'string', value: 'bar' });
    expect(wb2.sheets[0].getCell('C1')).toEqual({ type: 'string', value: 'foo' });
  });

  it('unmodeled part survives interpreted-view re-serialize unchanged', () => {
    const EXTRA = '<?xml version="1.0"?><extra>PASS-THROUGH</extra>';
    const bytes = createXlsx({
      sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 1 }] }],
      extraParts: { 'xl/extra.xml': EXTRA },
      extraContentTypes: { '/xl/extra.xml': 'application/vnd.fake+xml' },
    });

    const { workbook } = parse(bytes);
    const out = serialize(workbook);
    const files = unzipSync(out);
    expect(decodeUtf8(files['xl/extra.xml'])).toBe(EXTRA);
  });
});

// ──────────────────────────────────────────────────────────────
// Ticket 05 – Read formulas
// ──────────────────────────────────────────────────────────────
describe('parse – formulas', () => {
  it('reads a formula cell with formula text and cached value', () => {
    const bytes = createXlsx({
      sheets: [
        {
          name: 'S',
          cells: [
            { addr: 'A1', value: 10 },
            { addr: 'B1', value: 42, formula: 'A1+32' },
          ],
        },
      ],
    });
    const { workbook } = parse(bytes);
    const cell = workbook.sheets[0].getCell('B1');
    expect(cell).toMatchObject({ type: 'number', value: 42, formula: 'A1+32' });
  });

  it('a non-formula cell has no formula property', () => {
    const bytes = createXlsx({ sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 5 }] }] });
    const { workbook } = parse(bytes);
    const cell = workbook.sheets[0].getCell('A1');
    expect(cell).not.toHaveProperty('formula');
  });

  it('expands shared formulas so each cell carries its own text', () => {
    // Build an xlsx with a shared formula SUM(B1) in A1 expanded to A1:A3
    const bytes = createXlsx({
      sheets: [
        {
          name: 'S',
          cells: [
            {
              addr: 'A1',
              value: 10,
              formula: 'B1+1',
              sharedFormulaRef: 'A1:A3',
              sharedFormulaIndex: 0,
            },
            { addr: 'A2', value: 20, formula: '', sharedFormulaIndex: 0 },
            { addr: 'A3', value: 30, formula: '', sharedFormulaIndex: 0 },
          ],
        },
      ],
    });

    const { workbook } = parse(bytes);
    const s = workbook.sheets[0];

    const a1 = s.getCell('A1');
    const a2 = s.getCell('A2');
    const a3 = s.getCell('A3');

    expect(a1).toMatchObject({ formula: 'B1+1' });
    expect(a2).toMatchObject({ formula: 'B2+1' });
    expect(a3).toMatchObject({ formula: 'B3+1' });
  });
});

// ──────────────────────────────────────────────────────────────
// Ticket 06 – Edit cells: setCell
// ──────────────────────────────────────────────────────────────
describe('Sheet.setCell', () => {
  it('setCell → serialize → re-parse reflects the new value', () => {
    const bytes = createXlsx({ sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 1 }] }] });
    const { workbook } = parse(bytes);
    workbook.sheets[0].setCell('A1', { type: 'number', value: 99 });
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);
    expect(wb2.sheets[0].getCell('A1')).toEqual({ type: 'number', value: 99 });
  });

  it('setting a value on a formula cell drops the formula', () => {
    const bytes = createXlsx({
      sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 42, formula: 'B1+1' }] }],
    });
    const { workbook } = parse(bytes);
    const before = workbook.sheets[0].getCell('A1');
    expect(before).toMatchObject({ formula: 'B1+1' });

    workbook.sheets[0].setCell('A1', { type: 'number', value: 0 });
    const cell = workbook.sheets[0].getCell('A1');
    expect(cell).not.toHaveProperty('formula');
  });

  it('setCell → serialize → re-parse has no formula in output', () => {
    const bytes = createXlsx({
      sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 42, formula: 'B1+1' }] }],
    });
    const { workbook } = parse(bytes);
    workbook.sheets[0].setCell('A1', { type: 'string', value: 'replaced' });
    workbook._fullCalcOnLoad = true;
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);
    const cell = wb2.sheets[0].getCell('A1');
    expect(cell).toEqual({ type: 'string', value: 'replaced' });
    expect(cell).not.toHaveProperty('formula');
  });

  it('serialized output carries fullCalcOnLoad when set', () => {
    const bytes = createXlsx({ sheets: [{ name: 'S', cells: [] }] });
    const { workbook } = parse(bytes);
    workbook._fullCalcOnLoad = true;
    const out = serialize(workbook);
    const outFiles = unzipSync(out);
    const wbXml = decodeUtf8(outFiles['xl/workbook.xml']);
    expect(wbXml).toContain('fullCalcOnLoad');
  });
});

// ──────────────────────────────────────────────────────────────
// Ticket 07 – addSheet
// ──────────────────────────────────────────────────────────────
describe('Workbook.addSheet', () => {
  it('addSheet → serialize → re-parse shows the new sheet in the list', () => {
    const bytes = createXlsx({ sheets: [{ name: 'Original', cells: [{ addr: 'A1', value: 1 }] }] });
    const { workbook } = parse(bytes);
    workbook.addSheet('NewSheet');
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);

    expect(wb2.sheets).toHaveLength(2);
    const names = wb2.sheets.map((s) => s.name);
    expect(names).toContain('Original');
    expect(names).toContain('NewSheet');
  });

  it('existing sheets survive addSheet unchanged', () => {
    const bytes = createXlsx({
      sheets: [{ name: 'Data', cells: [{ addr: 'C3', value: 'keep me', type: 's' }] }],
    });
    const { workbook } = parse(bytes);
    workbook.addSheet('Extra');
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);

    const data = wb2.sheets.find((s) => s.name === 'Data')!;
    expect(data.getCell('C3')).toEqual({ type: 'string', value: 'keep me' });
  });

  it('unmodeled parts survive addSheet', () => {
    const EXTRA = '<?xml version="1.0"?><extra>UNMODELED</extra>';
    const bytes = createXlsx({
      sheets: [{ name: 'S', cells: [] }],
      extraParts: { 'xl/extra.xml': EXTRA },
      extraContentTypes: { '/xl/extra.xml': 'application/vnd.fake+xml' },
    });
    const { workbook } = parse(bytes);
    workbook.addSheet('Second');
    const out = serialize(workbook);
    const files = unzipSync(out);
    expect(decodeUtf8(files['xl/extra.xml'])).toBe(EXTRA);
  });

  it('new sheet is appended (last in order)', () => {
    const bytes = createXlsx({ sheets: [{ name: 'A', cells: [] }] });
    const { workbook } = parse(bytes);
    workbook.addSheet('B');
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);
    expect(wb2.sheets[1].name).toBe('B');
  });
});

// ──────────────────────────────────────────────────────────────
// Ticket 08 – Real-world fixture round-trip
// ──────────────────────────────────────────────────────────────
describe('real-world fixture round-trip', () => {
  it('file with missing optional parts parses without throwing', () => {
    const bytes = createXlsx({
      sheets: [{ name: 'Sheet1', cells: [{ addr: 'A1', value: 'data', type: 's' }] }],
    });
    expect(() => parse(bytes)).not.toThrow();
  });

  it('parse → serialize → re-parse yields identical values (simulated real-world file)', () => {
    const bytes = createXlsx({
      sheets: [
        {
          name: 'Summary',
          cells: [
            { addr: 'A1', value: 'Product', type: 's' },
            { addr: 'B1', value: 'Revenue', type: 's' },
            { addr: 'A2', value: 'Widget', type: 's' },
            { addr: 'B2', value: 12345.67 },
            { addr: 'A3', value: 'Gadget', type: 's' },
            { addr: 'B3', value: 9876.54 },
          ],
        },
        { name: 'Raw', cells: [{ addr: 'A1', value: true, type: 'b' }] },
      ],
    });

    const { workbook } = parse(bytes);
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);

    expect(wb2.sheets).toHaveLength(2);
    expect(wb2.sheets[0].getCell('A1')).toEqual({ type: 'string', value: 'Product' });
    expect(wb2.sheets[0].getCell('B2')).toEqual({ type: 'number', value: 12345.67 });
    expect(wb2.sheets[1].getCell('A1')).toEqual({ type: 'boolean', value: true });
  });

  it('unmodeled parts byte-unchanged after round-trip', () => {
    const BYTES = 'binary-like-content-0xDEADBEEF';
    const bytes = createXlsx({
      sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 1 }] }],
      extraParts: { 'xl/vbaProject.bin': BYTES },
      extraContentTypes: { '/xl/vbaProject.bin': 'application/vnd.ms-office.vbaProject' },
    });
    const { workbook } = parse(bytes);
    const out = serialize(workbook);
    const files = unzipSync(out);
    expect(new TextDecoder().decode(files['xl/vbaProject.bin'])).toBe(BYTES);
  });

  it('setCell on a real-world fixture survives round-trip', () => {
    const bytes = createXlsx({
      sheets: [
        {
          name: 'Data',
          cells: [
            { addr: 'A1', value: 'old', type: 's' },
            { addr: 'A2', value: 100 },
          ],
        },
      ],
    });
    const { workbook } = parse(bytes);
    workbook.sheets[0].setCell('A1', { type: 'string', value: 'new' });
    workbook.sheets[0].setCell('A2', { type: 'number', value: 999 });
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);
    expect(wb2.sheets[0].getCell('A1')).toEqual({ type: 'string', value: 'new' });
    expect(wb2.sheets[0].getCell('A2')).toEqual({ type: 'number', value: 999 });
  });

  it('addSheet on a real-world fixture survives round-trip', () => {
    const bytes = createXlsx({
      sheets: [{ name: 'Sheet1', cells: [{ addr: 'A1', value: 'existing', type: 's' }] }],
    });
    const { workbook } = parse(bytes);
    const ns = workbook.addSheet('NewSheet');
    ns.setCell('A1', { type: 'number', value: 42 });
    const out = serialize(workbook);
    const { workbook: wb2 } = parse(out);
    expect(wb2.sheets.map((s) => s.name)).toContain('NewSheet');
    expect(wb2.sheets.find((s) => s.name === 'NewSheet')!.getCell('A1')).toEqual({
      type: 'number',
      value: 42,
    });
    expect(wb2.sheets.find((s) => s.name === 'Sheet1')!.getCell('A1')).toEqual({
      type: 'string',
      value: 'existing',
    });
  });
});

// ──────────────────────────────────────────────────────────────
// Resource limits (ZIP bomb / pathological archive defence)
// ──────────────────────────────────────────────────────────────
describe('parse – resource limits', () => {
  it('rejects a ZIP bomb before decompressing the oversized part', () => {
    // 50 MiB of zeros compresses to a few KiB; parseOpc must refuse it using
    // the central-directory size, never allocating the expanded buffer.
    const bomb = new Uint8Array(50 * 1024 * 1024);
    const valid = createXlsx({ sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 1 }] }] });
    const withBomb = unzipSync(valid);
    withBomb['xl/bomb.bin'] = bomb;
    const packed = zipSync(
      Object.fromEntries(Object.entries(withBomb).map(([k, v]) => [k, [v, { level: 6 }]])),
    );

    try {
      parse(packed, { maxPartBytes: 1024 * 1024 });
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(XlsxParseError);
      expect((e as XlsxParseError).code).toBe(XLSX_PARSE_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED);
    }
  });

  it('rejects an archive with too many entries', () => {
    const valid = createXlsx({ sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 1 }] }] });
    const files = unzipSync(valid);
    for (let i = 0; i < 50; i++) {
      files[`xl/junk${i}.bin`] = strToU8('x');
    }
    const packed = zipSync(
      Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: 0 }]])),
    );

    try {
      parse(packed, { maxEntries: 10 });
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as XlsxParseError).code).toBe(XLSX_PARSE_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED);
    }
  });

  it('rejects compressed input larger than the cap up front', () => {
    const valid = createXlsx({ sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 1 }] }] });
    try {
      parse(valid, { maxCompressedBytes: 10 });
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as XlsxParseError).code).toBe(XLSX_PARSE_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED);
    }
  });

  it('accepts a normal file under the default limits', () => {
    const valid = createXlsx({ sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 1 }] }] });
    expect(() => parse(valid)).not.toThrow();
  });
});

// ──────────────────────────────────────────────────────────────
// Lossless worksheet preservation (untouched sheets round-trip verbatim)
// ──────────────────────────────────────────────────────────────
describe('lossless worksheet preservation', () => {
  // A worksheet Part carrying formatting/merges/hyperlink wiring the interpreted
  // view does not model, plus its companion _rels Part.
  const RICH_SHEET =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheetData><row r="1"><c r="A1" s="3"><v>1</v></c></row></sheetData>' +
    '<mergeCells count="1"><mergeCell ref="A1:B1"/></mergeCells>' +
    '<hyperlinks><hyperlink ref="A1" r:id="rId1"/></hyperlinks>' +
    '</worksheet>';
  const SHEET_RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" ' +
    'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" ' +
    'Target="https://example.com/" TargetMode="External"/>' +
    '</Relationships>';

  function richFixture(): Uint8Array {
    const base = createXlsx({ sheets: [{ name: 'S', cells: [{ addr: 'A1', value: 1 }] }] });
    const files = unzipSync(base);
    files['xl/worksheets/sheet1.xml'] = strToU8(RICH_SHEET);
    files['xl/worksheets/_rels/sheet1.xml.rels'] = strToU8(SHEET_RELS);
    return zipSync(
      Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: 0 }]])),
    );
  }

  it('re-emits an unedited worksheet and its _rels byte-for-byte', () => {
    const { workbook } = parse(richFixture());
    const out = serialize(workbook);
    const files = unzipSync(out);
    expect(decodeUtf8(files['xl/worksheets/sheet1.xml'])).toBe(RICH_SHEET);
    expect(decodeUtf8(files['xl/worksheets/_rels/sheet1.xml.rels'])).toBe(SHEET_RELS);
  });

  it('editing one sheet rebuilds only that sheet; a sibling stays verbatim', () => {
    const base = createXlsx({
      sheets: [
        { name: 'Untouched', cells: [{ addr: 'A1', value: 1 }] },
        { name: 'Edited', cells: [{ addr: 'A1', value: 2 }] },
      ],
    });
    const files = unzipSync(base);
    files['xl/worksheets/sheet1.xml'] = strToU8(RICH_SHEET);
    files['xl/worksheets/_rels/sheet1.xml.rels'] = strToU8(SHEET_RELS);
    const bytes = zipSync(
      Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: 0 }]])),
    );

    const { workbook } = parse(bytes);
    workbook.sheets[1].setCell('A1', { type: 'number', value: 999 });
    const out = serialize(workbook);
    const outFiles = unzipSync(out);

    // Untouched sheet keeps its rich XML + rels verbatim…
    expect(decodeUtf8(outFiles['xl/worksheets/sheet1.xml'])).toBe(RICH_SHEET);
    expect(decodeUtf8(outFiles['xl/worksheets/_rels/sheet1.xml.rels'])).toBe(SHEET_RELS);

    // …while the edited sheet's new value survives a re-parse.
    const { workbook: wb2 } = parse(out);
    expect(wb2.sheets.find((s) => s.name === 'Edited')!.getCell('A1')).toEqual({
      type: 'number',
      value: 999,
    });
    expect(wb2.sheets.find((s) => s.name === 'Untouched')!.getCell('A1')).toEqual({
      type: 'number',
      value: 1,
    });
  });
});

// ──────────────────────────────────────────────────────────────
// Numeric parsing correctness
// ──────────────────────────────────────────────────────────────
describe('parse – numeric values', () => {
  function withRawNumber(raw: string): Uint8Array {
    const base = createXlsx({ sheets: [{ name: 'S', cells: [] }] });
    const files = unzipSync(base);
    files['xl/worksheets/sheet1.xml'] = strToU8(
      '<?xml version="1.0"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        `<sheetData><row r="1"><c r="A1"><v>${raw}</v></c></row></sheetData></worksheet>`,
    );
    return zipSync(
      Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: 0 }]])),
    );
  }

  it('skips partially-numeric junk like "12junk" with a warning', () => {
    const { workbook, warnings } = parse(withRawNumber('12junk'));
    expect(workbook.sheets[0].getCell('A1')).toBeUndefined();
    expect(warnings.some((w) => w.code === 'UNPARSEABLE_NUMBER')).toBe(true);
  });

  it('parses a clean number', () => {
    const { workbook } = parse(withRawNumber('12.5'));
    expect(workbook.sheets[0].getCell('A1')).toEqual({ type: 'number', value: 12.5 });
  });

  it('skips a non-finite token like "Infinity"', () => {
    const { workbook, warnings } = parse(withRawNumber('Infinity'));
    expect(workbook.sheets[0].getCell('A1')).toBeUndefined();
    expect(warnings.some((w) => w.code === 'UNPARSEABLE_NUMBER')).toBe(true);
  });
});
