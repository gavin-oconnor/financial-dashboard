import { create } from 'zustand'
import type { Bounds, Cell, CellCoordinate, ClipboardPointer } from '../Types'

interface SpreadsheetState {
  rowCount: number
  setRowCount: (rows: number) => void

  colCount: number
  setColCount: (cols: number) => void

  rowHeights: Record<number, number>
  setRowHeight: (row: number, height: number) => void
  resetRowHeight: (row: number) => void

  colWidths: Record<number, number>
  setColWidth: (col: number, width: number) => void
  resetColWidth: (col: number) => void

  defaultRowHeight: number

  defaultColWidth: number

  activeCell: CellCoordinate
  setActiveCell: (coord: CellCoordinate) => void

  cellData: Map<string, Cell>
  setCellData: (updater: (prev: Map<string, Cell>) => Map<string, Cell>) => void

  isEditing: boolean
  setIsEditing: (val: boolean) => void

  editingValue: string
  setEditingValue: (val: string) => void

  activeRange: Bounds | null
  setActiveRange: (range: Bounds | null) => void

  clipboardPointer: ClipboardPointer | null
  setClipboardPointer: (pointer: ClipboardPointer | null) => void
}

export const useSpreadsheetStore = create<SpreadsheetState>((set) => ({
  rowCount: 100,
  setRowCount: (rows) => {
    set({ rowCount: rows })
  },

  colCount: 100,
  setColCount: (cols) => {
    set({ colCount: cols })
  },

  rowHeights: {},
  colWidths: {},
  defaultRowHeight: 21,
  defaultColWidth: 100,

  setRowHeight: (row, height) =>
    set((state) => ({
      rowHeights: {
        ...state.rowHeights,
        [row]: height,
      },
    })),

  resetRowHeight: (row) =>
    set((state) => {
      const { [row]: _, ...rest } = state.rowHeights
      return { rowHeights: rest }
    }),

  setColWidth: (col, width) =>
    set((state) => ({
      colWidths: {
        ...state.colWidths,
        [col]: width,
      },
    })),

  resetColWidth: (col) =>
    set((state) => {
      const { [col]: _, ...rest } = state.colWidths
      return { colWidths: rest }
    }),

  activeCell: { row: 1, col: 1 },
  setActiveCell: (coord) => {
    set({ activeCell: coord })
  },

  cellData: new Map(),
  setCellData: (updater) =>
    set((state) => ({
      cellData: updater(state.cellData),
    })),

  isEditing: false,
  setIsEditing: (val) =>
    set((state) => ({
      isEditing: val,
      // if entering edit mode, cancel copy mode
      clipboardPointer:
        val && state.clipboardPointer
          ? { ...state.clipboardPointer, copyActive: false }
          : state.clipboardPointer,
    })),

  editingValue: '',
  setEditingValue: (val) => set({ editingValue: val }),

  activeRange: null,
  setActiveRange: (range) => set({ activeRange: range }),

  clipboardPointer: null,
  setClipboardPointer: (pointer) => set({ clipboardPointer: pointer }),
}))
