import { defaultFns, isErr, runFormula, type Context } from './Formulas'
import { useSpreadsheetStore } from './store/spreadsheetStore'
import type { Cell, Coordinate } from './Types'

export const isNumeric = (str: string): boolean => {
  return !isNaN(parseFloat(str)) && isFinite(Number(str))
}

export const parseCell = (input: string): Cell => {
  if (isNumeric(input)) {
    return {
      rawValue: parseFloat(input),
      dataType: 'NUMBER',
      value: input,
    }
  } else if (input.length && input[0] === '=') {
    // formula
    const formulaContext: Context = {
      getCell: (ref: string) => {
        const rowColRef = cellRefToCoord(ref)
        const cellData: Map<string, Cell> = useSpreadsheetStore.getState().cellData

        const cell = cellData.get(rowColRef)
        if (!cell || cell.dataType != 'NUMBER') return 0 // default if cell missing
        return parseFloat(cell.value)
      },
      functions: defaultFns(),
    }
    const formulaReturnValue = runFormula(input, formulaContext)
    if (isErr(formulaReturnValue)) {
      return {
        rawValue: input,
        dataType: 'ERROR',
        value: formulaReturnValue.code,
      }
    }
    return {
      rawValue: input,
      dataType: 'FORMULA',
      value: `${formulaReturnValue}`,
    }
  }
  return {
    rawValue: input,
    dataType: 'TEXT',
    value: input,
  }
}

export const colIndexToLabel = (index: number): string => {
  let label = ''
  while (index >= 0) {
    label = String.fromCharCode((index % 26) + 65) + label
    index = Math.floor(index / 26) - 1
  }
  return label
}

export const cellRefToCoord = (ref: string): string => {
  const match = ref.match(/^([A-Z]+)(\d+)$/i)
  if (!match) throw new Error(`Invalid cell reference: ${ref}`)

  const [, colLetters, rowStr] = match

  let col = 0
  for (let i = 0; i < colLetters.length; i++) {
    col *= 26
    col += colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1
  }

  const row = parseInt(rowStr, 10)
  return `${row - 1},${col - 1}`
}

export const getCell = (cellRef: string) => {
  const cellData = useSpreadsheetStore.getState().cellData
  const rowColForm = cellRefToCoord(cellRef)
  const cell = cellData.get(rowColForm)
  if (cell?.value) {
    return parseFloat(cell.value)
  }
  return 0
}

export const mouseCoordToSheetCoord = (
  e: MouseEvent,
  bounds: DOMRect,
  scrollOffset: Coordinate,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  cellHeight: number,
  cellWidth: number
) => {
  const x = e.clientX - bounds.left
  const y = e.clientY - bounds.top

  const col = Math.floor((x + scrollOffset.x - rowHeaderWidth) / cellWidth)
  const row = Math.floor((y + scrollOffset.y - columnHeaderHeight) / cellHeight)
  return { row, col }
}
