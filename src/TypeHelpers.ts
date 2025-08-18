import type { Bounds, CellCoordinate } from './Types'

export const isCellCoordinate = (range: CellCoordinate | Bounds) => {
  return 'row' in range && 'col' in range
}

export const isBounds = (range: CellCoordinate | Bounds) => {
  return 'top' in range && 'bottom' in range && 'left' in range && 'right' in range
}
