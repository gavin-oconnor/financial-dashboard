import type { Key } from "react";
import { getCell, parseCell } from "./Services";
import { useSpreadsheetStore } from "./store/spreadsheetStore";

export const handleArrowDown = (e: KeyboardEvent, rows: number) => {
  e.preventDefault();
  const { activeRange, activeCell } = useSpreadsheetStore.getState();
  const setActiveRange = useSpreadsheetStore.getState().setActiveRange;
  const setActiveCell = useSpreadsheetStore.getState().setActiveCell;
  if (e.shiftKey) {
    if (!activeRange && activeCell.row < rows - 1) {
      const newActiveRange = { top: activeCell.row, bottom: activeCell.row + 1, left: activeCell.col, right: activeCell.col };
      setActiveRange(newActiveRange);
      } else {
      if(activeRange && activeRange.top < activeCell.row) {
        if(activeCell.row - activeRange.top === 1 && activeRange.left == activeCell.col && activeRange.right == activeCell.col) {
          setActiveRange(null);
        } else {
          setActiveRange({...activeRange, top: activeRange.top + 1});
        }
      }
      else if(activeRange && activeRange.bottom < rows - 1) {
        setActiveRange({...activeRange, bottom: activeRange.bottom + 1});
      }
    }
  } else {
    if(activeCell.row < rows-1) {
      setActiveCell({row: activeCell.row+1, col: activeCell.col});
      setActiveRange(null);
    }
  }
}

export const handleArrowUp = (e: KeyboardEvent, rows: number) => {
  e.preventDefault();
  const { activeRange, activeCell } = useSpreadsheetStore.getState();
  const setActiveRange = useSpreadsheetStore.getState().setActiveRange;
  const setActiveCell = useSpreadsheetStore.getState().setActiveCell;
  if (e.shiftKey) {
    if (!activeRange && activeCell.row > 0) {
      const newActiveRange = { top: activeCell.row-1, bottom: activeCell.row, left: activeCell.col, right: activeCell.col };
      setActiveRange(newActiveRange);
      } else {
      if(activeRange && activeRange.bottom > activeCell.row) {
        if(activeRange.bottom - activeCell.row === 1  && activeRange.left == activeCell.col && activeRange.right == activeCell.col) {
          setActiveRange(null);
        } else {
          setActiveRange({...activeRange, bottom: activeRange.bottom-1});
        }
      }
      else if(activeRange && activeRange.top > 0) {
        setActiveRange({...activeRange, top: activeRange.top-1});
      }
    }
  } else {
    if(activeCell.row > 0) {
      setActiveCell({row: activeCell.row-1, col: activeCell.col});
      setActiveRange(null);
    }
  }
}

export const handleArrowRight = (e: KeyboardEvent, cols: number) => {
  e.preventDefault();
  const { activeRange, activeCell } = useSpreadsheetStore.getState();
  const setActiveRange = useSpreadsheetStore.getState().setActiveRange;
  const setActiveCell = useSpreadsheetStore.getState().setActiveCell;
  if (e.shiftKey) {
    if (!activeRange && activeCell.col < cols-1) {
      const newActiveRange = { top: activeCell.row, bottom: activeCell.row, left: activeCell.col, right: activeCell.col+1 };
      setActiveRange(newActiveRange);
      } else {
      if(activeRange && activeRange.left < activeCell.col) {
        if(activeCell.col - activeRange.left === 1 && activeRange.top === activeCell.row && activeRange.bottom === activeCell.row) {
          setActiveRange(null);
        } else {
          setActiveRange({...activeRange, left: activeRange.left+1});
        }
      }
      else if(activeRange && activeRange.right < cols-1) {
        setActiveRange({...activeRange, right: activeRange.right+1});
      }
    }
  } else {
    if(activeCell.col < cols-1) {
      setActiveCell({row: activeCell.row, col: activeCell.col+1});
      setActiveRange(null);
    }
  }
}

export const handleArrowLeft = (e: KeyboardEvent) => {
  e.preventDefault();
  const { activeRange, activeCell } = useSpreadsheetStore.getState();
  const setActiveRange = useSpreadsheetStore.getState().setActiveRange;
  const setActiveCell = useSpreadsheetStore.getState().setActiveCell;
  if (e.shiftKey) {
    if (!activeRange && activeCell.col > 0) {
      const newActiveRange = { top: activeCell.row, bottom: activeCell.row, left: activeCell.col-1, right: activeCell.col };
      setActiveRange(newActiveRange);
      } else {
      if(activeRange && activeRange.right > activeCell.col) {
        console.log("HERE")
        console.log(activeCell.col - activeRange.right)
        if(activeRange.right - activeCell.col === 1 && activeRange.top === activeCell.row && activeRange.bottom === activeCell.row) {
          setActiveRange(null);
        } else {
          setActiveRange({...activeRange, right: activeRange.right-1});
        }
      }
      else if(activeRange && activeRange.left > 0) {
        setActiveRange({...activeRange, left: activeRange.left-1});
      }
    }
  } else {
    if(activeCell.col > 0) {
      setActiveCell({row: activeCell.row, col: activeCell.col-1});
      setActiveRange(null);
    }
  }
}

export const handleInputKey = (e: KeyboardEvent) => {
  const { setIsEditing, setEditingValue } = useSpreadsheetStore.getState();
  e.preventDefault();
  setIsEditing(true);
  setEditingValue(e.key);
}

export const handleEnter = (e: KeyboardEvent, rows: number) => {
  console.log("calling handleEnter");
  const { setCellData, activeCell, editingValue, setIsEditing, setEditingValue, setActiveCell} = useSpreadsheetStore.getState();
  e.preventDefault();
  const key = `${activeCell.row},${activeCell.col}`;
  setCellData((prev) => {
    const newData = new Map(prev);
    newData.set(key, parseCell(editingValue));
    return newData;
  });
  setIsEditing(false);
  setEditingValue('')
  // optionally move to the next cell
  setActiveCell({
    col: activeCell.col,
    row: Math.min(activeCell.row + 1, rows - 1),
  });
}

export const handleBackspace = (e: KeyboardEvent) => {
  const {activeCell, setCellData, activeRange} = useSpreadsheetStore.getState();
  if(activeRange) {
    for(let i=activeRange.left; i<=activeRange.right; i++) {
      for(let j=activeRange.top; j <=activeRange.bottom; j++) {
        let key = `${j},${i}`;
        setCellData((prev) => {
          const newData = new Map(prev);
          newData.delete(key);
          return newData;
      });
    }
  }
  } else {
    const key = `${activeCell.row},${activeCell.col}`;
  setCellData((prev) => {
    const newData = new Map(prev);
    newData.delete(key);
    return newData;
  });
}
}