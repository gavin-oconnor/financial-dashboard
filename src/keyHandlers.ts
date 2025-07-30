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
        if(activeCell.row - activeRange.top === 1) {
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
        if(activeRange.bottom - activeCell.row === 1) {
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
        if(activeCell.col - activeRange.left === 1) {
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

export const handleArrowLeft = (e: KeyboardEvent, cols: number) => {
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
        if(activeRange.right - activeCell.col === 1) {
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