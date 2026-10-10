import * as THREE from 'three';

export interface CertificateSceneController {
  rotateLeft: () => void;
  rotateRight: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setReducedMotion: (enabled: boolean) => void;
  dispose: () => void;
}

export interface CreateSceneOptions {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  aspectRatio: number;
  reducedMotion?: boolean;
}

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Creates and initializes the Three.js 3D physical inspection scene.
 * Renders the authoritative PDF canvas onto a subtly curved archival paper geometry
 * with physics damping, pointer parallax, rotation clamps, and comprehensive cleanup.
 */
export function createCertificateScene(
  options: CreateSceneOptions
): CertificateSceneController {
  const { container, canvas, aspectRatio, reducedMotion: initialReducedMotion = false } = options;

  let isReducedMotion = initialReducedMotion;
  let isDisposed = false;
  let animationFrameId: number | null = null;

  // 1. Dimensions and Scene
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 550;

  const scene = new THREE.Scene();
  scene.background = null; // Transparent so CSS atmospheric background shines through

  // 2. Camera Setup
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  const DEFAULT_CAM_Z = 5.8;
  const MIN_CAM_Z = 3.2;
  const MAX_CAM_Z = 7.5;
  camera.position.set(0, 0, DEFAULT_CAM_Z);

  // 3. WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  renderer.setPixelRatio(Math.min(dpr, 2.0));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 4. Authoritative PDF Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  if (maxAnisotropy > 1) {
    texture.anisotropy = Math.min(maxAnisotropy, 8);
  }

  // 5. Curved Physical Paper Geometry
  // Maintain true PDF aspect ratio
  const meshWidth = 4.2;
  const meshHeight = 4.2 / aspectRatio;
  const geometry = new THREE.PlaneGeometry(meshWidth, meshHeight, 64, 32);

  // Apply subtle parabolic / cylindrical archival paper curvature
  const positionAttribute = geometry.attributes.position;
  const halfW = meshWidth / 2;
  const halfH = meshHeight / 2;
  const curveDepth = 0.15; // Subtle physical bow (~3.5% of width)

  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const u = x / halfW; // [-1, 1]
    const v = y / halfH; // [-1, 1]

    // Soft cylindrical deflection receding at the lateral edges plus corner relaxation
    const zOffset = -curveDepth * (1 - Math.cos((u * Math.PI) / 2)) - 0.03 * (v * v);
    positionAttribute.setZ(i, zOffset);
  }
  geometry.computeVertexNormals();

  // 6. Archival Paper Material
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85, // Matte archival paper stock
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  const certificateGroup = new THREE.Group();
  certificateGroup.add(mesh);
  scene.add(certificateGroup);

  // 7. Restrained Lighting Setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xfff8f0, 1.1);
  keyLight.position.set(2.5, 3.5, 4.0);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xd5e6f8, 0.4);
  fillLight.position.set(-3.0, -1.5, 3.0);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0x00f0ff, 0.35, 12);
  rimLight.position.set(0, -3.0, 2.0);
  scene.add(rimLight);

  // 8. Interaction State
  let targetRotX = 0;
  let targetRotY = 0;
  let currentRotX = 0;
  let currentRotY = 0;

  let targetCamZ = DEFAULT_CAM_Z;
  let currentCamZ = DEFAULT_CAM_Z;

  let parallaxX = 0;
  let parallaxY = 0;

  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;

  // Maximum rotation bounds to prevent reverse flipping or losing view
  const MAX_ROT_X = 0.45; // ~26 deg
  const MAX_ROT_Y = 0.75; // ~43 deg

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  // Pointer Handlers
  const onPointerDown = (e: PointerEvent) => {
    isDragging = true;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    if (isDragging) {
      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      targetRotY = clamp(targetRotY + deltaX * 0.005, -MAX_ROT_Y, MAX_ROT_Y);
      targetRotX = clamp(targetRotX + deltaY * 0.005, -MAX_ROT_X, MAX_ROT_X);
    } else if (!isReducedMotion) {
      // Subtle cursor parallax
      parallaxX = normX * 0.12;
      parallaxY = normY * 0.08;
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (isDragging) {
      isDragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture release safety
      }
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    targetCamZ = clamp(targetCamZ + e.deltaY * 0.003, MIN_CAM_Z, MAX_CAM_Z);
  };

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointercancel', onPointerUp);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

  // 9. Resize Handling
  const onResize = () => {
    if (isDisposed || !container) return;
    const newW = container.clientWidth || 800;
    const newH = container.clientHeight || 550;
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
  };

  window.addEventListener('resize', onResize);

  // 10. Animation & Render Loop
  let clock = new THREE.Clock();

  const animate = () => {
    if (isDisposed) return;

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      animationFrameId = requestAnimationFrame(animate);
      return;
    }

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (isReducedMotion) {
      currentRotX = targetRotX;
      currentRotY = targetRotY;
      currentCamZ = targetCamZ;
    } else {
      // Smooth damping interpolation
      const dampFactor = Math.min(1.0, delta * 8.0);
      currentRotX += (targetRotX + parallaxY - currentRotX) * dampFactor;
      currentRotY += (targetRotY + parallaxX - currentRotY) * dampFactor;
      currentCamZ += (targetCamZ - currentCamZ) * dampFactor;

      // Subtle idle breathing motion when not interacting
      if (!isDragging) {
        certificateGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.015;
      }
    }

    certificateGroup.rotation.x = currentRotX;
    certificateGroup.rotation.y = currentRotY;
    camera.position.z = currentCamZ;

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  };

  animate();

  // 11. Controller Actions
  return {
    rotateLeft: () => {
      targetRotY = clamp(targetRotY - 0.25, -MAX_ROT_Y, MAX_ROT_Y);
    },
    rotateRight: () => {
      targetRotY = clamp(targetRotY + 0.25, -MAX_ROT_Y, MAX_ROT_Y);
    },
    zoomIn: () => {
      targetCamZ = clamp(targetCamZ - 0.6, MIN_CAM_Z, MAX_CAM_Z);
    },
    zoomOut: () => {
      targetCamZ = clamp(targetCamZ + 0.6, MIN_CAM_Z, MAX_CAM_Z);
    },
    resetView: () => {
      targetRotX = 0;
      targetRotY = 0;
      parallaxX = 0;
      parallaxY = 0;
      targetCamZ = DEFAULT_CAM_Z;
    },
    setReducedMotion: (enabled: boolean) => {
      isReducedMotion = enabled;
      if (enabled) {
        parallaxX = 0;
        parallaxY = 0;
      }
    },
    dispose: () => {
      isDisposed = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);

      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
