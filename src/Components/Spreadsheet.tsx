import CanvasBlock from './CanvasBlock';

export default function Spreadsheet() {
    const rows = 100;
    const cols = 26;
    const cellWidth = 100;
    const cellHeight = 21;
    const grid: number[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(0)
    );
    
    const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgb(200,200,200)';
        ctx.strokeStyle = '#e1e1e1'
        for(let row=0; row < grid.length; row++) {
            for(let col=0; col < grid[row].length; col++) {
                const x = col * cellWidth;
                const y = row * cellHeight;
                ctx.strokeRect(x, y, cellWidth, cellHeight);
            }
        }
    };

    const drawCellHeaders = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f3f3f3';
        ctx.strokeStyle = '#e9e9e7'
        let row = 0
        for(let col=0; col < grid[row].length; col++) {
            const x = col * cellWidth;
            const y = row * cellHeight;
            ctx.fillRect(x,y,cellWidth,cellHeight);
            ctx.strokeRect(x, y, cellWidth, cellHeight);
            }
        }

  return (
    <div>
        <CanvasBlock width={cellWidth*cols} height={cellHeight} draw={drawCellHeaders} className='col-headers'/>
        <CanvasBlock width={cellWidth*cols} height={cellHeight*rows} draw={drawGrid} className='grid'/>
    </div>
  );
}