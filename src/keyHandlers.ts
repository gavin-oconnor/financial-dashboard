import type { Key } from 'react'
import { getCell, parseCell } from './Services'
import { useSpreadsheetStore } from './store/spreadsheetStore'
import type { Cell, ClipboardPointer } from './Types'
import { isBounds, isCellCoordinate } from './TypeHelpers'

export const handleArrowDown = (e: KeyboardEvent, rows: number) => {
  e.preventDefault()
  const { activeRange, activeCell } = useSpreadsheetStore.getState()
  const setActiveRange = useSpreadsheetStore.getState().setActiveRange
  const setActiveCell = useSpreadsheetStore.getState().setActiveCell
  if (e.shiftKey) {
    if (!activeRange && activeCell.row < rows - 1) {
      const newActiveRange = {
        top: activeCell.row,
        bottom: activeCell.row + 1,
        left: activeCell.col,
        right: activeCell.col,
      }
      setActiveRange(newActiveRange)
    } else {
      if (activeRange && activeRange.top < activeCell.row) {
        if (
          activeCell.row - activeRange.top === 1 &&
          activeRange.left == activeCell.col &&
          activeRange.right == activeCell.col
        ) {
          setActiveRange(null)
        } else {
          setActiveRange({ ...activeRange, top: activeRange.top + 1 })
        }
      } else if (activeRange && activeRange.bottom < rows - 1) {
        setActiveRange({ ...activeRange, bottom: activeRange.bottom + 1 })
      }
    }
  } else {
    if (activeCell.row < rows - 1) {
      setActiveCell({ row: activeCell.row + 1, col: activeCell.col })
      setActiveRange(null)
    }
  }
}

export const handleArrowUp = (e: KeyboardEvent) => {
  e.preventDefault()
  const { activeRange, activeCell } = useSpreadsheetStore.getState()
  const setActiveRange = useSpreadsheetStore.getState().setActiveRange
  const setActiveCell = useSpreadsheetStore.getState().setActiveCell
  if (e.shiftKey) {
    if (!activeRange && activeCell.row > 0) {
      const newActiveRange = {
        top: activeCell.row - 1,
        bottom: activeCell.row,
        left: activeCell.col,
        right: activeCell.col,
      }
      setActiveRange(newActiveRange)
    } else {
      if (activeRange && activeRange.bottom > activeCell.row) {
        if (
          activeRange.bottom - activeCell.row === 1 &&
          activeRange.left == activeCell.col &&
          activeRange.right == activeCell.col
        ) {
          setActiveRange(null)
        } else {
          setActiveRange({ ...activeRange, bottom: activeRange.bottom - 1 })
        }
      } else if (activeRange && activeRange.top > 0) {
        setActiveRange({ ...activeRange, top: activeRange.top - 1 })
      }
    }
  } else {
    if (activeCell.row > 0) {
      setActiveCell({ row: activeCell.row - 1, col: activeCell.col })
      setActiveRange(null)
    }
  }
}

export const handleArrowRight = (e: KeyboardEvent, cols: number) => {
  e.preventDefault()
  const { activeRange, activeCell } = useSpreadsheetStore.getState()
  const setActiveRange = useSpreadsheetStore.getState().setActiveRange
  const setActiveCell = useSpreadsheetStore.getState().setActiveCell
  if (e.shiftKey) {
    if (!activeRange && activeCell.col < cols - 1) {
      const newActiveRange = {
        top: activeCell.row,
        bottom: activeCell.row,
        left: activeCell.col,
        right: activeCell.col + 1,
      }
      setActiveRange(newActiveRange)
    } else {
      if (activeRange && activeRange.left < activeCell.col) {
        if (
          activeCell.col - activeRange.left === 1 &&
          activeRange.top === activeCell.row &&
          activeRange.bottom === activeCell.row
        ) {
          setActiveRange(null)
        } else {
          setActiveRange({ ...activeRange, left: activeRange.left + 1 })
        }
      } else if (activeRange && activeRange.right < cols - 1) {
        setActiveRange({ ...activeRange, right: activeRange.right + 1 })
      }
    }
  } else {
    if (activeCell.col < cols - 1) {
      setActiveCell({ row: activeCell.row, col: activeCell.col + 1 })
      setActiveRange(null)
    }
  }
}

export const handleArrowLeft = (e: KeyboardEvent) => {
  e.preventDefault()
  const { activeRange, activeCell } = useSpreadsheetStore.getState()
  const setActiveRange = useSpreadsheetStore.getState().setActiveRange
  const setActiveCell = useSpreadsheetStore.getState().setActiveCell
  if (e.shiftKey) {
    if (!activeRange && activeCell.col > 0) {
      const newActiveRange = {
        top: activeCell.row,
        bottom: activeCell.row,
        left: activeCell.col - 1,
        right: activeCell.col,
      }
      setActiveRange(newActiveRange)
    } else {
      if (activeRange && activeRange.right > activeCell.col) {
        if (
          activeRange.right - activeCell.col === 1 &&
          activeRange.top === activeCell.row &&
          activeRange.bottom === activeCell.row
        ) {
          setActiveRange(null)
        } else {
          setActiveRange({ ...activeRange, right: activeRange.right - 1 })
        }
      } else if (activeRange && activeRange.left > 0) {
        setActiveRange({ ...activeRange, left: activeRange.left - 1 })
      }
    }
  } else {
    if (activeCell.col > 0) {
      setActiveCell({ row: activeCell.row, col: activeCell.col - 1 })
      setActiveRange(null)
    }
  }
}

export const handleInputKey = (e: KeyboardEvent) => {
  const { setIsEditing, setEditingValue } = useSpreadsheetStore.getState()
  e.preventDefault()
  setIsEditing(true)
  setEditingValue(e.key)
}

export const handleEnter = (e: KeyboardEvent, rows: number) => {
  const {
    cellData,
    setCellData,
    activeCell,
    editingValue,
    setIsEditing,
    setEditingValue,
    setActiveCell,
    isEditing,
    activeRange,
  } = useSpreadsheetStore.getState()
  e.preventDefault()
  console.log(cellData)
  if (isEditing) {
    const key = `${activeCell.row},${activeCell.col}`
    setCellData((prev) => {
      const newData = new Map(prev)
      newData.set(key, parseCell(editingValue))
      return newData
    })
    setIsEditing(false)
    setEditingValue('')
  }
  // optionally move to the next cell
  if (activeRange) {
    if (activeCell.row === activeRange.bottom) {
      if (activeCell.col === activeRange.right) {
        // bottom right
        setActiveCell({
          col: activeRange.left,
          row: activeRange.top,
        })
      } else {
        // bottom, but not far right
        setActiveCell({
          col: activeCell.col + 1,
          row: activeRange.top,
        })
      }
    } else {
      // not bottom
      setActiveCell({
        col: activeCell.col,
        row: activeCell.row + 1,
      })
    }
  } else {
    setActiveCell({
      col: activeCell.col,
      row: Math.min(activeCell.row + 1, rows - 1),
    })
  }
}

export const handleTab = (e: KeyboardEvent, cols: number) => {
  const {
    setCellData,
    activeCell,
    editingValue,
    setIsEditing,
    setEditingValue,
    setActiveCell,
    isEditing,
    activeRange,
  } = useSpreadsheetStore.getState()
  e.preventDefault()
  if (isEditing) {
    const key = `${activeCell.row},${activeCell.col}`
    setCellData((prev) => {
      const newData = new Map(prev)
      newData.set(key, parseCell(editingValue))
      return newData
    })
    setIsEditing(false)
    setEditingValue('')
  }
  // optionally move to the next cell
  if (activeRange) {
    if (activeCell.col === activeRange.right) {
      if (activeCell.row === activeRange.bottom) {
        // bottom right
        setActiveCell({
          col: activeRange.left,
          row: activeRange.top,
        })
      } else {
        // far right, but not bottom
        setActiveCell({
          col: activeRange.left,
          row: activeCell.row + 1,
        })
      }
    } else {
      // not far right
      setActiveCell({
        col: activeCell.col + 1,
        row: activeCell.row,
      })
    }
  } else {
    setActiveCell({
      col: Math.min(activeCell.col + 1, cols - 1),
      row: activeCell.row,
    })
  }
}

export const handleBackspace = (e: KeyboardEvent) => {
  const { activeCell, setCellData, activeRange } = useSpreadsheetStore.getState()
  if (activeRange) {
    for (let i = activeRange.left; i <= activeRange.right; i++) {
      for (let j = activeRange.top; j <= activeRange.bottom; j++) {
        let key = `${j},${i}`
        setCellData((prev) => {
          const newData = new Map(prev)
          newData.delete(key)
          return newData
        })
      }
    }
  } else {
    const key = `${activeCell.row},${activeCell.col}`
    setCellData((prev) => {
      const newData = new Map(prev)
      newData.delete(key)
      return newData
    })
  }
}

export const handleCopy = () => {
  const { activeCell, activeRange, setClipboardPointer } = useSpreadsheetStore.getState()
  if (activeRange) {
    // copy range
    const newClipboardPointer: ClipboardPointer = {
      srcRange: { ...activeRange },
      copyActive: true,
      isCut: false,
    }
    setClipboardPointer(newClipboardPointer)
  } else {
    const newClipboardPointer: ClipboardPointer = {
      srcRange: { ...activeCell },
      copyActive: true,
      isCut: false,
    }
    setClipboardPointer(newClipboardPointer)
  }
}

export const handleCut = () => {
  const { activeCell, activeRange, setClipboardPointer } = useSpreadsheetStore.getState()
  if (activeRange) {
    // copy range
    const newClipboardPointer: ClipboardPointer = {
      srcRange: { ...activeRange },
      copyActive: true,
      isCut: true,
    }
    setClipboardPointer(newClipboardPointer)
  } else {
    const newClipboardPointer: ClipboardPointer = {
      srcRange: { ...activeCell },
      copyActive: true,
      isCut: true,
    }
    setClipboardPointer(newClipboardPointer)
  }
}

export const handlePaste = () => {
  const { clipboardPointer, setCellData, activeCell, cellData, setActiveRange } =
    useSpreadsheetStore.getState()
  if (!clipboardPointer) {
    return
  }
  if (clipboardPointer.isCut) {
    setCellData((prev) => {
      if (isCellCoordinate(clipboardPointer.srcRange)) {
        const keyBeingCopied = `${clipboardPointer.srcRange.row},${clipboardPointer.srcRange.col}`
        if (cellData.has(keyBeingCopied)) {
          const newData = new Map(prev)
          const key = `${activeCell.row},${activeCell.col}`
          const partial = newData.get(keyBeingCopied)
          const cell: Cell = {
            rawValue: partial?.rawValue ?? null,
            dataType: partial?.dataType ?? 'TEXT',
            value: partial?.value ?? '',
          }
          newData.set(key, cell)
          newData.delete(keyBeingCopied)
          return newData
        }
      } else {
        const newData = new Map(prev)
        for (
          let row = clipboardPointer.srcRange.top;
          row <= clipboardPointer.srcRange.bottom;
          row++
        ) {
          for (
            let col = clipboardPointer.srcRange.left;
            col <= clipboardPointer.srcRange.right;
            col++
          ) {
            const rowOffset = row - clipboardPointer.srcRange.top
            const colOffset = col - clipboardPointer.srcRange.left
            const keyBeingCopied = `${row},${col}`
            if (cellData.has(keyBeingCopied)) {
              const key = `${activeCell.row + rowOffset},${activeCell.col + colOffset}`
              const partial = newData.get(keyBeingCopied)
              const cell: Cell = {
                rawValue: partial?.rawValue ?? null,
                dataType: partial?.dataType ?? 'TEXT', // whatever your default is
                value: partial?.value ?? '',
              }

              newData.set(key, cell)
              newData.delete(keyBeingCopied)
            }
          }
        }
        return newData
      }
    })
    if (isBounds(clipboardPointer.srcRange)) {
      const newActiveRange = {
        top: activeCell.row,
        bottom: activeCell.row + (clipboardPointer.srcRange.bottom - clipboardPointer.srcRange.top),
        left: activeCell.col,
        right: activeCell.col + (clipboardPointer.srcRange.right - clipboardPointer.srcRange.left),
      }
      setActiveRange(newActiveRange)
    }
  } else {
    setCellData((prev) => {
      if (isCellCoordinate(clipboardPointer.srcRange)) {
        const keyBeingCopied = `${clipboardPointer.srcRange.row},${clipboardPointer.srcRange.col}`
        if (cellData.has(keyBeingCopied)) {
          const newData = new Map(prev)
          const key = `${activeCell.row},${activeCell.col}`
          const partial = newData.get(keyBeingCopied)
          const cell: Cell = {
            rawValue: partial?.rawValue ?? null,
            dataType: partial?.dataType ?? 'TEXT',
            value: partial?.value ?? '',
          }
          newData.set(key, cell)
          return newData
        }
      } else {
        const newData = new Map(prev)
        for (
          let row = clipboardPointer.srcRange.top;
          row <= clipboardPointer.srcRange.bottom;
          row++
        ) {
          for (
            let col = clipboardPointer.srcRange.left;
            col <= clipboardPointer.srcRange.right;
            col++
          ) {
            const rowOffset = row - clipboardPointer.srcRange.top
            const colOffset = col - clipboardPointer.srcRange.left
            const keyBeingCopied = `${row},${col}`
            if (cellData.has(keyBeingCopied)) {
              const key = `${activeCell.row + rowOffset},${activeCell.col + colOffset}`
              const partial = newData.get(keyBeingCopied)
              const cell: Cell = {
                rawValue: partial?.rawValue ?? null,
                dataType: partial?.dataType ?? 'TEXT', // whatever your default is
                value: partial?.value ?? '',
              }
              newData.set(key, cell)
            }
          }
        }
        return newData
      }
    })
    if (isBounds(clipboardPointer.srcRange)) {
      const newActiveRange = {
        top: activeCell.row,
        bottom: activeCell.row + (clipboardPointer.srcRange.bottom - clipboardPointer.srcRange.top),
        left: activeCell.col,
        right: activeCell.col + (clipboardPointer.srcRange.right - clipboardPointer.srcRange.left),
      }
      setActiveRange(newActiveRange)
    }
  }
}
