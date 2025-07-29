// App.tsx
import { useRef, useEffect, useState, act } from 'react';
import './App.css'
import { handleFormula } from './Formulas';

const cellWidth = 100;
const cellHeight = 21;
const rows = 100;
const cols = 100;
const columnHeaderHeight = 21;
const rowHeaderWidth = 60;

function colIndexToLabel(index: number): string {
  let label = '';
  while (index >= 0) {
    label = String.fromCharCode((index % 26) + 65) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
}

type Bounds = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};


const cellRefToCoord = (ref: string): string => {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) throw new Error(`Invalid cell reference: ${ref}`);

  const [, colLetters, rowStr] = match;

  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col *= 26;
    col += colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
  }

  const row = parseInt(rowStr, 10);
  return `${row-1},${col-1}`;
};

type DataType = 'FORMULA' | 'TEXT' | 'NUMBER' | 'ERROR';

interface Cell {
  rawValue: string | number | null;
  dataType: DataType;
  value: string;
}

const isNumeric = (str: string): boolean => {
  return !isNaN(parseFloat(str)) && isFinite(Number(str));
};

const parseCell = (input: string, getCell: any):  Cell => {
  if(isNumeric(input)) {
    return {
      rawValue: parseFloat(input),
      dataType: 'NUMBER',
      value: input
    }
  } else if(input.length && input[0] === "=") {
    // formula
    const formulaValue = handleFormula(input,getCell)
    if(formulaValue === null) {
      return {
        rawValue: input,
        dataType: 'ERROR',
        value: "#ERR"
      }
    }
    return {
      rawValue: input,
      dataType: 'FORMULA',
      value: `${formulaValue}`
    }
  }
  return {
    rawValue: input,
    dataType: 'TEXT',
    value: input
  }
}

export default function App() {
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [activeCell,setActiveCell] = useState({row: 1, col: 1});
  const [cellData, setCellData] = useState<Map<string, Cell>>(new Map());
  const [editingValue,setEditingValue] = useState('');
  const [isEditing,setIsEditing] = useState(false);
  const [activeRange,setActiveRange] = useState<Bounds | null>(null);

  const getCell = (cellRef: string) => {
    const rowColForm = cellRefToCoord(cellRef);
    const cell = cellData.get(rowColForm);
    if(cell?.value) {
      return parseFloat(cell.value)
    }
    return 0;
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if(e.shiftKey) {
          if(!activeRange && activeCell.row < rows - 1) {
            console.log("FIRST OPTION")
            const newActiveRange = {top: activeCell.row, bottom: activeCell.row + 1, left: activeCell.col, right: activeCell.col};
            setActiveRange(newActiveRange);
          } else {
            console.log("SECOND OPTION")
            setActiveRange((prev) => {
          if (prev && prev.bottom < rows - 1) {
            return { ...prev, bottom: prev.bottom + 1 };
          }
          return prev;
        });
          }
        } else {
        if(isEditing) {
        const key = `${activeCell.row},${activeCell.col}`;
          setCellData((prev) => {
            const newData = new Map(prev);
            newData.set(key, parseCell(editingValue,getCell));
            return newData;
          });
        setIsEditing(false);
        setEditingValue('')
        }
        setActiveCell((prev) => {
          if (prev.row < rows - 1) {
            return { ...prev, row: prev.row + 1 };
          }
          return prev;
        });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if(isEditing) {
        const key = `${activeCell.row},${activeCell.col}`;
          setCellData((prev) => {
            const newData = new Map(prev);
            newData.set(key, parseCell(editingValue,getCell));
            return newData;
          });
        setIsEditing(false);
        setEditingValue('')
        }
        setActiveCell((prev) => {
          if (prev.row > 0) {
            return { ...prev, row: prev.row - 1 };
          }
          return prev;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if(isEditing) {
        const key = `${activeCell.row},${activeCell.col}`;
          setCellData((prev) => {
            const newData = new Map(prev);
            newData.set(key, parseCell(editingValue,getCell));
            return newData;
          });
        setIsEditing(false);
        setEditingValue('')
        }
        setActiveCell((prev) => {
          if (prev.col > 0) {
            return { ...prev, col: prev.col - 1 };
          }
          return prev;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if(isEditing) {
        const key = `${activeCell.row},${activeCell.col}`;
          setCellData((prev) => {
            const newData = new Map(prev);
            newData.set(key, parseCell(editingValue,getCell));
            return newData;
          });
        setIsEditing(false);
        setEditingValue('')
        }
        setActiveCell((prev) => {
          if (prev.col < cols - 1) {
            return { ...prev, col: prev.col + 1 };
          }
          return prev;
        });
      } else if (e.key.length === 1 &&
        !e.ctrlKey && !e.metaKey && !e.altKey && !isEditing) {
          e.preventDefault();
          setIsEditing(true);
          setEditingValue(e.key);
      } else if (e.key === 'Enter' && isEditing) {
        e.preventDefault();
        const key = `${activeCell.row},${activeCell.col}`;
          setCellData((prev) => {
            const newData = new Map(prev);
            newData.set(key, parseCell(editingValue,getCell));
            return newData;
          });
        setIsEditing(false);
        setEditingValue('')
        // optionally move to the next cell
        setActiveCell((prev) => ({
          ...prev,
          row: Math.min(prev.row + 1, rows - 1),
        }));
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editingValue, activeRange, activeCell]);
  
  // Measure viewport size
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateSize = () => {
      setViewportSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleDoubleClick = (e: MouseEvent) => {
      e.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
  
      const col = Math.floor((x + scrollOffset.x - rowHeaderWidth) / cellWidth);
      const row = Math.floor((y + scrollOffset.y - columnHeaderHeight) / cellHeight);
  
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        setActiveCell({ row, col });
        setIsEditing(true);
      }
    };
  
    window.addEventListener('dblclick', handleDoubleClick);
    return () => window.removeEventListener('dblclick', handleDoubleClick);
  }, [scrollOffset]);

  // Listen to scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      !isEditing &&
      setScrollOffset({
        x: container.scrollLeft,
        y: container.scrollTop,
      });
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Get canvas bounding box
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
  
      // Calculate position relative to canvas
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
      // Adjust for scroll offsets and header sizes
      const col = Math.floor((x - rowHeaderWidth + scrollOffset.x) / cellWidth);
      const row = Math.floor((y - columnHeaderHeight + scrollOffset.y) / cellHeight);
  
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        console.log(`Is editing ${isEditing}`)
        if(isEditing) {
          console.log("I'm gonna do it")
          e.preventDefault();
          const key = `${activeCell.row},${activeCell.col}`;
          setCellData((prev) => {
            const newData = new Map(prev);
            newData.set(key, parseCell(editingValue,getCell));
            return newData;
          });
        setIsEditing(false);
        setEditingValue('')
        }
        setActiveCell({ row, col });
      }
    };
  
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [scrollOffset, isEditing]);

  // Redraw canvas on scroll/resize
  useEffect(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewportSize.width * dpr;
    canvas.height = viewportSize.height * dpr;
    canvas.style.width = `${viewportSize.width}px`;
    canvas.style.height = `${viewportSize.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        if(cellData.has(`${[row]},${[col]}`)) {
          ctx.fillStyle = 'black';
          ctx.font = '12px sans-serif';
          ctx.fillText(cellData.get(`${[row]},${[col]}`)?.value ?? '', x + 5, y + 15);
        }
        if(activeRange && activeRange.top <= row && row <= activeRange.bottom && activeRange.left <= col && activeRange.right >= col) {
          ctx.fillStyle = 'rgb(84, 178, 255, 0.5)';
          ctx.fillRect(x, y, cellWidth, cellHeight);
        }
        
      }
    }
    if(startRow <= activeCell.row && activeCell.row < endRow && startCol <= activeCell.col && activeCell.col < endCol) {
      const x = activeCell.col * cellWidth - scrollOffset.x + rowHeaderWidth;
      const y = activeCell.row * cellHeight - scrollOffset.y + columnHeaderHeight;
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellWidth, cellHeight);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
    }
    for(let col = startCol; col < endCol; col++) {
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
      ctx.fillText(`${colIndexToLabel(col)}`, x + cellWidth/2, y + cellHeight/2);
    }
    for(let row=startRow; row < endRow; row++) {
      const x = 0
      const y = (row+1) * cellHeight - scrollOffset.y
      ctx.fillStyle = '#e1e1e1';
      ctx.fillRect(x, y, rowHeaderWidth, cellHeight);
      ctx.strokeStyle = '#ccc';
      ctx.strokeRect(x, y, rowHeaderWidth, cellHeight);
      ctx.fillStyle = 'rgb(50,50,50)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'middle';
      ctx.fillText(`${row+1}`, x + rowHeaderWidth/2, y + cellHeight/2);
    }
    const x = 0
    const y = 0;
    ctx.fillStyle = '#e1e1e1';
    ctx.fillRect(x, y, rowHeaderWidth, cellHeight);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(x, y, rowHeaderWidth, cellHeight);
  }, [scrollOffset, viewportSize, activeCell, cellData, activeRange]);
  useEffect(() => {
    console.log(isEditing)
  },[isEditing])
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
          const key = `${activeCell.row},${activeCell.col}`;
          setCellData((prev) => {
            const newData = new Map(prev);
            newData.set(key, editingValue);
            return newData;
          });
          setIsEditing(false);
          setEditingValue('');
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
  );
}