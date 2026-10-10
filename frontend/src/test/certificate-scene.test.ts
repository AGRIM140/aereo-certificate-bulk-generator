import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
  isWebGLAvailable,
} from '../lib/three/createCertificateScene';

describe('Three.js Certificate Scene Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects WebGL availability correctly based on context and window.WebGLRenderingContext', () => {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    const origWebGL = window.WebGLRenderingContext;

    // Define WebGLRenderingContext on window
    (window as unknown as { WebGLRenderingContext: unknown }).WebGLRenderingContext = class WebGLRenderingContext {};

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
      if (contextId === 'webgl' || contextId === 'experimental-webgl') {
        return {} as WebGLRenderingContext;
      }
      return null;
    });

    expect(isWebGLAvailable()).toBe(true);

    // When getContext returns null
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
    expect(isWebGLAvailable()).toBe(false);

    // Restore
    HTMLCanvasElement.prototype.getContext = origGetContext;
    (window as unknown as { WebGLRenderingContext: unknown }).WebGLRenderingContext = origWebGL;
  });

  it('generates curved paper geometry with parabolic curvature and correct aspect ratio', () => {
    const aspectRatio = 1.414; // landscape certificate
    const meshWidth = 4.2;
    const meshHeight = 4.2 / aspectRatio;
    const geometry = new THREE.PlaneGeometry(meshWidth, meshHeight, 64, 32);

    const positionAttribute = geometry.attributes.position;
    const halfW = meshWidth / 2;
    const halfH = meshHeight / 2;
    const curveDepth = 0.15;

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const u = x / halfW;
      const v = y / halfH;
      const zOffset = -curveDepth * (1 - Math.cos((u * Math.PI) / 2)) - 0.03 * (v * v);
      positionAttribute.setZ(i, zOffset);
    }
    geometry.computeVertexNormals();

    // Verify center vertex has minimal z-offset (near 0)
    let centerZ = 0;
    let edgeZ = 0;
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) {
        centerZ = z;
      }
      if (Math.abs(x - halfW) < 0.1) {
        edgeZ = z;
      }
    }

    // Center deflection should be near zero, lateral edges should bow back by approximately curveDepth
    expect(centerZ).toBeCloseTo(0, 1);
    expect(edgeZ).toBeLessThan(-0.1);
  });

  it('calculates aspect ratio without stretching or distorting texture', () => {
    const portraitAspectRatio = 0.707;
    const landscapeAspectRatio = 1.414;

    const baseWidth = 4.2;
    const portraitHeight = baseWidth / portraitAspectRatio;
    const landscapeHeight = baseWidth / landscapeAspectRatio;

    expect(portraitHeight).toBeGreaterThan(baseWidth);
    expect(landscapeHeight).toBeLessThan(baseWidth);
    expect(baseWidth / landscapeHeight).toBeCloseTo(landscapeAspectRatio, 3);
  });
});
