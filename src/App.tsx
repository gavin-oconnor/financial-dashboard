// App.tsx
import { useRef, useEffect, useState } from 'react'
import './App.css'
import {
  handleArrowDown,
  handleArrowLeft,
  handleArrowRight,
  handleArrowUp,
  handleBackspace,
  handleCopy,
  handleCut,
  handleEnter,
  handleEscape,
  handleInputKey,
  handlePaste,
  handleTab,
} from './keyHandlers.ts'
import type { Coordinate, Dimension } from './Types.ts'
import { useSpreadsheetStore } from './store/spreadsheetStore.ts'
import { drawCanvas } from './drawService.ts'
import { clickActivate, dblClickActivateEditing, dragToActiveRange } from './clickHandlers.ts'
import { mouseCoordToSheetCoord } from './Services.ts'

const cellWidth = 100
const cellHeight = 21
const rows = 100
const cols = 100
const columnHeaderHeight = 21
const rowHeaderWidth = 60

export default function App() {
  const [viewportSize, setViewportSize] = useState<Dimension>({ width: 0, height: 0 })
  const [scrollOffset, setScrollOffset] = useState<Coordinate>({ x: 0, y: 0 })
  const spreadsheetStore = useSpreadsheetStore()

  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { isEditing } = useSpreadsheetStore.getState()
      if (e.key === 'ArrowDown') {
        !isEditing && handleArrowDown(e, rows)
      } else if (e.key === 'ArrowUp') {
        !isEditing && handleArrowUp(e)
      } else if (e.key === 'ArrowRight') {
        !isEditing && handleArrowRight(e, cols)
      } else if (e.key === 'ArrowLeft') {
        !isEditing && handleArrowLeft(e)
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditing) {
        handleInputKey(e)
      } else if (e.key === 'Enter') {
        handleEnter(e, rows, e.shiftKey)
      } else if (e.key === 'Backspace' && !isEditing) {
        handleBackspace(e)
      } else if (e.key === 'Tab') {
        handleTab(e, cols, e.shiftKey)
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() == 'c') {
        handleCopy()
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() == 'x') {
        handleCut()
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() == 'v') {
        handlePaste()
      } else if (e.key === 'Escape') {
        handleEscape(e)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const updateSize = () => {
      setViewportSize({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleDoubleClick = (e: MouseEvent) => {
      e.preventDefault()
      const bounds = canvas.getBoundingClientRect()
      const { row, col } = mouseCoordToSheetCoord(
        e,
        bounds,
        scrollOffset,
        rowHeaderWidth,
        columnHeaderHeight,
        cellHeight,
        cellWidth
      )
      dblClickActivateEditing(row, col, rows, cols)
    }

    window.addEventListener('dblclick', handleDoubleClick)
    return () => window.removeEventListener('dblclick', handleDoubleClick)
  }, [scrollOffset])

  // Listen to scroll
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const { isEditing } = useSpreadsheetStore.getState()
      !isEditing &&
        setScrollOffset({
          x: container.scrollLeft,
          y: container.scrollTop,
        })
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Get canvas bounding box
      const canvas = canvasRef.current
      if (!canvas) return
      const bounds = canvas.getBoundingClientRect()
      const { row, col } = mouseCoordToSheetCoord(
        e,
        bounds,
        scrollOffset,
        rowHeaderWidth,
        columnHeaderHeight,
        cellHeight,
        cellWidth
      )
      clickActivate(row, col, rows, cols, e.shiftKey)
      // isDraggingRef.current = true
      setIsDragging(true)
    }

    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [scrollOffset])

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      // Get canvas bounding box
      // if (!isDraggingRef.current) {
      //   return
      // }
      if (!isDragging) {
        return
      }
      const canvas = canvasRef.current
      if (!canvas) return
      const bounds = canvas.getBoundingClientRect()
      const { row, col } = mouseCoordToSheetCoord(
        e,
        bounds,
        scrollOffset,
        rowHeaderWidth,
        columnHeaderHeight,
        cellHeight,
        cellWidth
      )
      dragToActiveRange(row, col, rows, cols)
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [scrollOffset, isDragging])

  useEffect(() => {
    const handleMouseUp = () => {
      // Get canvas bounding box
      // isDraggingRef.current = false
      setIsDragging(false)
    }

    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [scrollOffset])

  // Redraw canvas on scroll/resize
  useEffect(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = viewportSize.width * dpr
    canvas.height = viewportSize.height * dpr
    canvas.style.width = `${viewportSize.width}px`
    canvas.style.height = `${viewportSize.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawCanvas(
      ctx,
      scrollOffset,
      viewportSize,
      cellWidth,
      cellHeight,
      rows,
      cols,
      rowHeaderWidth,
      columnHeaderHeight,
      isDragging
    )
  }, [scrollOffset, viewportSize, spreadsheetStore, isDragging])
  const { isEditing, activeCell, setIsEditing, setEditingValue, setCellData, editingValue } =
    useSpreadsheetStore()
  return (
    <>
      {/* Fixed Ribbon */}
      <div
        style={{
          height: '80px',
          width: '100%',
          backgroundColor: '#eee',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 20,
          borderBottom: '1px solid #ccc',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '16px',
        }}
      >
        Ribbon
      </div>

      {/* Scrollable container under the ribbon */}
      <div
        ref={scrollRef}
        style={{
          position: 'absolute',
          top: '80px',
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'auto',
        }}
      >
        {/* Fake scroll content */}
        <div
          style={{
            width: `${cols * cellWidth + rowHeaderWidth}px`,
            height: `${rows * cellHeight + columnHeaderHeight}px`,
          }}
        ></div>
      </div>

      {/* Canvas overlays everything */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: '80px', // aligns with the scroll area
          left: 0,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />
      {isEditing && (
        <input
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={() => {
            setIsEditing(false)
            setEditingValue('')
          }}
          autoFocus
          style={{
            position: 'absolute',
            top: 80 + activeCell.row * cellHeight - scrollOffset.y + columnHeaderHeight,
            left: activeCell.col * cellWidth - scrollOffset.x + rowHeaderWidth,
            width: cellWidth - 10,
            height: cellHeight - 2,
            fontSize: '12px',
            border: '1px solid #3b82f6',
            padding: '0 4px',
            zIndex: 30,
            outline: 'none',
          }}
        />
      )}
    </>
  )
}
