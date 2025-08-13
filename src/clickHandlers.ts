import { parseCell } from "./Services";
import { useSpreadsheetStore } from "./store/spreadsheetStore";
import type { Coordinate } from "./Types";

export const clickActivate = (e: MouseEvent, bounds: DOMRect, scrollOffset: Coordinate, rowHeaderWidth: number, columnHeaderHeight: number, rows: number, cols: number, cellHeight: number, cellWidth: number) => {
    // Calculate position relative to canvas
          const x = e.clientX - bounds.left;
          const y = e.clientY - bounds.top;
    
          // Adjust for scroll offsets and header sizes
          const col = Math.floor((x - rowHeaderWidth + scrollOffset.x) / cellWidth);
          const row = Math.floor((y - columnHeaderHeight + scrollOffset.y) / cellHeight);
    
          if (row >= 0 && row < rows && col >= 0 && col < cols) {
            const { isEditing, setCellData, setIsEditing, setEditingValue, setActiveCell, activeCell, editingValue, setActiveRange } = useSpreadsheetStore.getState();
            if (isEditing) {
              e.preventDefault();
              const key = `${activeCell.row},${activeCell.col}`;
              setCellData((prev) => {
                const newData = new Map(prev);
                newData.set(key, parseCell(editingValue));
                return newData;
              });
              setIsEditing(false);
              setEditingValue('')
            }
            setActiveRange(null);
            setActiveCell({ row, col });
          }
}

export const dblClickActivateEditing = (e: MouseEvent, bounds: DOMRect, scrollOffset: Coordinate, rowHeaderWidth: number, columnHeaderHeight: number, rows: number, cols: number, cellHeight: number, cellWidth: number) => {
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    
    const col = Math.floor((x + scrollOffset.x - rowHeaderWidth) / cellWidth);
    const row = Math.floor((y + scrollOffset.y - columnHeaderHeight) / cellHeight);
    
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
        const { setActiveCell, setIsEditing, cellData, setEditingValue } = useSpreadsheetStore.getState();
        setActiveCell({ row, col });
        setIsEditing(true);
        const cell = cellData.get(`${row},${col}`)
        if(cell && cell.rawValue) {
          setEditingValue(cell.rawValue.toString())
        }
        console.log(cellData);
    }
}