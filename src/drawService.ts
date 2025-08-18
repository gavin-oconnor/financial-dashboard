import { colIndexToLabel } from './Services'
import { useSpreadsheetStore } from './store/spreadsheetStore'
import type { Bounds, Cell, CellCoordinate, Coordinate, Dimension } from './Types'

export const drawCanvas = (
  ctx: CanvasRenderingContext2D,
  scrollOffset: Coordinate,
  viewportSize: Dimension,
  cellWidth: number,
  cellHeight: number,
  rows: number,
  cols: number,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  isDragging: boolean
) => {
  const { cellData, activeCell, activeRange } = useSpreadsheetStore.getState()

  const startCol = Math.floor(scrollOffset.x / cellWidth)
  const endCol = Math.min(cols, Math.ceil((scrollOffset.x + viewportSize.width) / cellWidth))
  const startRow = Math.floor(scrollOffset.y / cellHeight)
  const endRow = Math.min(rows, Math.ceil((scrollOffset.y + viewportSize.height) / cellHeight))

  drawCells(
    ctx,
    scrollOffset,
    cellWidth,
    cellHeight,
    rowHeaderWidth,
    columnHeaderHeight,
    startRow,
    startCol,
    endRow,
    endCol,
    cellData,
    activeRange
  )

  drawActiveCell(
    ctx,
    scrollOffset,
    cellWidth,
    cellHeight,
    rowHeaderWidth,
    columnHeaderHeight,
    startRow,
    startCol,
    endRow,
    endCol,
    activeCell
  )

  drawActiveRangeBorder(
    ctx,
    scrollOffset,
    cellWidth,
    cellHeight,
    rowHeaderWidth,
    columnHeaderHeight,
    isDragging,
    activeRange
  )

  drawRowLabels(ctx, startRow, endRow, scrollOffset, cellHeight, rowHeaderWidth)
  drawColumnLabels(ctx, startCol, endCol, scrollOffset, cellWidth, cellHeight, rowHeaderWidth)

  drawColRowLabelDivider(ctx, cellHeight, rowHeaderWidth)

  // draw active range border when dragging is not active
}

const drawCells = (
  ctx: CanvasRenderingContext2D,
  scrollOffset: Coordinate,
  cellWidth: number,
  cellHeight: number,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  cellData: Map<String, Cell>,
  activeRange: Bounds | null
) => {
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const x = col * cellWidth - scrollOffset.x + rowHeaderWidth
      const y = row * cellHeight - scrollOffset.y + columnHeaderHeight

      ctx.fillStyle = 'white'
      ctx.fillRect(x, y, cellWidth, cellHeight)

      ctx.strokeStyle = '#ccc'
      ctx.strokeRect(x, y, cellWidth, cellHeight)
      if (cellData.has(`${[row]},${[col]}`)) {
        ctx.fillStyle = 'black'
        ctx.font = '12px sans-serif'
        ctx.fillText(cellData.get(`${[row]},${[col]}`)?.value ?? '', x + 5, y + 15)
      }
      if (
        activeRange &&
        activeRange.top <= row &&
        row <= activeRange.bottom &&
        activeRange.left <= col &&
        activeRange.right >= col
      ) {
        ctx.fillStyle = 'rgb(84, 178, 255, 0.5)'
        ctx.fillRect(x, y, cellWidth, cellHeight)
      }
    }
  }
}

const drawActiveCell = (
  ctx: CanvasRenderingContext2D,
  scrollOffset: Coordinate,
  cellWidth: number,
  cellHeight: number,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  activeCell: CellCoordinate
) => {
  if (
    startRow <= activeCell.row &&
    activeCell.row < endRow &&
    startCol <= activeCell.col &&
    activeCell.col < endCol
  ) {
    const x = activeCell.col * cellWidth - scrollOffset.x + rowHeaderWidth
    const y = activeCell.row * cellHeight - scrollOffset.y + columnHeaderHeight
    ctx.strokeStyle = 'rgb(33, 73, 105)'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, cellWidth, cellHeight)
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
  }
}

const drawColRowLabelDivider = (
  ctx: CanvasRenderingContext2D,
  cellHeight: number,
  rowHeaderWidth: number
) => {
  const x = 0
  const y = 0
  ctx.fillStyle = '#e1e1e1'
  ctx.fillRect(x, y, rowHeaderWidth, cellHeight)
  ctx.strokeStyle = '#ccc'
  ctx.strokeRect(x, y, rowHeaderWidth, cellHeight)
}

const drawColumnLabels = (
  ctx: CanvasRenderingContext2D,
  startCol: number,
  endCol: number,
  scrollOffset: Coordinate,
  cellWidth: number,
  cellHeight: number,
  rowHeaderWidth: number
) => {
  for (let col = startCol; col < endCol; col++) {
    const x = col * cellWidth - scrollOffset.x + rowHeaderWidth
    const y = 0
    ctx.fillStyle = '#e1e1e1'
    ctx.fillRect(x, y, cellWidth, cellHeight)
    ctx.strokeStyle = '#ccc'
    ctx.strokeRect(x, y, cellWidth, cellHeight)
    ctx.fillStyle = 'rgb(50,50,50)'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${colIndexToLabel(col)}`, x + cellWidth / 2, y + cellHeight / 2)
  }
}

const drawRowLabels = (
  ctx: CanvasRenderingContext2D,
  startRow: number,
  endRow: number,
  scrollOffset: Coordinate,
  cellHeight: number,
  rowHeaderWidth: number
) => {
  for (let row = startRow; row < endRow; row++) {
    const x = 0
    const y = (row + 1) * cellHeight - scrollOffset.y
    ctx.fillStyle = '#e1e1e1'
    ctx.fillRect(x, y, rowHeaderWidth, cellHeight)
    ctx.strokeStyle = '#ccc'
    ctx.strokeRect(x, y, rowHeaderWidth, cellHeight)
    ctx.fillStyle = 'rgb(50,50,50)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${row + 1}`, x + rowHeaderWidth / 2, y + cellHeight / 2)
  }
}

const drawActiveRangeBorder = (
  ctx: CanvasRenderingContext2D,
  scrollOffset: Coordinate,
  cellWidth: number,
  cellHeight: number,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  isDragging: boolean,
  activeRange: Bounds | null
) => {
  if (!isDragging && activeRange) {
    const activeRangeX = activeRange.left * cellWidth - scrollOffset.x + rowHeaderWidth
    const activeRangeY = activeRange.top * cellHeight - scrollOffset.y + columnHeaderHeight
    ctx.strokeStyle = 'rgb(59, 125, 179, 1)'
    ctx.strokeRect(
      activeRangeX,
      activeRangeY,
      (activeRange.right - activeRange.left + 1) * cellWidth,
      (activeRange.bottom - activeRange.top + 1) * cellHeight
    )
  }
}
