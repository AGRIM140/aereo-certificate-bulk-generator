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
      className="inline-flex items-center gap-1.5 p-1.5 rounded-lg bg-[#ffffff]/92 backdrop-blur border border-[#dcd3c1] shadow-lg select-none"
    >
      <Button
        variant="secondary"
        size="sm"
        onClick={onRotateLeft}
        disabled={disabled}
        className="px-2 py-1 h-8 text-xs font-mono-telemetry"
        aria-label="Rotate certificate counter-clockwise"
        title="Rotate Left"
      >
        <RotateCcw className="w-3.5 h-3.5 text-[#2d3748]" />
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onRotateRight}
        disabled={disabled}
        className="px-2 py-1 h-8 text-xs font-mono-telemetry"
        aria-label="Rotate certificate clockwise"
        title="Rotate Right"
      >
        <RotateCw className="w-3.5 h-3.5 text-[#2d3748]" />
      </Button>

      <div className="w-px h-4 bg-[#dcd3c1] mx-1" />

      <Button
        variant="secondary"
        size="sm"
        onClick={onZoomIn}
        disabled={disabled}
        className="px-2 py-1 h-8 text-xs font-mono-telemetry"
        aria-label="Zoom in on certificate"
        title="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5 text-[#2d3748]" />
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onZoomOut}
        disabled={disabled}
        className="px-2 py-1 h-8 text-xs font-mono-telemetry"
        aria-label="Zoom out from certificate"
        title="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5 text-[#2d3748]" />
      </Button>

      <div className="w-px h-4 bg-[#dcd3c1] mx-1" />

      <Button
        variant="secondary"
        size="sm"
        onClick={onReset}
        disabled={disabled}
        className="px-2.5 py-1 h-8 text-xs font-mono-telemetry text-[#1f304d] hover:text-[#161a22] font-semibold"
        aria-label="Reset camera and rotation orientation"
        title="Reset Orientation"
      >
        <Compass className="w-3.5 h-3.5 mr-1 text-[#1f304d]" />
        <span>Reset</span>
      </Button>
    </div>
  );
};
