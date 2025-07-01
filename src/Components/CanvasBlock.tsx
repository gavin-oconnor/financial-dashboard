import { useRef, useEffect } from 'react';

type CanvasBlockProps = {
  width?: number;
  height?: number;
  draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
  className?: string;
};

export default function CanvasBlock({
  width = 400,
  height = 200,
  draw,
  className = '',
}: CanvasBlockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;


    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(dpr, dpr);
    draw(ctx, canvas);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
}

/**
       style={{
        display: 'block',
      }}
 */
