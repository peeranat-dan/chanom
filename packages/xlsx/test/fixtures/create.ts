import { strToU8, zipSync } from 'fflate';

export interface MinimalCell {
  addr: string;
  value: string | number | boolean;
  type?: 'n' | 's' | 'b' | 'e' | 'inlineStr';
  formula?: string;
  sharedFormulaIndex?: number;
  sharedFormulaRef?: string;
}

export interface MinimalSheet {
  name: string;
  cells: MinimalCell[];
}

export interface XlsxOptions {
  sheets: MinimalSheet[];
  extraParts?: Record<string, string>;
  extraContentTypes?: Record<string, string>;
  extraWorkbookRels?: Array<{ id: string; type: string; target: string }>;
}

function xml(str: string): Uint8Array {
  return strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${str}`);
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildContentTypes(
  sheets: MinimalSheet[],
  hasSharedStrings: boolean,
  extraContentTypes: Record<string, string>,
): Uint8Array {
  const overrides: string[] = [];
  overrides.push(
    `  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`,
  );
  if (hasSharedStrings) {
    overrides.push(
      `  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>`,
    );
  }
  sheets.forEach((_, i) => {
    overrides.push(
      `  <Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    );
  });
  for (const [name, ct] of Object.entries(extraContentTypes)) {
    overrides.push(`  <Override PartName="${esc(name)}" ContentType="${esc(ct)}"/>`);
  }
  return xml(
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n` +
      `  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n` +
      `  <Default Extension="xml" ContentType="application/xml"/>\n` +
      overrides.join('\n') +
      '\n' +
      `</Types>`,
  );
}

function buildRootRels(): Uint8Array {
  return xml(
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n` +
      `  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n` +
      `</Relationships>`,
  );
}

function buildWorkbookXml(sheets: MinimalSheet[]): Uint8Array {
  const sheetEls = sheets
    .map((s, i) => `    <sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('\n');
  return xml(
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n` +
      `  <sheets>\n${sheetEls}\n  </sheets>\n` +
      `</workbook>`,
  );
}

function buildWorkbookRels(
  sheets: MinimalSheet[],
  hasSharedStrings: boolean,
  extraRels: Array<{ id: string; type: string; target: string }>,
): Uint8Array {
  const rels: string[] = sheets.map(
    (_, i) =>
      `  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
  );
  if (hasSharedStrings) {
    rels.push(
      `  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>`,
    );
  }
  for (const r of extraRels) {
    rels.push(
      `  <Relationship Id="${esc(r.id)}" Type="${esc(r.type)}" Target="${esc(r.target)}"/>`,
    );
  }
  return xml(
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n` +
      rels.join('\n') +
      '\n' +
      `</Relationships>`,
  );
}

function collectStrings(sheets: MinimalSheet[]): string[] {
  const strings: string[] = [];
  const seen = new Set<string>();
  for (const sheet of sheets) {
    for (const cell of sheet.cells) {
      if (
        (cell.type === 's' || (!cell.type && typeof cell.value === 'string')) &&
        typeof cell.value === 'string'
      ) {
        if (!seen.has(cell.value)) {
          seen.add(cell.value);
          strings.push(cell.value);
        }
      }
    }
  }
  return strings;
}

function buildSharedStrings(strings: string[]): Uint8Array {
  const items = strings.map((s) => `  <si><t xml:space="preserve">${esc(s)}</t></si>`).join('\n');
  return xml(
    `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">\n` +
      (items ? `${items}\n` : '') +
      `</sst>`,
  );
}

function buildWorksheet(sheet: MinimalSheet, stringIndex: Map<string, number>): Uint8Array {
  const rows = new Map<string, MinimalCell[]>();
  for (const cell of sheet.cells) {
    const m = /^([A-Z]+)(\d+)$/.exec(cell.addr);
    if (!m) continue;
    const r = m[2];
    if (!rows.has(r)) rows.set(r, []);
    rows.get(r)!.push(cell);
  }

  const sortedRows = [...rows.keys()].sort((a, b) => Number(a) - Number(b));
  const rowEls: string[] = [];

  for (const r of sortedRows) {
    const cells = rows.get(r)!;
    const cellEls = cells.map((cell) => buildCellXml(cell, stringIndex));
    rowEls.push(`    <row r="${r}">\n${cellEls.join('\n')}\n    </row>`);
  }

  const sheetData = rowEls.length > 0 ? `\n${rowEls.join('\n')}\n  ` : '';
  return xml(
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n` +
      `  <sheetData>${sheetData}</sheetData>\n` +
      `</worksheet>`,
  );
}

function buildCellXml(cell: MinimalCell, stringIndex: Map<string, number>): string {
  const formulaParts: string[] = [];
  if (cell.formula !== undefined) {
    if (cell.sharedFormulaRef !== undefined) {
      formulaParts.push(
        `      <f t="shared" ref="${esc(cell.sharedFormulaRef)}" si="${cell.sharedFormulaIndex ?? 0}">${esc(cell.formula)}</f>`,
      );
    } else if (cell.sharedFormulaIndex !== undefined && !cell.formula) {
      formulaParts.push(`      <f t="shared" si="${cell.sharedFormulaIndex}"/>`);
    } else {
      formulaParts.push(`      <f>${esc(cell.formula)}</f>`);
    }
  }

  if (cell.type === 'b') {
    return `      <c r="${cell.addr}" t="b">\n${formulaParts.join('\n')}${formulaParts.length ? '\n' : ''}      <v>${cell.value ? '1' : '0'}</v>\n      </c>`;
  }
  if (cell.type === 'e') {
    return `      <c r="${cell.addr}" t="e">\n${formulaParts.join('\n')}${formulaParts.length ? '\n' : ''}      <v>${esc(String(cell.value))}</v>\n      </c>`;
  }
  if (cell.type === 'inlineStr') {
    return `      <c r="${cell.addr}" t="inlineStr">\n      <is><t xml:space="preserve">${esc(String(cell.value))}</t></is>\n      </c>`;
  }
  if (cell.type === 's' || (typeof cell.value === 'string' && !cell.type)) {
    const idx = stringIndex.get(String(cell.value)) ?? 0;
    return `      <c r="${cell.addr}" t="s">\n${formulaParts.join('\n')}${formulaParts.length ? '\n' : ''}      <v>${idx}</v>\n      </c>`;
  }
  if (typeof cell.value === 'number') {
    return `      <c r="${cell.addr}">\n${formulaParts.join('\n')}${formulaParts.length ? '\n' : ''}      <v>${cell.value}</v>\n      </c>`;
  }
  return `      <c r="${cell.addr}">\n      <v>${esc(String(cell.value))}</v>\n      </c>`;
}

export function createXlsx(opts: XlsxOptions): Uint8Array {
  const strings = collectStrings(opts.sheets);
  const hasSharedStrings = strings.length > 0;
  const stringIndex = new Map(strings.map((s, i) => [s, i]));

  const files: Record<string, Uint8Array> = {};

  files['[Content_Types].xml'] = buildContentTypes(
    opts.sheets,
    hasSharedStrings,
    opts.extraContentTypes ?? {},
  );
  files['_rels/.rels'] = buildRootRels();
  files['xl/workbook.xml'] = buildWorkbookXml(opts.sheets);
  files['xl/_rels/workbook.xml.rels'] = buildWorkbookRels(
    opts.sheets,
    hasSharedStrings,
    opts.extraWorkbookRels ?? [],
  );

  if (hasSharedStrings) {
    files['xl/sharedStrings.xml'] = buildSharedStrings(strings);
  }

  opts.sheets.forEach((sheet, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = buildWorksheet(sheet, stringIndex);
  });

  for (const [name, content] of Object.entries(opts.extraParts ?? {})) {
    files[name] = strToU8(content);
  }

  return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, [v, { level: 0 }]])));
}
