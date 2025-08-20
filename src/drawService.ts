import { colIndexToLabel } from './Services'
import { useSpreadsheetStore } from './store/spreadsheetStore'
import { isBounds } from './TypeHelpers'
import type { Bounds, Cell, CellCoordinate, ClipboardPointer, Coordinate, Dimension } from './Types'

export const drawCanvas = (
  ctx: CanvasRenderingContext2D,
  scrollOffset: Coordinate,
  viewportSize: Dimension,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  isDragging: boolean
) => {
  const { cellData, activeCell, activeRange, clipboardPointer, rowCount, colCount } =
    useSpreadsheetStore.getState()

  const { startRow, endRow, startCol, endCol } = getVisibleRange(scrollOffset, viewportSize)

  drawCells(
    ctx,
    scrollOffset,
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
    rowHeaderWidth,
    columnHeaderHeight,
    isDragging,
    activeRange
  )

  drawCopyModeRange(ctx, scrollOffset, rowHeaderWidth, columnHeaderHeight, clipboardPointer)

  drawRowLabels(
    ctx,
    startRow,
    endRow,
    scrollOffset,
    rowHeaderWidth,
    columnHeaderHeight,
    activeCell,
    activeRange
  )
  drawColumnLabels(
    ctx,
    startCol,
    endCol,
    scrollOffset,
    columnHeaderHeight,
    rowHeaderWidth,
    activeCell,
    activeRange
  )

  drawColRowLabelDivider(ctx, columnHeaderHeight, rowHeaderWidth)

  // draw active range border when dragging is not active
}

export const getVisibleRange = (
  scrollOffset: Coordinate,
  viewportSize: { width: number; height: number }
) => {
  const { rowHeights, colWidths, defaultRowHeight, defaultColWidth, rowCount, colCount } =
    useSpreadsheetStore.getState()

  // --- find startCol & endCol ---
  let curX = 0
  let startCol = 0
  while (startCol < colCount) {
    const width = colWidths[startCol] ?? defaultColWidth
    if (curX + width > scrollOffset.x) break
    curX += width
    startCol++
  }

  let endCol = startCol
  let xRight = curX
  while (endCol < colCount && xRight < scrollOffset.x + viewportSize.width) {
    xRight += colWidths[endCol] ?? defaultColWidth
    endCol++
  }

  // --- find startRow & endRow ---
  let curY = 0
  let startRow = 0
  while (startRow < rowCount) {
    const height = rowHeights[startRow] ?? defaultRowHeight
    if (curY + height > scrollOffset.y) break
    curY += height
    startRow++
  }

  let endRow = startRow
  let yBottom = curY
  while (endRow < rowCount && yBottom < scrollOffset.y + viewportSize.height) {
    yBottom += rowHeights[endRow] ?? defaultRowHeight
    endRow++
  }

  return { startRow, endRow, startCol, endCol }
}

export const drawCells = (
  ctx: CanvasRenderingContext2D,
  scrollOffset: Coordinate,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  cellData: Map<string, Cell>,
  activeRange: Bounds | null
) => {
  const { rowHeights, colWidths, defaultRowHeight, defaultColWidth } =
    useSpreadsheetStore.getState()

  // compute starting X offset
  let colX = rowHeaderWidth - scrollOffset.x
  for (let c = 0; c < startCol; c++) {
    colX += colWidths[c] ?? defaultColWidth
  }

  for (let col = startCol; col < endCol; col++) {
    const width = colWidths[col] ?? defaultColWidth

    // compute starting Y offset for this column
    let rowY = columnHeaderHeight - scrollOffset.y
    for (let r = 0; r < startRow; r++) {
      rowY += rowHeights[r] ?? defaultRowHeight
    }

    for (let row = startRow; row < endRow; row++) {
      const height = rowHeights[row] ?? defaultRowHeight
      const x = colX
      const y = rowY

      // background
      ctx.fillStyle = 'white'
      ctx.fillRect(x, y, width, height)

      // border
      ctx.strokeStyle = '#ccc'
      ctx.strokeRect(x, y, width, height)

      // text
      const key = `${row},${col}`
      if (cellData.has(key)) {
        ctx.fillStyle = 'black'
        ctx.font = '12px sans-serif'
        ctx.fillText(cellData.get(key)?.value ?? '', x + 5, y + 15)
      }

      // activeRange highlight
      if (
        activeRange &&
        activeRange.top <= row &&
        row <= activeRange.bottom &&
        activeRange.left <= col &&
        col <= activeRange.right
      ) {
        ctx.fillStyle = 'rgba(84, 178, 255, 0.3)'
        ctx.fillRect(x, y, width, height)
      }

      rowY += height
    }

    colX += width
  }
}

export const drawActiveCell = (
  ctx: CanvasRenderingContext2D,
  scrollOffset: Coordinate,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  activeCell: CellCoordinate
) => {
  const { rowHeights, colWidths, defaultRowHeight, defaultColWidth } =
    useSpreadsheetStore.getState()

  if (
    startRow <= activeCell.row &&
    activeCell.row < endRow &&
    startCol <= activeCell.col &&
    activeCell.col < endCol
  ) {
    // compute x by summing col widths up to activeCell.col
    let x = rowHeaderWidth - scrollOffset.x
    for (let c = 0; c < activeCell.col; c++) {
      x += colWidths[c] ?? defaultColWidth
    }

    // compute y by summing row heights up to activeCell.row
    let y = columnHeaderHeight - scrollOffset.y
    for (let r = 0; r < activeCell.row; r++) {
      y += rowHeights[r] ?? defaultRowHeight
    }

    const width = colWidths[activeCell.col] ?? defaultColWidth
    const height = rowHeights[activeCell.row] ?? defaultRowHeight

    ctx.strokeStyle = 'rgb(33, 73, 105)'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)

    // reset stroke style
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
  }
}

export const drawColRowLabelDivider = (
  ctx: CanvasRenderingContext2D,
  columnHeaderHeight: number,
  rowHeaderWidth: number
) => {
  ctx.fillStyle = '#e1e1e1'
  ctx.fillRect(0, 0, rowHeaderWidth, columnHeaderHeight)
  ctx.strokeStyle = '#ccc'
  ctx.strokeRect(0, 0, rowHeaderWidth, columnHeaderHeight)
}

export const drawColumnLabels = (
  ctx: CanvasRenderingContext2D,
  startCol: number,
  endCol: number,
  scrollOffset: Coordinate,
  columnHeaderHeight: number,
  rowHeaderWidth: number,
  activeCell: CellCoordinate,
  activeRange: Bounds | null
) => {
  const { colWidths, defaultColWidth } = useSpreadsheetStore.getState()

  // start x position offset by rowHeaderWidth - scroll
  let x = rowHeaderWidth - scrollOffset.x
  for (let c = 0; c < startCol; c++) {
    x += colWidths[c] ?? defaultColWidth
  }

  for (let col = startCol; col < endCol; col++) {
    const width = colWidths[col] ?? defaultColWidth
    const y = 0

    if (activeRange && activeRange.left <= col && col <= activeRange.right) {
      ctx.fillStyle = '#a9a9a9ff'
    } else if (activeCell.col === col) {
      ctx.fillStyle = '#a9a9a9ff'
    } else {
      ctx.fillStyle = '#e1e1e1ff'
    }

    ctx.fillRect(x, y, width, columnHeaderHeight)
    ctx.strokeStyle = '#ccc'
    ctx.strokeRect(x, y, width, columnHeaderHeight)

    ctx.fillStyle = 'rgb(50,50,50)'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(colIndexToLabel(col), x + width / 2, y + columnHeaderHeight / 2)

    x += width
  }
}

export const drawRowLabels = (
  ctx: CanvasRenderingContext2D,
  startRow: number,
  endRow: number,
  scrollOffset: Coordinate,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  activeCell: CellCoordinate,
  activeRange: Bounds | null
) => {
  const { rowHeights, defaultRowHeight } = useSpreadsheetStore.getState()

  // start y position offset by columnHeaderHeight - scroll
  let y = columnHeaderHeight - scrollOffset.y
  for (let r = 0; r < startRow; r++) {
    y += rowHeights[r] ?? defaultRowHeight
  }

  for (let row = startRow; row < endRow; row++) {
    const height = rowHeights[row] ?? defaultRowHeight
    const x = 0

    if (activeRange && activeRange.top <= row && row <= activeRange.bottom) {
      ctx.fillStyle = '#a9a9a9ff'
    } else if (activeCell.row === row) {
      ctx.fillStyle = '#a9a9a9ff'
    } else {
      ctx.fillStyle = '#e1e1e1ff'
    }

    ctx.fillRect(x, y, rowHeaderWidth, height)
    ctx.strokeStyle = '#ccc'
    ctx.strokeRect(x, y, rowHeaderWidth, height)

    ctx.fillStyle = 'rgb(50,50,50)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${row + 1}`, x + rowHeaderWidth / 2, y + height / 2)

    y += height
  }
}

export const drawActiveRangeBorder = (
  ctx: CanvasRenderingContext2D,
  scrollOffset: Coordinate,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  isDragging: boolean,
  activeRange: Bounds | null
) => {
  if (!isDragging && activeRange) {
    const { rowHeights, colWidths, defaultRowHeight, defaultColWidth } =
      useSpreadsheetStore.getState()

    // --- compute x & total width ---
    let activeRangeX = rowHeaderWidth - scrollOffset.x
    for (let c = 0; c < activeRange.left; c++) {
      activeRangeX += colWidths[c] ?? defaultColWidth
    }
    let width = 0
    for (let c = activeRange.left; c <= activeRange.right; c++) {
      width += colWidths[c] ?? defaultColWidth
    }

    // --- compute y & total height ---
    let activeRangeY = columnHeaderHeight - scrollOffset.y
    for (let r = 0; r < activeRange.top; r++) {
      activeRangeY += rowHeights[r] ?? defaultRowHeight
    }
    let height = 0
    for (let r = activeRange.top; r <= activeRange.bottom; r++) {
      height += rowHeights[r] ?? defaultRowHeight
    }

    ctx.strokeStyle = 'rgb(59, 125, 179, 1)'
    ctx.lineWidth = 2
    ctx.strokeRect(activeRangeX, activeRangeY, width, height)
    ctx.lineWidth = 1
  }
}

export const drawCopyModeRange = (
  ctx: CanvasRenderingContext2D,
  scrollOffset: Coordinate,
  rowHeaderWidth: number,
  columnHeaderHeight: number,
  clipboardPointer: ClipboardPointer | null
) => {
  if (!clipboardPointer || !clipboardPointer.copyActive) return

  const { rowHeights, colWidths, defaultRowHeight, defaultColWidth } =
    useSpreadsheetStore.getState()

  let copyRangeX = rowHeaderWidth - scrollOffset.x
  let copyRangeY = columnHeaderHeight - scrollOffset.y
  let copyRangeWidth = 0
  let copyRangeHeight = 0

  if (isBounds(clipboardPointer.srcRange)) {
    const { left, right, top, bottom } = clipboardPointer.srcRange

    // --- compute X + width ---
    for (let c = 0; c < left; c++) copyRangeX += colWidths[c] ?? defaultColWidth
    for (let c = left; c <= right; c++) copyRangeWidth += colWidths[c] ?? defaultColWidth

    // --- compute Y + height ---
    for (let r = 0; r < top; r++) copyRangeY += rowHeights[r] ?? defaultRowHeight
    for (let r = top; r <= bottom; r++) copyRangeHeight += rowHeights[r] ?? defaultRowHeight
  } else {
    const { row, col } = clipboardPointer.srcRange

    // --- compute X + width ---
    for (let c = 0; c < col; c++) copyRangeX += colWidths[c] ?? defaultColWidth
    copyRangeWidth = colWidths[col] ?? defaultColWidth

    // --- compute Y + height ---
    for (let r = 0; r < row; r++) copyRangeY += rowHeights[r] ?? defaultRowHeight
    copyRangeHeight = rowHeights[row] ?? defaultRowHeight
  }

  const dash = 4
  const gap = 4
  const offset = 0
  const p = new Path2D()
  p.rect(copyRangeX + 0.5, copyRangeY + 0.5, copyRangeWidth - 1, copyRangeHeight - 1)

  ctx.lineWidth = 1.5

  // 1) purple dashes
  ctx.setLineDash([dash, gap])
  ctx.lineDashOffset = offset
  ctx.strokeStyle = 'purple'
  ctx.stroke(p)

  // 2) white dashes phase-shifted
  ctx.lineDashOffset = offset + dash
  ctx.strokeStyle = '#fff'
  ctx.stroke(p)

  // reset
  ctx.setLineDash([])
  ctx.lineWidth = 1
}
