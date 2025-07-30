export type DataType = 'FORMULA' | 'TEXT' | 'NUMBER' | 'ERROR';

export interface Cell {
  rawValue: string | number | null;
  dataType: DataType;
  value: string;
}

export type Dimension = {
  width: number;
  height: number;
}

export type Coordinate = {
  x: number;
  y: number;
}


export type CellCoordinate = {
  row: number;
  col: number;
}

export type Bounds = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};
