import React from 'react';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import { Button } from '../ui/Button';

interface InspectorControlsProps {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export const InspectorControls: React.FC<InspectorControlsProps> = ({
  onRotateLeft,
  onRotateRight,
  onZoomIn,
  onZoomOut,
  onReset,
  disabled = false,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="3D Certificate Viewport Controls"
      className="inline-flex items-center gap-1.5 p-1.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] select-none"
    >
      <Button
        variant="secondary"
        size="sm"
        onClick={onRotateLeft}
        disabled={disabled}
        className="px-2 py-1 h-8 text-xs"
        aria-label="Rotate certificate counter-clockwise"
        title="Rotate Left"
      >
        <RotateCcw className="w-3.5 h-3.5 text-black" />
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onRotateRight}
        disabled={disabled}
        className="px-2 py-1 h-8 text-xs"
        aria-label="Rotate certificate clockwise"
        title="Rotate Right"
      >
        <RotateCw className="w-3.5 h-3.5 text-black" />
      </Button>

      <div className="w-px h-5 bg-black mx-0.5" />

      <Button
        variant="secondary"
        size="sm"
        onClick={onZoomIn}
        disabled={disabled}
        className="px-2 py-1 h-8 text-xs"
        aria-label="Zoom in on certificate"
        title="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5 text-black" />
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onZoomOut}
        disabled={disabled}
        className="px-2 py-1 h-8 text-xs"
        aria-label="Zoom out from certificate"
        title="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5 text-black" />
      </Button>

      <div className="w-px h-5 bg-black mx-0.5" />

      <Button
        variant="secondary"
        size="sm"
        onClick={onReset}
        disabled={disabled}
        className="px-2.5 py-1 h-8 text-xs font-bold"
        aria-label="Reset camera and rotation orientation"
        title="Reset Orientation"
      >
        <Compass className="w-3.5 h-3.5 mr-1 text-black" />
        <span>RESET</span>
      </Button>
    </div>
  );
};
