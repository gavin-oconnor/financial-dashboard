import { create } from 'zustand'
import type { Bounds, Cell, CellCoordinate, ClipboardPointer } from '../Types'

interface SpreadsheetState {
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
