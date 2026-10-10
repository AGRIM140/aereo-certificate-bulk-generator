import React, { useEffect, useRef } from 'react';
import {
  createCertificateScene,
  isWebGLAvailable,
  type CertificateSceneController,
} from '../../lib/three/createCertificateScene';
import { InspectorControls } from './InspectorControls';
import { Sparkles, Eye } from 'lucide-react';

interface Certificate3DSceneProps {
  canvas: HTMLCanvasElement;
  aspectRatio: number;
  onControllerReady?: (controller: CertificateSceneController | null) => void;
  onError?: (error: Error) => void;
}

export const Certificate3DScene: React.FC<Certificate3DSceneProps> = ({
  canvas,
  aspectRatio,
  onControllerReady,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<CertificateSceneController | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!isWebGLAvailable()) {
      onError?.(new Error('WebGL is not supported in this browser environment.'));
      return;
    }

    const reducedMotion =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    let ctrl: CertificateSceneController | null = null;

    try {
      ctrl = createCertificateScene({
        container: containerRef.current,
        canvas,
        aspectRatio,
        reducedMotion,
      });

      controllerRef.current = ctrl;
      onControllerReady?.(ctrl);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Failed to initialize 3D scene.'));
      return;
    }

    // Media query listener for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      ctrl?.setReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    } else {
      mediaQuery.addListener(handleMotionChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      } else {
        mediaQuery.removeListener(handleMotionChange);
      }
      ctrl?.dispose();
      controllerRef.current = null;
      onControllerReady?.(null);
    };
  }, [canvas, aspectRatio, onError, onControllerReady]);

  return (
    <div
      className="relative w-full h-[520px] sm:h-[600px] bg-neutral-900 border-2 border-black overflow-hidden flex items-center justify-center shadow-[3px_3px_0px_#000000] select-none"
      data-testid="certificate-3d-stage"
    >
      {/* Three.js canvas mount point */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />

      {/* Archival Telemetry HUD Header */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 bg-black text-[#fcc20f] border border-[#fcc20f] text-[10px] font-ui font-bold uppercase tracking-wider pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-[#fcc20f] shrink-0" />
        <span>3D PHYSICAL PAPER SURFACE</span>
        <span className="text-neutral-500">|</span>
        <span>DOUBLE-SIDED CURVATURE</span>
      </div>

      {/* Interaction Hint (Top-right) */}
      <div className="hidden sm:flex absolute top-3 right-3 z-10 items-center gap-1.5 px-2.5 py-1 bg-white text-black border border-black text-[10px] font-ui font-bold uppercase tracking-wider pointer-events-none">
        <Eye className="w-3 h-3 text-black" />
        <span>DRAG TO ROTATE • SCROLL TO ZOOM</span>
      </div>

      {/* Controls Bar (Floating bottom center/right) */}
      <div className="absolute bottom-4 right-4 z-10">
        <InspectorControls
          onRotateLeft={() => controllerRef.current?.rotateLeft()}
          onRotateRight={() => controllerRef.current?.rotateRight()}
          onZoomIn={() => controllerRef.current?.zoomIn()}
          onZoomOut={() => controllerRef.current?.zoomOut()}
          onReset={() => controllerRef.current?.resetView()}
          disabled={false}
        />
      </div>
    </div>
  );
};
