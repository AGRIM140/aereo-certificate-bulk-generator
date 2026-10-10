import * as pdfjsLib from 'pdfjs-dist';
// Vite URL import for the bundled PDF.js worker
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface RenderedPdfPage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface RenderPdfOptions {
  /** Maximum canvas width to prevent mobile GPU texture memory exhaustion */
  maxCanvasWidth?: number;
  /** Rendering scale factor (default: accounts for DPR, clamped between 1.5 and 3.0) */
  targetScale?: number;
}

/**
 * Authoritative client-side PDF rasterization.
 * Renders Page 1 of a PDF ArrayBuffer to an in-memory HTMLCanvasElement
 * without modifying, approximating, or diverging from ReportLab's output.
 */
export async function renderCertificatePdfPage(
  pdfBuffer: ArrayBuffer,
  options: RenderPdfOptions = {}
): Promise<RenderedPdfPage> {
  const { maxCanvasWidth = 2560 } = options;

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
  });

  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);

  // Measure unscaled viewport dimensions
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const baseWidth = unscaledViewport.width;
  const baseHeight = unscaledViewport.height;
  const aspectRatio = baseWidth / baseHeight;

  // Determine optimal scale for high-definition inspection while respecting GPU bounds
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const preferredScale = Math.min(3.0, Math.max(1.5, dpr * 1.5));
  let scale = options.targetScale || preferredScale;

  // Clamp if calculated width exceeds maximum safe texture dimension
  if (baseWidth * scale > maxCanvasWidth) {
    scale = maxCanvasWidth / baseWidth;
  }

  const viewport = page.getViewport({ scale });
  const canvasWidth = Math.floor(viewport.width);
  const canvasHeight = Math.floor(viewport.height);

  // Create canvas for rasterization
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Failed to acquire 2D rendering context for PDF rasterization.');
  }

  // Authoritative render in pdfjs-dist v6
  await page.render({
    canvasContext: context,
    canvas,
    viewport,
  }).promise;

  return {
    canvas,
    width: canvasWidth,
    height: canvasHeight,
    aspectRatio,
  };
}
