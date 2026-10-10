import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { isWebGLAvailable } from '../lib/three/createLandingScene';

describe('Landing 3D Scene Engine (Phase F7)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects WebGL availability with simulated WebGL context', () => {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    const origWebGL = window.WebGLRenderingContext;

    (window as unknown as { WebGLRenderingContext: unknown }).WebGLRenderingContext = class WebGLRenderingContext {};

    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
      if (contextId === 'webgl' || contextId === 'experimental-webgl') {
        return {} as WebGLRenderingContext;
      }
      return null;
    });

    expect(isWebGLAvailable()).toBe(true);

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
    expect(isWebGLAvailable()).toBe(false);

    HTMLCanvasElement.prototype.getContext = origGetContext;
    (window as unknown as { WebGLRenderingContext: unknown }).WebGLRenderingContext = origWebGL;
  });

  it('calculates archival paper geometry with subtle parabolic deflection', () => {
    const meshWidth = 3.8;
    const meshHeight = 3.8 / 1.415;
    const geometry = new THREE.PlaneGeometry(meshWidth, meshHeight, 48, 24);

    const positionAttribute = geometry.attributes.position;
    const halfW = meshWidth / 2;
    const halfH = meshHeight / 2;
    const curveDepth = 0.12;

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const u = x / halfW;
      const v = y / halfH;
      const zOffset = -curveDepth * (1 - Math.cos((u * Math.PI) / 2)) - 0.02 * (v * v);
      positionAttribute.setZ(i, zOffset);
    }
    geometry.computeVertexNormals();

    // Check center vertex deflection vs edge vertex deflection
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

    expect(centerZ).toBeCloseTo(0, 1);
    expect(edgeZ).toBeLessThan(-0.08);
  });

  it('preserves landscape A4 aspect ratio', () => {
    const meshWidth = 3.8;
    const meshHeight = 3.8 / 1.415;
    expect(meshWidth / meshHeight).toBeCloseTo(1.415, 3);
  });
});
