import { colIndexToLabel } from "./Services";
import { useSpreadsheetStore } from "./store/spreadsheetStore";
import type { Coordinate, Dimension } from "./Types";

export const drawCanvas = (ctx: CanvasRenderingContext2D, scrollOffset: Coordinate, viewportSize: Dimension, cellWidth: number, cellHeight: number, rows: number, cols: number, rowHeaderWidth: number, columnHeaderHeight: number) => {
    const { cellData, activeCell, activeRange } = useSpreadsheetStore.getState();

    const startCol = Math.floor(scrollOffset.x / cellWidth);
        const endCol = Math.min(cols, Math.ceil((scrollOffset.x + viewportSize.width) / cellWidth));
        const startRow = Math.floor(scrollOffset.y / cellHeight);
        const endRow = Math.min(rows, Math.ceil((scrollOffset.y + viewportSize.height) / cellHeight));
        for (let row = startRow; row < endRow; row++) {
          for (let col = startCol; col < endCol; col++) {
            const x = col * cellWidth - scrollOffset.x + rowHeaderWidth;
            const y = row * cellHeight - scrollOffset.y + columnHeaderHeight;
    
            ctx.fillStyle = 'white';
            ctx.fillRect(x, y, cellWidth, cellHeight);
    
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(x, y, cellWidth, cellHeight);
            if (cellData.has(`${[row]},${[col]}`)) {
              ctx.fillStyle = 'black';
              ctx.font = '12px sans-serif';
              ctx.fillText(cellData.get(`${[row]},${[col]}`)?.value ?? '', x + 5, y + 15);
            }
            if (activeRange && activeRange.top <= row && row <= activeRange.bottom && activeRange.left <= col && activeRange.right >= col) {
              ctx.fillStyle = 'rgb(84, 178, 255, 0.5)';
              ctx.fillRect(x, y, cellWidth, cellHeight);
            }
    
          }
        }
        if (startRow <= activeCell.row && activeCell.row < endRow && startCol <= activeCell.col && activeCell.col < endCol) {
          const x = activeCell.col * cellWidth - scrollOffset.x + rowHeaderWidth;
          const y = activeCell.row * cellHeight - scrollOffset.y + columnHeaderHeight;
          ctx.strokeStyle = 'green';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cellWidth, cellHeight);
          ctx.strokeStyle = '#ccc';
          ctx.lineWidth = 1;
        }
        for (let col = startCol; col < endCol; col++) {
          const x = col * cellWidth - scrollOffset.x + rowHeaderWidth;
          const y = 0
          ctx.fillStyle = '#e1e1e1';
          ctx.fillRect(x, y, cellWidth, cellHeight);
          ctx.strokeStyle = '#ccc';
          ctx.strokeRect(x, y, cellWidth, cellHeight);
          ctx.fillStyle = 'rgb(50,50,50)';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${colIndexToLabel(col)}`, x + cellWidth / 2, y + cellHeight / 2);
        }
        for (let row = startRow; row < endRow; row++) {
          const x = 0
          const y = (row + 1) * cellHeight - scrollOffset.y
          ctx.fillStyle = '#e1e1e1';
          ctx.fillRect(x, y, rowHeaderWidth, cellHeight);
          ctx.strokeStyle = '#ccc';
          ctx.strokeRect(x, y, rowHeaderWidth, cellHeight);
          ctx.fillStyle = 'rgb(50,50,50)';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${row + 1}`, x + rowHeaderWidth / 2, y + cellHeight / 2);
        }
        const x = 0
        const y = 0;
        ctx.fillStyle = '#e1e1e1';
        ctx.fillRect(x, y, rowHeaderWidth, cellHeight);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x, y, rowHeaderWidth, cellHeight);
}