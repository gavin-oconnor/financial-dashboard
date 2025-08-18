import { parseCell } from './Services'
import { useSpreadsheetStore } from './store/spreadsheetStore'

export const clickActivate = (row: number, col: number, rows: number, cols: number) => {
  // Calculate position relative to canvas
  if (row >= 0 && row < rows && col >= 0 && col < cols) {
    const { setActiveCell, setActiveRange, setCellData, activeCell, editingValue, isEditing } =
      useSpreadsheetStore.getState()
    if (isEditing) {
      const key = `${activeCell.row},${activeCell.col}`
      setCellData((prev) => {
        const newData = new Map(prev)
        newData.set(key, parseCell(editingValue))
        return newData
      })
    }
    setActiveRange(null)
    setActiveCell({ row, col })
  }
}

export const dblClickActivateEditing = (row: number, col: number, rows: number, cols: number) => {
  if (row >= 0 && row < rows && col >= 0 && col < cols) {
    const { setActiveCell, setIsEditing, cellData, setEditingValue } =
      useSpreadsheetStore.getState()
    setActiveCell({ row, col })
    setIsEditing(true)
    const cell = cellData.get(`${row},${col}`)
    if (cell && cell.rawValue) {
      setEditingValue(cell.rawValue.toString())
    }
  }
}

export const dragToActiveRange = (row: number, col: number, rows: number, cols: number) => {
  const activeRangeRow: number = Math.min(Math.max(row, 0), rows - 1)
  const activeRangeCol: number = Math.min(Math.max(col, 0), cols - 1)
  const { activeCell, setActiveRange } = useSpreadsheetStore.getState()
  if (activeRangeCol === activeCell.col && activeRangeRow === activeCell.row) {
    setActiveRange(null)
    return
  }
  const newActiveRange = {
    top: Math.min(activeCell.row, activeRangeRow),
    bottom: Math.max(activeCell.row, activeRangeRow),
    left: Math.min(activeCell.col, activeRangeCol),
    right: Math.max(activeCell.col, activeRangeCol),
  }
  setActiveRange(newActiveRange)
}
