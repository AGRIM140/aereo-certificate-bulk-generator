import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Compass, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

interface InspectorFallbackProps {
  canvas: HTMLCanvasElement;
  aspectRatio: number;
}

export const InspectorFallback: React.FC<InspectorFallbackProps> = ({
  canvas,
  aspectRatio,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = '';
    container.appendChild(canvas);

    return () => {
      container.innerHTML = '';
    };
  }, [canvas]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1.0) return;
    setIsDragging(true);
    startPosRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - startPosRef.current.x,
      y: e.clientY - startPosRef.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-3">
      {/* Fallback Banner */}
      <div className="flex items-center justify-between p-2.5 rounded bg-[#fffbeb] border border-[#fde68a] text-xs font-mono-telemetry text-[#92400e]">
        <span className="flex items-center gap-1.5 font-bold">
          <ShieldAlert className="w-4 h-4 text-[#b45309]" />
          2D ARCHIVAL FALLBACK MODE (WEBGL UNAVAILABLE)
        </span>
        <span className="text-[#b45309] text-[11px]">
          Rendering authoritative PDF raster directly (Zero Divergence preserved)
        </span>
      </div>

      {/* 2D Canvas Viewport */}
      <div
        className="relative w-full h-[550px] bg-[#141820] border border-[#2e394c] rounded-lg overflow-hidden flex items-center justify-center p-6 select-none cursor-grab active:cursor-grabbing shadow-xl"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          ref={containerRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            aspectRatio: String(aspectRatio),
          }}
          className="max-w-full max-h-full flex items-center justify-center [&>canvas]:max-w-full [&>canvas]:h-auto [&>canvas]:block [&>canvas]:shadow-2xl [&>canvas]:rounded"
        />

        {/* 2D Controls Bar */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1.5 rounded-lg bg-[#ffffff]/90 backdrop-blur border border-[#dcd3c1] shadow-lg">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
            disabled={zoom >= 2.5}
            className="px-2 py-1 h-8 text-xs font-mono-telemetry"
            aria-label="Zoom in on 2D certificate"
          >
            <ZoomIn className="w-3.5 h-3.5 text-[#2d3748]" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
            disabled={zoom <= 0.75}
            className="px-2 py-1 h-8 text-xs font-mono-telemetry"
            aria-label="Zoom out from 2D certificate"
          >
            <ZoomOut className="w-3.5 h-3.5 text-[#2d3748]" />
          </Button>

          <div className="w-px h-4 bg-[#dcd3c1] mx-1" />

          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            className="px-2.5 py-1 h-8 text-xs font-mono-telemetry text-[#1f304d] hover:text-[#161a22] font-semibold"
            aria-label="Reset 2D canvas zoom and pan"
          >
            <Compass className="w-3.5 h-3.5 mr-1 text-[#1f304d]" />
            <span>Reset</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
