export interface NumberCellValue {
  readonly type: 'number';
  readonly value: number;
  readonly formula?: string;
}

export interface StringCellValue {
  readonly type: 'string';
  readonly value: string;
  readonly formula?: string;
}

export interface BooleanCellValue {
  readonly type: 'boolean';
  readonly value: boolean;
  readonly formula?: string;
}

export interface ErrorCellValue {
  readonly type: 'error';
  readonly value: string;
  readonly formula?: string;
}

export type CellValue = NumberCellValue | StringCellValue | BooleanCellValue | ErrorCellValue;

export type SetCellValue =
  | Omit<NumberCellValue, 'formula'>
  | Omit<StringCellValue, 'formula'>
  | Omit<BooleanCellValue, 'formula'>
  | Omit<ErrorCellValue, 'formula'>;

export interface Warning {
  readonly code: string;
  readonly message: string;
  readonly address?: string;
}

export interface Relationship {
  readonly id: string;
  readonly type: string;
  readonly target: string;
  readonly targetMode?: string;
}
