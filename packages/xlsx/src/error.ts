export const XLSX_PARSE_ERROR_CODES = {
  NOT_A_ZIP: 'NOT_A_ZIP',
  MISSING_CONTENT_TYPES: 'MISSING_CONTENT_TYPES',
  MISSING_WORKBOOK_PART: 'MISSING_WORKBOOK_PART',
  BROKEN_RELATIONSHIP_GRAPH: 'BROKEN_RELATIONSHIP_GRAPH',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',
} as const;

export type XlsxParseErrorCode =
  (typeof XLSX_PARSE_ERROR_CODES)[keyof typeof XLSX_PARSE_ERROR_CODES];

export class XlsxParseError extends Error {
  readonly code: XlsxParseErrorCode;

  constructor(code: XlsxParseErrorCode, message: string) {
    super(message);
    this.name = 'XlsxParseError';
    this.code = code;
  }
}
