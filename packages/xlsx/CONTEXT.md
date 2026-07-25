# Context: xlsx

A lossless-by-default `.xlsx` (ECMA-376 SpreadsheetML) parse-and-write library.

## Scope

- **In:** `.xlsx` only (OOXML SpreadsheetML). Read and write.
- **Out (for now):** `.xls`, `.xlsb`, `.ods`, CSV, HTML tables.

## Glossary

### Package (OPC Package)

The `.xlsx` file as a whole: a ZIP archive conforming to the Open Packaging Conventions. Container for Parts, their relationships, and the content-type manifest. Not to be confused with an npm "package".

### Part

One entry inside the Package, identified by a package path (e.g. `/xl/worksheets/sheet1.xml`). Holds raw bytes plus a content type. The OPC-level unit of truth. Every byte of a parsed file lives in some Part.

### Interpreted view (Workbook model)

The typed, in-memory representation layered _over_ specific Parts - Workbook, Sheet, Cell, etc. A **view**, not the whole truth: it covers only the Parts the library understands. Parts outside the view (charts, pivot tables, VBA, future spec additions) still exist as raw Parts.

### Lossless (part-preserving)

The write guarantee: on write, any Part not modified through the interpreted view is re-emitted **verbatim as its original raw bytes**. Only Parts touched via the model are re-serialized. Unknown/unmodeled Parts survive by construction. This is _part-preserving_, not byte-identical (the Package as a whole may differ in compression/whitespace) and not merely semantically-equivalent (nothing modeled-away is dropped).

### Relationship (.rels)

The wiring between Parts, declared in `.rels` Parts. Determines which Part references which. Preserved as part of the Package truth.

### Interpreted boundary

The exact set of Parts the library parses into the interpreted view. For v1:
`workbook.xml`, the worksheet Parts, and `sharedStrings.xml` - **cell values
only**. Everything else (`styles.xml`, `theme.xml`, charts, pivots, calc chain,
defined names, VBA, ...) is unmodeled and passes through verbatim.

A worksheet Part is only re-serialized from the model when its cell values are
actually edited (`setCell`) or it is newly created (`addSheet`). An **unedited**
worksheet - and its companion `_rels` Part - is re-emitted from its original raw
bytes, so within-worksheet formatting, merged cells, hyperlinks, validations and
row/column properties survive untouched (see ADR-0002). The losslessness
boundary is therefore _per-edited-sheet_: only a sheet whose values you change
is rebuilt from the cell-value model (and thus drops that sheet's unmodeled
worksheet-internal features); every other Part is safe by construction.

`sharedStrings.xml` passes through verbatim (unedited sheets still index into
it); edited/new sheets write their strings inline so they never depend on the
shared table's indexing.

### Raw typed value

A Cell's value as one of the primitive spreadsheet types - number, string,
boolean (and the empty/blank case) - **without** number-format interpretation.
The library reads the underlying stored value; it does not decide whether
`45000` "means" a date or currency, because `styles.xml` is outside the
interpreted boundary for v1.

## Decided API shape

- **Parse:** whole-file-in-memory, async. `Uint8Array` / `Buffer` in →
  `Workbook` out (`parse(bytes): Promise<Workbook>`). Streaming is a non-goal:
  ZIP's central directory is at the file end and part-preserving requires all
  Part bytes in memory anyway, so streaming fights the core design. A streaming
  _row iterator_ over an already-parsed sheet may be added later as a read
  convenience without changing the entry point.
- **Cell value:** normalized discriminated union (`number` / `string` /
  `boolean` / `error`; blank = absent). Shared-vs-inline string encoding is
  hidden (writer's choice). `formula` is an optional companion on the value
  variant; the value itself is the cached last-computed result.
- **Formulas:** shared formulas expanded on read (each cell carries full formula
  text); emitted as plain `<f>` on write. Editing a value drops its `formula`;
  on write set `fullCalcOnLoad` so Excel recomputes stale cached results.

## Decided API shape (cont.)

- **Edit model:** mutable `Workbook`. `parse()` returns a workbook you mutate in
  place (`sheet.setCell(...)`, `workbook.addSheet(...)`). Raw Part bytes for
  unmodeled Parts are held immutably alongside as the pass-through reservoir.
- **Serialize:** `serialize(workbook): Uint8Array` is a pure read of the
  workbook's current state - re-serialize only the sheets that were edited/added,
  splice in every untouched raw Part (unedited worksheets and their `_rels`,
  `sharedStrings.xml`, and all unmodeled Parts) verbatim. Does not
  mutate/consume the workbook.

- **Resource limits:** `parse(bytes, limits?)` enforces structural caps
  (`maxCompressedBytes`, `maxPartBytes`, `maxTotalUncompressedBytes`,
  `maxEntries`) before/while unzipping, using ZIP central-directory sizes so an
  oversized part is rejected _before_ it is decompressed. Defaults live in
  `DEFAULT_OPC_LIMITS`. Row/cell caps (e.g. the import feature's 500-row limit)
  are application policy, not library policy, and live in the caller.

### Warning (diagnostic)

A non-fatal record attached to a parse result (`warnings[]`) describing malformed
_interpreted content_ the parser skipped rather than threw on (e.g. a bad cell
ref, an out-of-range shared-string index). The offending content is dropped
(cell blank/absent), never guessed-at - so it stays part-preserving-honest.

## Error model (layered)

- **Package/OPC structure** (not a zip, no content-types, no workbook part,
  broken relationship graph) → **throw** a typed `XlsxParseError` (with a code).
  Unrecoverable.
- **Interpreted-Part content** (bad cell ref, out-of-range string index,
  unparseable number) → **lenient**: skip/blank the offending item, record a
  `warning`, keep parsing. One junk cell never fails a large file.
- **Unmodeled Parts** → **immune**: never parsed, pass through verbatim however
  malformed.

Strict mode (promote content warnings to throws) is a later opt-in, not v1.

## Open questions

- Adding a new cell can only reference pre-existing styles (styles pass through
  verbatim) - is "no new formatting" acceptable for v1 edit? (Accepted for v1.)
