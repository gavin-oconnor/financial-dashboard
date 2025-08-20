import { parseCell } from './Services'
import { useSpreadsheetStore } from './store/spreadsheetStore'

export const clickActivate = (row: number, col: number, rows: number, cols: number) => {
  // Calculate position relative to canvas
  if (row === -1 && col >= 0) {
    const { setCellData, activeCell, editingValue, isEditing } = useSpreadsheetStore.getState()
    if (isEditing) {
      const key = `${activeCell.row},${activeCell.col}`
      setCellData((prev) => {
        const newData = new Map(prev)
        newData.set(key, parseCell(editingValue))
        return newData
      })
    }
    useSpreadsheetStore.setState({
      activeCell: { row: 0, col },
      activeRange: { top: 0, right: col, left: col, bottom: rows - 1 },
    })
  } else if (col === -1 && row >= 0) {
    const { setCellData, activeCell, editingValue, isEditing } = useSpreadsheetStore.getState()
    if (isEditing) {
      const key = `${activeCell.row},${activeCell.col}`
      setCellData((prev) => {
        const newData = new Map(prev)
        newData.set(key, parseCell(editingValue))
        return newData
      })
    }
    useSpreadsheetStore.setState({
      activeCell: { row, col: 0 },
      activeRange: { top: row, bottom: row, left: 0, right: cols - 1 },
    })
  } else if (row >= 0 && row < rows && col >= 0 && col < cols) {
    const { setCellData, activeCell, editingValue, isEditing } = useSpreadsheetStore.getState()
    if (isEditing) {
      const key = `${activeCell.row},${activeCell.col}`
      setCellData((prev) => {
        const newData = new Map(prev)
        newData.set(key, parseCell(editingValue))
        return newData
      })
    }
    useSpreadsheetStore.setState({
      activeRange: null,
      activeCell: { row, col },
    })
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
  // remove when we want to drag for ranges of rows/cols
  if (row === -1 || col === -1) {
    return
  }
  const activeRangeRow: number = Math.min(Math.max(row, 0), rows - 1)
  const activeRangeCol: number = Math.min(Math.max(col, 0), cols - 1)
  const { activeCell, setActiveRange } = useSpreadsheetStore.getState()
  if (activeRangeCol === activeCell.col && activeRangeRow === activeCell.row) {
    const currentRange = useSpreadsheetStore.getState().activeRange
    const isFullRow = currentRange && currentRange.left === 0 && currentRange.right === cols - 1
    const isFullCol = currentRange && currentRange.top === 0 && currentRange.bottom === rows - 1

    if (!isFullRow && !isFullCol) {
      setActiveRange(null)
      return
    }
  }
  const newActiveRange = {
    top: Math.min(activeCell.row, activeRangeRow),
    bottom: Math.max(activeCell.row, activeRangeRow),
    left: Math.min(activeCell.col, activeRangeCol),
    right: Math.max(activeCell.col, activeRangeCol),
  }
  setActiveRange(newActiveRange)
}
