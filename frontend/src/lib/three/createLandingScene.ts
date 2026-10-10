import * as THREE from 'three';
import { isWebGLAvailable } from './createCertificateScene';

export interface LandingSceneController {
  setReducedMotion: (enabled: boolean) => void;
  resetView?: () => void;
  setScrollProgress?: (progress: number) => void;
  dispose: () => void;
}

export interface CreateLandingSceneOptions {
  container: HTMLElement;
  reducedMotion?: boolean;
}

/**
 * Creates a soft radial contact shadow texture to physically ground 3D machinery on a clean white surface.
 */
function createContactShadowCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 248);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.42)');
  grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.22)');
  grad.addColorStop(0.70, 'rgba(15, 23, 42, 0.07)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.00)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  return canvas;
}

/**
 * Creates a high-fidelity bright studio environment map via PMREMGenerator
 * providing crisp specular reflections for catalog steel, gold brass, and workstation chassis.
 */
function createStudioEnvironment(renderer: THREE.WebGLRenderer): {
  envMap: THREE.Texture;
  dispose: () => void;
} {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 1. Studio backdrop ambient gradient (crisp white to pale steel)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.35, '#f8fafc');
    bgGrad.addColorStop(0.70, '#e2e8f0');
    bgGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // 2. High-key Softbox Light (Ceiling overhead)
    const softbox = ctx.createRadialGradient(512, 100, 20, 512, 100, 280);
    softbox.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    softbox.addColorStop(0.45, 'rgba(248, 250, 252, 0.85)');
    softbox.addColorStop(1, 'rgba(226, 232, 240, 0.0)');
    ctx.fillStyle = softbox;
    ctx.beginPath();
    ctx.arc(512, 100, 280, 0, Math.PI * 2);
    ctx.fill();

    // 3. Technical Rim Lightbox (Side reflection strip)
    const rimGrad = ctx.createLinearGradient(120, 0, 280, 0);
    rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
    rimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
    rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(120, 80, 160, 320);

    // 4. Clean Floor Bounce
    const floorBounce = ctx.createRadialGradient(512, 450, 40, 512, 450, 320);
    floorBounce.addColorStop(0, 'rgba(241, 245, 249, 0.9)');
    floorBounce.addColorStop(1, 'rgba(203, 213, 225, 0.0)');
    ctx.fillStyle = floorBounce;
    ctx.fillRect(160, 320, 704, 192);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  const renderTarget = pmremGenerator.fromEquirectangular(texture);
  texture.dispose();
  pmremGenerator.dispose();

  return {
    envMap: renderTarget.texture,
    dispose: () => {
      renderTarget.dispose();
    },
  };
}

/**
 * Creates a micro-brushed metal normal/bump texture for lathe reflections.
 */
function createBrushedMetalCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  // Precision lathe micro-grooves
  for (let y = 0; y < 256; y += 2) {
    const v = 120 + Math.floor(Math.sin(y * 0.4) * 16 + Math.random() * 20);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, 256, 1);
  }
  return canvas;
}

/**
 * Procedurally draws a pristine UNPRINTED raw archival cotton vellum document texture
 * with crisp technical drafting crop marks and catalog border (Act I & Act II state).
 */
function createBlankDocumentCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1130;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Pristine Crisp White Base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // 2. Technical Catalog Borders
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(48, 48, w - 96, h - 96);

  // Technical corner brackets
  const corner = 36;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(26, 26 + corner);
  ctx.lineTo(26, 26);
  ctx.lineTo(26 + corner, 26);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(w - 26 - corner, 26);
  ctx.lineTo(w - 26, 26);
  ctx.lineTo(w - 26, 26 + corner);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(26, h - 26 - corner);
  ctx.lineTo(26, h - 26);
  ctx.lineTo(26 + corner, h - 26);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(w - 26 - corner, h - 26);
  ctx.lineTo(w - 26, h - 26);
  ctx.lineTo(w - 26, h - 26 - corner);
  ctx.stroke();

  // Faint translucent watermark in center (Dell 1996 star mark)
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 120, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
  ctx.font = 'bold 52px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', w / 2, h / 2);
  ctx.restore();

  // Center watermark label
  ctx.font = 'bold 16px "Courier New", Courier, monospace';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.textAlign = 'center';
  ctx.fillText('[ RAW UNPRINTED 280 GSM COTTON VELLUM // SPECIMEN SUBSTRATE ]', w / 2, h / 2 + 160);

  // Header telemetry
  ctx.font = 'bold 12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.fillText('DELL 1996 ARCHIVAL PAPER LAB // FORM 96-CERT', 72, 80);
  ctx.textAlign = 'right';
  ctx.fillText('STATUS: RAW UNENGAGED // QUEUED', w - 72, 80);

  // Micro watermark indicator at bottom
  ctx.textAlign = 'center';
  ctx.fillText('ARCHIVAL 280 GSM COTTON VELLUM // A4 LANDSCAPE (1:1.415) // SUB-SECOND DISPATCH', w / 2, h - 60);

  return canvas;
}

/**
 * Procedurally draws a high-resolution archival document texture with guilloche rosettes,
 * bold Dell 1996 catalog borders, carmine wax seal, and elegant typography (Act IV & Act V state).
 */
function createArchivalDocumentCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1130; // Landscape A4 ratio (1.415)
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Crisp Archival White Base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // 2. Archival Security Borders & Black Contours (Dell 1996 Style)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4.5;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(48, 48, w - 96, h - 96);

  // Corner bracket accents
  const cornerSize = 40;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(26, 26 + cornerSize);
  ctx.lineTo(26, 26);
  ctx.lineTo(26 + cornerSize, 26);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(w - 26 - cornerSize, 26);
  ctx.lineTo(w - 26, 26);
  ctx.lineTo(w - 26, 26 + cornerSize);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(26, h - 26 - cornerSize);
  ctx.lineTo(26, h - 26);
  ctx.lineTo(26 + cornerSize, h - 26);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(w - 26 - cornerSize, h - 26);
  ctx.lineTo(w - 26, h - 26);
  ctx.lineTo(w - 26, h - 26 - cornerSize);
  ctx.stroke();

  // Guilloche Security Rosette (Parametric Hypocycloid in Dell Gold)
  const drawGuillocheRosette = (cx: number, cy: number, R: number, r: number, p: number, loops: number) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(252, 194, 15, 0.45)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    const steps = loops * 100;
    for (let theta = 0; theta <= loops * 2 * Math.PI; theta += (2 * Math.PI) / steps) {
      const x = cx + (R - r) * Math.cos(theta) + p * Math.cos(((R - r) * theta) / r);
      const y = cy - (R - r) * Math.sin(theta) + p * Math.sin(((R - r) * theta) / r);
      if (theta === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  };

  drawGuillocheRosette(w / 2, 185, 52, 18, 32, 9);
  drawGuillocheRosette(150, h - 145, 60, 20, 36, 9);

  // Corner registration crosshairs
  const drawCrosshair = (cx: number, cy: number) => {
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy);
    ctx.lineTo(cx + 14, cy);
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx, cy + 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };
  drawCrosshair(82, 82);
  drawCrosshair(w - 82, 82);
  drawCrosshair(82, h - 82);
  drawCrosshair(w - 82, h - 82);

  // 3. Document Telemetry Header Ribbon Bar (Black Ribbon with Yellow Sticker)
  ctx.fillStyle = '#000000';
  ctx.fillRect(68, 64, w - 136, 36);

  ctx.font = 'bold 12px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('ARCHIVAL TELEMETRY CERTIFICATE // ATELIER ATOMIC COMPILATION', 86, 87);

  // Yellow badge sticker in ribbon
  ctx.fillStyle = '#fcc20f';
  ctx.fillRect(w - 380, 70, 290, 24);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(w - 380, 70, 290, 24);
  ctx.font = 'bold 11px "Courier New", Courier, monospace';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.fillText('SPECIFICATION v1.0 • SHA-256 VERIFIED', w - 235, 86);

  // 4. Main Certificate Header & Award Title
  ctx.textAlign = 'center';

  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  ctx.fillStyle = '#000000';
  ctx.fillText('✦ CERTIFICATE OF FELLOWSHIP & ACHIEVEMENT ✦', w / 2, 280);

  ctx.font = 'bold 28px Arial, Helvetica, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('ARCHIVAL ACADEMY OF ADVANCED COMPUTING', w / 2, 332);

  ctx.font = 'italic 18px "Times New Roman", Georgia, serif';
  ctx.fillStyle = '#444444';
  ctx.fillText('This authoritative archival record certifies the successful batch compilation for', w / 2, 396);

  // 5. Recipient Name Hero Section
  ctx.font = 'bold 56px "Times New Roman", Georgia, serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('Dr. Elena Rostova', w / 2, 475);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 280, 505);
  ctx.lineTo(w / 2 + 280, 505);
  ctx.stroke();

  // Small yellow decorative center pip
  ctx.fillStyle = '#fcc20f';
  ctx.fillRect(w / 2 - 6, 500, 12, 10);
  ctx.strokeRect(w / 2 - 6, 500, 12, 10);

  // Event Context & Citation
  ctx.font = 'bold 24px "Times New Roman", Georgia, serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('Global Quantum Computing Summit 2026', w / 2, 555);

  ctx.font = '16px "Times New Roman", Georgia, serif';
  ctx.fillStyle = '#333333';
  ctx.fillText('For demonstrated mastery in distributed fault-tolerant quantum algorithms', w / 2, 595);

  // Serial Number & Integrity Hashes
  ctx.font = 'bold 12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#000000';
  ctx.fillText('DETERMINISTIC ID: CERT-2026-466DBC643C27 • SHA-256: 466dbc643c27f09d8e3b1', w / 2, 655);
  ctx.fillText('ISSUED: OCTOBER 2026 • ENGINE: ATELIER v1.0 • QUEUE: ATOMIC CELERY', w / 2, 678);

  // 6. Carmine Wax Seal (Bottom-Left)
  const sealX = 260;
  const sealY = h - 220;
  const sealRadius = 60;

  // Ribbon tails in Dell Red
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(sealX - 16, sealY + 30);
  ctx.lineTo(sealX - 30, sealY + 95);
  ctx.lineTo(sealX - 10, sealY + 85);
  ctx.lineTo(sealX + 6, sealY + 95);
  ctx.lineTo(sealX - 2, sealY + 30);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#e91d2a';
  ctx.beginPath();
  ctx.moveTo(sealX + 2, sealY + 30);
  ctx.lineTo(sealX + 12, sealY + 95);
  ctx.lineTo(sealX + 28, sealY + 85);
  ctx.lineTo(sealX + 38, sealY + 95);
  ctx.lineTo(sealX + 20, sealY + 30);
  ctx.closePath();
  ctx.fill();

  // Wax body (Dell Red)
  const sealGrad = ctx.createRadialGradient(sealX - 12, sealY - 12, 10, sealX, sealY, sealRadius);
  sealGrad.addColorStop(0, '#ff3847');
  sealGrad.addColorStop(0.7, '#e91d2a');
  sealGrad.addColorStop(1, '#991b1b');
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
  ctx.fill();

  // Seal gold relief rings
  ctx.strokeStyle = '#fcc20f';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius - 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius - 15, 0, Math.PI * 2);
  ctx.stroke();

  // Star Emblem Center
  ctx.fillStyle = '#fcc20f';
  ctx.font = 'bold 24px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', sealX, sealY - 4);
  ctx.font = 'bold 10px "Courier New", Courier, monospace';
  ctx.fillText('VERIFIED', sealX, sealY + 16);
  ctx.textBaseline = 'alphabetic';

  // 7. Signature Sign-Offs (Bottom-Right)
  const sigX = w - 240;
  ctx.textAlign = 'center';

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sigX - 120, h - 130);
  ctx.lineTo(sigX + 120, h - 130);
  ctx.stroke();

  ctx.font = 'italic 28px "Times New Roman", Georgia, serif';
  ctx.fillStyle = '#000000';
  ctx.fillText('Marcus Vance', sigX, h - 142);

  ctx.font = 'bold 12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#000000';
  ctx.fillText('DIRECTOR OF ARCHIVAL STANDARDS', sigX, h - 110);
  ctx.fillText('ACCREDITED CERTIFICATION COUNCIL', sigX, h - 90);

  // 8. Micro-print footer guarantee
  ctx.textAlign = 'center';
  ctx.font = '600 11px "Courier New", Courier, monospace';
  ctx.fillStyle = '#555555';
  ctx.fillText(
    'REPORTLAB VECTOR RASTER // ATOMIC CELERY DISPATCH // SHA-256 INTEGRITY CHECK // BATCH GEN ENGINE v1.0',
    w / 2,
    h - 60
  );

  return canvas;
}

/**
 * Procedural texture for intake recipient document slips in crisp catalog style.
 */
function createIntakeSlipCanvas(name: string, event: string, id: string, accentColor = '#e91d2a'): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Left catalog accent color strip
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, 16, canvas.height);

  // 2.5px solid black border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  ctx.font = 'bold 13px "Courier New", Courier, monospace';
  ctx.fillStyle = '#000000';
  ctx.fillText(`REC-SPEC // ${id} • RFC-5322 SANITIZED`, 36, 40);

  ctx.font = 'bold 28px "Times New Roman", Georgia, serif';
  ctx.fillStyle = '#000000';
  ctx.fillText(name, 36, 88);

  ctx.font = '16px "Times New Roman", Georgia, serif';
  ctx.fillStyle = '#444444';
  ctx.fillText(event, 36, 126);

  ctx.fillStyle = '#c0d4a7';
  ctx.fillRect(36, 146, 170, 30);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, 146, 170, 30);
  ctx.font = 'bold 12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#000000';
  ctx.fillText('✓ RFC-5322 VALID', 48, 166);

  return canvas;
}

/**
 * Procedural Dell 1996 yellow builder's plaque texture.
 */
function createBuilderPlaqueCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#fcc20f'; // Dell Yellow
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 120);

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px "Courier New", Courier, monospace';
  ctx.fillText('DELL 1996 ATELIER • WORKSTATION 01', 256, 50);
  ctx.font = 'bold 14px "Courier New", Courier, monospace';
  ctx.fillText('1-800-CERT-GEN • PRODUCTION v1.0.0', 256, 84);

  return canvas;
}

/**
 * Helper to add crisp black wireframe geometric edge contours to meshes
 * creating the retro 1996 CAD / technical schematic aesthetic.
 */
function addMeshEdges(
  mesh: THREE.Mesh,
  color = 0x000000,
  collector?: { geoms: THREE.BufferGeometry[]; mats: THREE.Material[] }
): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 28);
  const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 1 });
  const line = new THREE.LineSegments(edges, lineMat);
  if (collector) {
    collector.geoms.push(edges);
    collector.mats.push(lineMat);
  }
  mesh.add(line);
  return line;
}

// Continuous Timeline Landmarks
interface Landmark {
  p: number;
  camPos: [number, number, number];
  lookAt: [number, number, number];
  baseRotY: number;
  baseRotX: number;
  certPos: [number, number, number];
  certRotX: number;
  slip1Z: number;
  slip2Z: number;
  slip3Z: number;
  carriageX: number;
  laserIntensity: number;
  coneOpacity: number;
  printProgress: number; // 0.0 = completely blank, 1.0 = completely printed
  flapRotX: number; // Envelope flap: -2.2 = wide open, 0.02 = closed flat
}

const TIMELINE_LANDMARKS: Landmark[] = [
  {
    // ACT I: THE FOLIO OPEN (Raw Pristine Blank Substrate)
    p: 0.00,
    camPos: [0.00, 2.75, 6.10],
    lookAt: [0.00, 0.45, 0.35],
    baseRotY: -0.06,
    baseRotX: 0.06,
    certPos: [0, 0.16, 0.22],
    certRotX: -Math.PI / 2 + 0.06,
    slip1Z: 0.40,
    slip2Z: -0.40,
    slip3Z: -1.10,
    carriageX: -1.25,
    laserIntensity: 0.0,
    coneOpacity: 0.0,
    printProgress: 0.0, // 100% BLANK RAW VELLUM
    flapRotX: -2.3, // Flap is open in background
  },
  {
    // ACT II: DATA INTAKE (Slips Feed In, Certificate Aligns, Still Blank)
    p: 0.28,
    camPos: [-0.60, 3.10, 5.80],
    lookAt: [0.00, 0.50, -0.20],
    baseRotY: -0.16,
    baseRotX: 0.10,
    certPos: [0, 0.16, 0.22],
    certRotX: -Math.PI / 2 + 0.06,
    slip1Z: 1.45,
    slip2Z: 0.45,
    slip3Z: -0.35,
    carriageX: -1.20,
    laserIntensity: 0.0,
    coneOpacity: 0.0,
    printProgress: 0.0, // STILL 100% BLANK
    flapRotX: -2.3,
  },
  {
    // ACT III-A: PRESS ENGAGEMENT (Laser Powers On, Printing Begins at Top Edge)
    p: 0.42,
    camPos: [0.45, 2.65, 5.50],
    lookAt: [0.00, 0.45, 0.20],
    baseRotY: 0.06,
    baseRotX: 0.07,
    certPos: [0, 0.18, 0.45],
    certRotX: -Math.PI / 2 + 0.10,
    slip1Z: 1.45,
    slip2Z: 1.45,
    slip3Z: 0.45,
    carriageX: -0.85,
    laserIntensity: 1.8,
    coneOpacity: 0.40,
    printProgress: 0.04, // First top lines begin printing
    flapRotX: -2.3,
  },
  {
    // ACT III-B: ACTIVE ATELIER PRESS (Laser Sweeps, Document Progressively Prints)
    p: 0.54,
    camPos: [0.65, 2.50, 5.35],
    lookAt: [0.00, 0.42, 0.35],
    baseRotY: 0.14,
    baseRotX: 0.08,
    certPos: [0, 0.24, 0.95],
    certRotX: -Math.PI / 2 + 0.22,
    slip1Z: 1.45,
    slip2Z: 1.45,
    slip3Z: 1.45,
    carriageX: 0.10,
    laserIntensity: 2.6,
    coneOpacity: 0.60,
    printProgress: 0.52, // 50% printed in real time under active sweep!
    flapRotX: -2.3,
  },
  {
    // ACT III-C: PRINT WIPE FINISHES (Entire Document Printed)
    p: 0.66,
    camPos: [0.35, 2.35, 5.15],
    lookAt: [0.00, 0.42, 0.65],
    baseRotY: 0.06,
    baseRotX: 0.05,
    certPos: [0, 0.34, 1.55],
    certRotX: -Math.PI / 2 + 0.55,
    slip1Z: 1.45,
    slip2Z: 1.45,
    slip3Z: 1.45,
    carriageX: 1.35,
    laserIntensity: 0.0,
    coneOpacity: 0.0,
    printProgress: 1.0, // 100% PRINTED
    flapRotX: -2.3,
  },
  {
    // ACT IV: SPECIMEN EMERGENCE (Finished Certificate Hero Inspection Pose)
    p: 0.76,
    camPos: [0.00, 2.65, 6.00],
    lookAt: [0.00, 0.40, 1.40],
    baseRotY: -0.03,
    baseRotX: 0.04,
    certPos: [0, 0.45, 2.15],
    certRotX: -Math.PI / 2 + 0.95, // Tilted 55° up toward camera
    slip1Z: 1.45,
    slip2Z: 1.45,
    slip3Z: 1.45,
    carriageX: 1.38,
    laserIntensity: 0.0,
    coneOpacity: 0.0,
    printProgress: 1.0,
    flapRotX: -2.3, // Flap still open waiting for document
  },
  {
    // ACT V-A: DOCKING (Certificate Slides Inside Envelope Pocket)
    p: 0.88,
    camPos: [0.00, 3.40, 6.00],
    lookAt: [0.00, 0.20, 1.85],
    baseRotY: 0.02,
    baseRotX: 0.06,
    certPos: [0, 0.038, 1.88], // Slipped inside envelope pocket
    certRotX: -Math.PI / 2 + 0.02,
    slip1Z: 1.45,
    slip2Z: 1.45,
    slip3Z: 1.45,
    carriageX: 1.38,
    laserIntensity: 0.0,
    coneOpacity: 0.0,
    printProgress: 1.0,
    flapRotX: -2.3, // Flap open as certificate settles
  },
  {
    // ACT V-B: ENVELOPE CLOSURE (Hinged Flap Folds Down & Seals Shut!)
    p: 0.96,
    camPos: [0.00, 3.60, 6.20],
    lookAt: [0.00, 0.15, 1.85],
    baseRotY: 0.03,
    baseRotX: 0.07,
    certPos: [0, 0.038, 1.88],
    certRotX: -Math.PI / 2 + 0.02,
    slip1Z: 1.45,
    slip2Z: 1.45,
    slip3Z: 1.45,
    carriageX: 1.38,
    laserIntensity: 0.0,
    coneOpacity: 0.0,
    printProgress: 1.0,
    flapRotX: 0.02, // FLAP FULLY CLOSED & SEALED WITH GOLD MEDALLION!
  },
  {
    // ACT V-C: ARCHIVE VAULT COMPLETE (Envelope Stays Sealed Shut)
    p: 1.00,
    camPos: [0.00, 3.65, 6.25],
    lookAt: [0.00, 0.15, 1.85],
    baseRotY: 0.04,
    baseRotX: 0.08,
    certPos: [0, 0.038, 1.88],
    certRotX: -Math.PI / 2 + 0.02,
    slip1Z: 1.45,
    slip2Z: 1.45,
    slip3Z: 1.45,
    carriageX: 1.38,
    laserIntensity: 0.0,
    coneOpacity: 0.0,
    printProgress: 1.0,
    flapRotX: 0.02, // STAYS SEALED SHUT!
  },
];

/**
 * Creates and initializes the cinematic scroll-driven 3D atelier production scene.
 */
export function createLandingScene(
  options: CreateLandingSceneOptions
): LandingSceneController {
  const { container, reducedMotion: initialReducedMotion = false } = options;

  let isReducedMotion = initialReducedMotion;
  let isDisposed = false;
  let animationFrameId: number | null = null;

  // 1. Viewport Setup
  const width = container.clientWidth || 700;
  const height = container.clientHeight || 520;

  const scene = new THREE.Scene();
  scene.background = null;

  // 2. Camera Setup (Calibrated for full inspection & stage framing)
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);

  // Responsive camera layout: offsets optical center to right stage on desktop, centered on mobile
  const applyCameraLayout = (w: number, h: number) => {
    camera.aspect = w / h;
    if (w > 900) {
      // Desktop: Shift optical center 16% to the right so the entire 3D object centers cleanly with balanced margins
      camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
  };

  applyCameraLayout(width, height);
  camera.position.set(0.00, 2.75, 6.10);

  // 3. Renderer with high color fidelity & soft PCF shadows
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  renderer.setPixelRatio(Math.min(dpr, 2.0));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 4. Studio Environment Map for Authentic PBR Reflections
  const studioEnv = createStudioEnvironment(renderer);
  scene.environment = studioEnv.envMap;

  // 5. Procedural Textures & Materials
  const contactShadowTex = new THREE.CanvasTexture(createContactShadowCanvas());
  const brushedMetalTex = new THREE.CanvasTexture(createBrushedMetalCanvas());
  brushedMetalTex.wrapS = THREE.RepeatWrapping;
  brushedMetalTex.wrapT = THREE.RepeatWrapping;
  brushedMetalTex.repeat.set(1, 4);

  const plaqueTex = new THREE.CanvasTexture(createBuilderPlaqueCanvas());
  plaqueTex.colorSpace = THREE.SRGBColorSpace;

  // Soft Radial Contact Shadow Quad under machine
  const shadowGeo = new THREE.PlaneGeometry(6.6, 7.6);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const groundShadow = new THREE.Mesh(shadowGeo, shadowMat);
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.set(0, -0.15, 0.2);

  // Edge contours collector for clean WebGL resource disposal
  const edgeCollector = { geoms: [] as THREE.BufferGeometry[], mats: [] as THREE.Material[] };

  // Precision Engineered Materials (1996 Technical Catalog & CAD Aesthetic)
  const slateBaseMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Clean industrial workstation chassis light gray
    roughness: 0.42,
    metalness: 0.18,
  });

  const machinedIronMaterial = new THREE.MeshStandardMaterial({
    color: 0x8da0ad, // Dell Catalog Steel Blue-Gray
    roughness: 0.32,
    metalness: 0.52,
  });

  const polishedBrassMaterial = new THREE.MeshStandardMaterial({
    color: 0xfcc20f, // Dell Yellow / Rich Precision Brass
    roughness: 0.16,
    metalness: 0.88,
    bumpMap: brushedMetalTex,
    bumpScale: 0.002,
  });

  const steelAxleMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // High-contrast ground chrome tool steel
    roughness: 0.10,
    metalness: 0.96,
  });

  const bronzeBushingMaterial = new THREE.MeshStandardMaterial({
    color: 0xca8a04, // Phosphor bronze
    roughness: 0.28,
    metalness: 0.82,
  });

  const bookclothMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e2e4a, // Archival midnight navy bookcloth
    roughness: 0.82,
    metalness: 0.08,
  });

  const plaqueMaterial = new THREE.MeshStandardMaterial({
    map: plaqueTex,
    roughness: 0.35,
    metalness: 0.50,
  });

  const redAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xe91d2a, // Dell Red accent
    roughness: 0.25,
    metalness: 0.40,
  });

  // 6. MASTER ATELIER PRINTING PRESS CHASSIS
  const pressChassisGroup = new THREE.Group();

  // Machined Granite/Slate Bed Plate
  const bedGeometry = new THREE.BoxGeometry(4.4, 0.16, 5.6);
  const bedMesh = new THREE.Mesh(bedGeometry, slateBaseMaterial);
  bedMesh.position.set(0, -0.08, 0);
  bedMesh.receiveShadow = true;
  addMeshEdges(bedMesh, 0x000000, edgeCollector);
  pressChassisGroup.add(bedMesh);

  // 4 Machined Brass Isolation Leveling Feet
  const footGeom = new THREE.CylinderGeometry(0.12, 0.15, 0.08, 16);
  const footPositions = [
    [-2.05, -0.18, -2.6],
    [2.05, -0.18, -2.6],
    [-2.05, -0.18, 2.6],
    [2.05, -0.18, 2.6],
  ];
  footPositions.forEach(([fx, fy, fz]) => {
    const foot = new THREE.Mesh(footGeom, polishedBrassMaterial);
    foot.position.set(fx, fy, fz);
    pressChassisGroup.add(foot);
  });

  // Dual Concentric Brass Inlay Ruler Rails on Bed
  const rulerTrimGeometry = new THREE.BoxGeometry(4.44, 0.03, 0.08);
  const rulerFront = new THREE.Mesh(rulerTrimGeometry, polishedBrassMaterial);
  rulerFront.position.set(0, 0.01, 2.72);
  pressChassisGroup.add(rulerFront);
  const rulerBack = new THREE.Mesh(rulerTrimGeometry, polishedBrassMaterial);
  rulerBack.position.set(0, 0.01, -2.72);
  pressChassisGroup.add(rulerBack);

  // Dual Polished Steel Bed Guide Rails
  const bedRailGeometry = new THREE.CylinderGeometry(0.038, 0.038, 5.2, 20);
  const leftRail = new THREE.Mesh(bedRailGeometry, steelAxleMaterial);
  leftRail.rotation.x = Math.PI / 2;
  leftRail.position.set(-1.88, 0.03, 0);
  pressChassisGroup.add(leftRail);

  const rightRail = new THREE.Mesh(bedRailGeometry, steelAxleMaterial);
  rightRail.rotation.x = Math.PI / 2;
  rightRail.position.set(1.88, 0.03, 0);
  pressChassisGroup.add(rightRail);

  // Side Gantry Machine Upright Towers (Left & Right)
  const gantryGeometry = new THREE.BoxGeometry(0.38, 1.34, 0.88);
  const leftGantry = new THREE.Mesh(gantryGeometry, machinedIronMaterial);
  leftGantry.position.set(-1.96, 0.59, 0);
  leftGantry.castShadow = true;
  leftGantry.receiveShadow = true;
  addMeshEdges(leftGantry, 0x000000, edgeCollector);
  pressChassisGroup.add(leftGantry);

  const rightGantry = new THREE.Mesh(gantryGeometry, machinedIronMaterial);
  rightGantry.position.set(1.96, 0.59, 0);
  rightGantry.castShadow = true;
  rightGantry.receiveShadow = true;
  addMeshEdges(rightGantry, 0x000000, edgeCollector);
  pressChassisGroup.add(rightGantry);

  // Builder's Plaque on Left Gantry Outer Face
  const plaqueGeom = new THREE.PlaneGeometry(0.60, 0.15);
  const plaqueMesh = new THREE.Mesh(plaqueGeom, plaqueMaterial);
  plaqueMesh.rotation.y = -Math.PI / 2;
  plaqueMesh.position.set(-2.16, 0.72, 0);
  pressChassisGroup.add(plaqueMesh);

  // Knurled Brass Micrometer Pressure Adjustment Knobs on Top of Towers
  const micrometerKnobGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 24);
  const leftKnob = new THREE.Mesh(micrometerKnobGeom, polishedBrassMaterial);
  leftKnob.position.set(-1.96, 1.32, 0);
  pressChassisGroup.add(leftKnob);

  const rightKnob = new THREE.Mesh(micrometerKnobGeom, polishedBrassMaterial);
  rightKnob.position.set(1.96, 1.32, 0);
  pressChassisGroup.add(rightKnob);

  // Bronze Bearing Housings for Roller Shafts
  const bearingGeom = new THREE.CylinderGeometry(0.20, 0.20, 0.10, 24);
  const leftTopBearing = new THREE.Mesh(bearingGeom, bronzeBushingMaterial);
  leftTopBearing.rotation.z = Math.PI / 2;
  leftTopBearing.position.set(-1.75, 0.42, 0);
  pressChassisGroup.add(leftTopBearing);

  const rightTopBearing = new THREE.Mesh(bearingGeom, bronzeBushingMaterial);
  rightTopBearing.rotation.z = Math.PI / 2;
  rightTopBearing.position.set(1.75, 0.42, 0);
  pressChassisGroup.add(rightTopBearing);

  const leftBottomBearing = new THREE.Mesh(bearingGeom, bronzeBushingMaterial);
  leftBottomBearing.rotation.z = Math.PI / 2;
  leftBottomBearing.position.set(-1.75, 0.12, 0);
  pressChassisGroup.add(leftBottomBearing);

  const rightBottomBearing = new THREE.Mesh(bearingGeom, bronzeBushingMaterial);
  rightBottomBearing.rotation.z = Math.PI / 2;
  rightBottomBearing.position.set(1.75, 0.12, 0);
  pressChassisGroup.add(rightBottomBearing);

  // Overhead Carriage Guide Rail
  const overheadRailGeometry = new THREE.CylinderGeometry(0.040, 0.040, 3.92, 24);
  const overheadRail = new THREE.Mesh(overheadRailGeometry, steelAxleMaterial);
  overheadRail.rotation.z = Math.PI / 2;
  overheadRail.position.set(0, 0.96, 0);
  pressChassisGroup.add(overheadRail);

  // DUAL PRECISION PRINTING ROLLERS (Calibrated Radius: 0.13)
  const rollerGeometry = new THREE.CylinderGeometry(0.13, 0.13, 3.40, 48);

  // Upper Roller: Polished Champagne Brass
  const rollerTop = new THREE.Mesh(rollerGeometry, polishedBrassMaterial);
  rollerTop.rotation.z = Math.PI / 2;
  rollerTop.position.set(0, 0.42, 0);
  rollerTop.castShadow = true;
  pressChassisGroup.add(rollerTop);

  // Lower Roller: Ground Tool Steel
  const rollerBottom = new THREE.Mesh(rollerGeometry, steelAxleMaterial);
  rollerBottom.rotation.z = Math.PI / 2;
  rollerBottom.position.set(0, 0.12, 0);
  rollerBottom.receiveShadow = true;
  pressChassisGroup.add(rollerBottom);

  // Steel Drive Axles passing through gears
  const axleGeom = new THREE.CylinderGeometry(0.05, 0.05, 3.95, 24);
  const topAxle = new THREE.Mesh(axleGeom, steelAxleMaterial);
  topAxle.rotation.z = Math.PI / 2;
  topAxle.position.set(0, 0.42, 0);
  pressChassisGroup.add(topAxle);

  const bottomAxle = new THREE.Mesh(axleGeom, steelAxleMaterial);
  bottomAxle.rotation.z = Math.PI / 2;
  bottomAxle.position.set(0, 0.12, 0);
  pressChassisGroup.add(bottomAxle);

  // Precision Spur Gears at Roller Drive Ends
  const gearGeometry = new THREE.CylinderGeometry(0.20, 0.20, 0.08, 24);
  const leftTopGear = new THREE.Mesh(gearGeometry, machinedIronMaterial);
  leftTopGear.rotation.z = Math.PI / 2;
  leftTopGear.position.set(-1.82, 0.42, 0);
  pressChassisGroup.add(leftTopGear);

  const leftBottomGear = new THREE.Mesh(gearGeometry, machinedIronMaterial);
  leftBottomGear.rotation.z = Math.PI / 2;
  leftBottomGear.position.set(-1.82, 0.12, 0);
  pressChassisGroup.add(leftBottomGear);

  // PRINTHEAD / LASER SCANNER CARRIAGE
  const carriageGroup = new THREE.Group();
  carriageGroup.position.set(-1.25, 0.96, 0);

  const carriageGeometry = new THREE.BoxGeometry(0.64, 0.20, 0.36);
  const carriageMesh = new THREE.Mesh(carriageGeometry, machinedIronMaterial);
  carriageMesh.castShadow = true;
  addMeshEdges(carriageMesh, 0x000000, edgeCollector);
  carriageGroup.add(carriageMesh);

  // Dell Red Accent Cap
  const capGeometry = new THREE.BoxGeometry(0.66, 0.04, 0.38);
  const capMesh = new THREE.Mesh(capGeometry, redAccentMaterial);
  capMesh.position.set(0, 0.11, 0);
  addMeshEdges(capMesh, 0x000000, edgeCollector);
  carriageGroup.add(capMesh);

  // Optical Lens Barrel
  const lensBarrelGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 20);
  const lensBarrel = new THREE.Mesh(lensBarrelGeom, polishedBrassMaterial);
  lensBarrel.position.set(0, -0.13, 0);
  carriageGroup.add(lensBarrel);

  // Glowing Aperture Emitter Ring (Dell Red)
  const apertureGeom = new THREE.RingGeometry(0.02, 0.06, 16);
  const apertureMat = new THREE.MeshBasicMaterial({
    color: 0xe91d2a,
    side: THREE.DoubleSide,
  });
  const apertureRing = new THREE.Mesh(apertureGeom, apertureMat);
  apertureRing.rotation.x = Math.PI / 2;
  apertureRing.position.set(0, -0.19, 0);
  carriageGroup.add(apertureRing);

  // Volumetric Conical Laser Light Beam (Dell Red Targeting Beam)
  const beamConeGeom = new THREE.ConeGeometry(0.22, 0.78, 24, 1, true);
  const beamConeMat = new THREE.MeshBasicMaterial({
    color: 0xe91d2a,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beamConeMesh = new THREE.Mesh(beamConeGeom, beamConeMat);
  beamConeMesh.position.set(0, -0.56, 0);
  carriageGroup.add(beamConeMesh);

  // Dynamic UV Laser PointLight (Dell Red)
  const printLaserLight = new THREE.PointLight(0xe91d2a, 0, 3.0);
  printLaserLight.position.set(0, -0.22, 0);
  carriageGroup.add(printLaserLight);

  pressChassisGroup.add(carriageGroup);

  // 7. INTAKE FEEDER ASSEMBLY & RECIPIENT DATA SLIPS
  const intakeGroup = new THREE.Group();
  intakeGroup.position.set(0, 0.30, -1.8);
  intakeGroup.rotation.x = -0.24; // Angled paper feeder chute

  // Feeder Chute Bed
  const chuteGeometry = new THREE.BoxGeometry(3.2, 0.04, 2.4);
  const chuteMesh = new THREE.Mesh(chuteGeometry, machinedIronMaterial);
  addMeshEdges(chuteMesh, 0x000000, edgeCollector);
  intakeGroup.add(chuteMesh);

  // Feeder Brass Guide Rails
  const guideGeometry = new THREE.BoxGeometry(0.06, 0.12, 2.4);
  const leftGuide = new THREE.Mesh(guideGeometry, polishedBrassMaterial);
  leftGuide.position.set(-1.58, 0.06, 0);
  addMeshEdges(leftGuide, 0x000000, edgeCollector);
  intakeGroup.add(leftGuide);
  const rightGuide = new THREE.Mesh(guideGeometry, polishedBrassMaterial);
  rightGuide.position.set(1.58, 0.06, 0);
  addMeshEdges(rightGuide, 0x000000, edgeCollector);
  intakeGroup.add(rightGuide);

  // 3 Textured Recipient Data Slips (Dell Red, Steel, Sage)
  const slip1Canvas = createIntakeSlipCanvas('Dr. Elena Rostova', 'Global Quantum Computing Summit', 'REC-001', '#e91d2a');
  const slip1Tex = new THREE.CanvasTexture(slip1Canvas);
  slip1Tex.colorSpace = THREE.SRGBColorSpace;
  const slipMat1 = new THREE.MeshStandardMaterial({ map: slip1Tex, roughness: 0.82, side: THREE.DoubleSide });
  const slipGeom = new THREE.PlaneGeometry(2.6, 0.76);

  const slip1Mesh = new THREE.Mesh(slipGeom, slipMat1);
  slip1Mesh.rotation.x = -Math.PI / 2;
  slip1Mesh.position.set(0, 0.03, 0.40);
  intakeGroup.add(slip1Mesh);

  const slip2Canvas = createIntakeSlipCanvas('Marcus Vance, PE', 'Advanced Aerospace Symposium', 'REC-002', '#a5b8c0');
  const slip2Tex = new THREE.CanvasTexture(slip2Canvas);
  slip2Tex.colorSpace = THREE.SRGBColorSpace;
  const slipMat2 = new THREE.MeshStandardMaterial({ map: slip2Tex, roughness: 0.82, side: THREE.DoubleSide });

  const slip2Mesh = new THREE.Mesh(slipGeom, slipMat2);
  slip2Mesh.rotation.x = -Math.PI / 2;
  slip2Mesh.position.set(0.08, 0.035, -0.40);
  intakeGroup.add(slip2Mesh);

  const slip3Canvas = createIntakeSlipCanvas('Aria Chen', 'Distributed Cryptography', 'REC-003', '#b3bd95');
  const slip3Tex = new THREE.CanvasTexture(slip3Canvas);
  slip3Tex.colorSpace = THREE.SRGBColorSpace;
  const slipMat3 = new THREE.MeshStandardMaterial({ map: slip3Tex, roughness: 0.82, side: THREE.DoubleSide });

  const slip3Mesh = new THREE.Mesh(slipGeom, slipMat3);
  slip3Mesh.rotation.x = -Math.PI / 2;
  slip3Mesh.position.set(-0.06, 0.04, -1.10);
  intakeGroup.add(slip3Mesh);

  // 8. THE MASTERPIECE CERTIFICATE (Progressive Print Material)
  const blankTexture = new THREE.CanvasTexture(createBlankDocumentCanvas());
  blankTexture.colorSpace = THREE.SRGBColorSpace;
  blankTexture.minFilter = THREE.LinearMipmapLinearFilter;
  blankTexture.generateMipmaps = true;

  const certTexture = new THREE.CanvasTexture(createArchivalDocumentCanvas());
  certTexture.colorSpace = THREE.SRGBColorSpace;
  certTexture.minFilter = THREE.LinearMipmapLinearFilter;
  certTexture.generateMipmaps = true;

  // Shader uniforms driving the dynamic top-to-bottom print wipe & red laser scan line
  const printUniforms = {
    uPrintProgress: { value: 0.0 }, // 0.0 = completely blank, 1.0 = completely printed
    tBlank: { value: blankTexture },
    tPrinted: { value: certTexture },
  };

  const emergingCertGroup = new THREE.Group();

  // Calibrated A4 Landscape dimensions: 2.95 x 2.08 (physically clears 3.40 rollers and docks in 4.25 envelope)
  const meshWidth = 2.95;
  const meshHeight = 2.95 / 1.415;

  // Top Hero Sheet: Curved Physical Paper Geometry with subtle parabolic deflection
  const heroGeometry = new THREE.PlaneGeometry(meshWidth, meshHeight, 48, 24);
  const positionAttribute = heroGeometry.attributes.position;
  const halfW = meshWidth / 2;
  const halfH = meshHeight / 2;
  const curveDepth = 0.08;

  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const u = x / halfW;
    const v = y / halfH;
    const zOffset = -curveDepth * (1 - Math.cos((u * Math.PI) / 2)) - 0.015 * (v * v);
    positionAttribute.setZ(i, zOffset);
  }
  heroGeometry.computeVertexNormals();

  const heroMaterial = new THREE.MeshStandardMaterial({
    map: certTexture,
    roughness: 0.70,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  // Inject progressive printing wipe & active laser emission line
  heroMaterial.customProgramCacheKey = () => 'archivalProgressivePrintMaterial';
  heroMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uPrintProgress = printUniforms.uPrintProgress;
    shader.uniforms.tBlank = printUniforms.tBlank;
    shader.uniforms.tPrinted = printUniforms.tPrinted;

    shader.fragmentShader = `
      uniform float uPrintProgress;
      uniform sampler2D tBlank;
      uniform sampler2D tPrinted;
    ` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #ifdef USE_MAP
        vec4 blankTexel = texture2D( tBlank, vMapUv );
        vec4 printedTexel = texture2D( tPrinted, vMapUv );

        // Print progress moves from top (vMapUv.y = 1.0) down to bottom (vMapUv.y = 0.0)
        float printThreshold = 1.0 - uPrintProgress;
        float dist = vMapUv.y - printThreshold;

        // Smooth print boundary
        float mask = smoothstep(-0.014, 0.014, dist);

        // Glowing Dell Red laser reaction edge right at the print line
        float laserEdge = (1.0 - smoothstep(0.0, 0.038, abs(dist))) * step(0.005, uPrintProgress) * (1.0 - step(0.995, uPrintProgress));
        vec3 laserGlow = vec3(0.91, 0.11, 0.16);

        vec4 blendedTexel = mix(blankTexel, printedTexel, mask);
        blendedTexel.rgb += laserGlow * laserEdge * 1.6;

        diffuseColor *= blendedTexel;
      #endif
      `
    );
  };

  const heroMesh = new THREE.Mesh(heroGeometry, heroMaterial);
  heroMesh.castShadow = true;
  emergingCertGroup.add(heroMesh);

  // Machined Brass Corner Registry Clip
  const clipGeometry = new THREE.BoxGeometry(0.12, 0.26, 0.09);
  const cornerClip = new THREE.Mesh(clipGeometry, polishedBrassMaterial);
  cornerClip.position.set(-halfW + 0.14, halfH - 0.14, 0.01);
  cornerClip.rotation.z = -0.15;
  emergingCertGroup.add(cornerClip);

  // Initial position: Resting on press bed ready for dispatch
  emergingCertGroup.rotation.x = -Math.PI / 2 + 0.06;
  emergingCertGroup.position.set(0, 0.16, 0.22);

  // 9. ARCHIVAL PRESENTATION ENVELOPE & DOCKET FOLIO (Scene E Archive)
  const archiveDocketGroup = new THREE.Group();
  archiveDocketGroup.position.set(0, 0.04, 1.85);

  // Envelope Back Plate (Midnight Navy Archival Cloth)
  const envBackGeom = new THREE.BoxGeometry(4.25, 0.03, 3.05);
  const envBackMesh = new THREE.Mesh(envBackGeom, bookclothMaterial);
  envBackMesh.position.set(0, 0.015, 0);
  envBackMesh.receiveShadow = true;
  addMeshEdges(envBackMesh, 0x000000, edgeCollector);
  archiveDocketGroup.add(envBackMesh);

  // Envelope Bottom Pocket Sleeve (Interior clearance for certificate insert)
  const envPocketGeom = new THREE.BoxGeometry(4.27, 0.03, 1.95);
  const envPocketMesh = new THREE.Mesh(envPocketGeom, bookclothMaterial);
  envPocketMesh.position.set(0, 0.060, 0.55);
  envPocketMesh.receiveShadow = true;
  addMeshEdges(envPocketMesh, 0x000000, edgeCollector);
  archiveDocketGroup.add(envPocketMesh);

  // Gold Trim Line along pocket mouth
  const pocketTrimGeom = new THREE.BoxGeometry(4.29, 0.015, 0.05);
  const pocketTrim = new THREE.Mesh(pocketTrimGeom, polishedBrassMaterial);
  pocketTrim.position.set(0, 0.076, -0.42);
  archiveDocketGroup.add(pocketTrim);

  // Subtle Gold Trim Line along bottom edge of pocket
  const pocketBottomTrimGeom = new THREE.BoxGeometry(4.25, 0.012, 0.04);
  const pocketBottomTrim = new THREE.Mesh(pocketBottomTrimGeom, polishedBrassMaterial);
  pocketBottomTrim.position.set(0, 0.076, 1.48);
  archiveDocketGroup.add(pocketBottomTrim);

  // The Hinged Envelope Flap Group (hinged at top edge at Y = 0.078)
  const flapHingeGroup = new THREE.Group();
  flapHingeGroup.position.set(0, 0.078, -1.50); // Top hinge of the envelope
  flapHingeGroup.rotation.x = -2.3; // Initially wide open

  // Flap Body: Folds cleanly down over the certificate pocket
  const flapGeom = new THREE.BoxGeometry(4.20, 0.020, 1.62);
  const flapMesh = new THREE.Mesh(flapGeom, bookclothMaterial);
  flapMesh.position.set(0, 0.010, 0.81); // Centered relative to hinge
  addMeshEdges(flapMesh, 0x000000, edgeCollector);
  flapHingeGroup.add(flapMesh);

  // Gold Trim on Flap Edge
  const flapTrimGeom = new THREE.BoxGeometry(4.22, 0.016, 0.05);
  const flapTrim = new THREE.Mesh(flapTrimGeom, polishedBrassMaterial);
  flapTrim.position.set(0, 0.021, 1.60);
  flapHingeGroup.add(flapTrim);

  // Dell Red Wax Seal Medallion on Flap Tip (Seals shut when flap folds down)
  const flapSealGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.032, 24);
  const flapSealMesh = new THREE.Mesh(flapSealGeom, redAccentMaterial);
  flapSealMesh.position.set(0, 0.030, 1.55);
  flapHingeGroup.add(flapSealMesh);

  const flapSealInnerGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.038, 20);
  const flapSealInnerMesh = new THREE.Mesh(flapSealInnerGeom, polishedBrassMaterial);
  flapSealInnerMesh.position.set(0, 0.032, 1.55);
  flapHingeGroup.add(flapSealInnerMesh);

  archiveDocketGroup.add(flapHingeGroup);

  // MASTER ATELIER ORCHESTRATION GROUP
  // Centered at local origin; responsive camera view offset centers it in the visible stage area
  const atelierMasterGroup = new THREE.Group();
  atelierMasterGroup.position.set(0, 0, 0);

  // 1996 Technical CAD Floor Grid Helper
  const floorGrid = new THREE.GridHelper(12, 24, 0x000000, 0xa5b8c0);
  floorGrid.position.set(0, -0.155, 0);
  atelierMasterGroup.add(floorGrid);

  atelierMasterGroup.add(groundShadow);
  atelierMasterGroup.add(pressChassisGroup);
  atelierMasterGroup.add(intakeGroup);
  atelierMasterGroup.add(emergingCertGroup);
  atelierMasterGroup.add(archiveDocketGroup);
  scene.add(atelierMasterGroup);

  // 10. TECHNICAL ATMOSPHERIC PARTICLES
  const particleCount = 35;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePos[i * 3 + 0] = (Math.random() - 0.5) * 6.0;
    particlePos[i * 3 + 1] = 0.2 + Math.random() * 2.8;
    particlePos[i * 3 + 2] = (Math.random() - 0.5) * 5.0;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x000000,
    size: 0.035,
    transparent: true,
    opacity: 0.50,
  });
  const dustParticles = new THREE.Points(particleGeo, particleMat);
  scene.add(dustParticles);

  // 11. REFINED TECHNICAL THREE-POINT STUDIO LIGHTING RIG
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.20);
  scene.add(ambientLight);

  // Primary Studio Key Light
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(2.4, 4.2, 3.8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  // Steel Fill Light
  const fillLight = new THREE.DirectionalLight(0xa5b8c0, 0.65);
  fillLight.position.set(-3.2, -0.8, 2.6);
  scene.add(fillLight);

  // Polished Brass Specular Rim Light from Rear
  const rimLight = new THREE.PointLight(0xfcc20f, 0.70, 12);
  rimLight.position.set(0, 1.8, -2.2);
  scene.add(rimLight);

  // 12. SCROLL DYNAMICS & CONTINUOUS TIMELINE
  let targetScrollProgress = 0;
  let currentSmoothProgress = 0;

  // Drag interaction
  let isDragging = false;
  let prevPointerX = 0;
  let prevPointerY = 0;
  let dragRotY = 0;
  let dragRotX = 0;
  let baseRotY = -0.06;
  let baseRotX = 0.06;
  let currentRotY = -0.06;
  let currentRotX = 0.06;

  /**
   * Continuous Spline Timeline Evaluator
   * Computes C1-continuous camera position, lookAt, machinery rotations,
   * progressive print appearance, and envelope closure.
   */
  const evaluateTimeline = (prog: number) => {
    const p = Math.max(0, Math.min(1, prog));

    // Find the bounding segment in TIMELINE_LANDMARKS
    let i = 0;
    while (i < TIMELINE_LANDMARKS.length - 2 && p > TIMELINE_LANDMARKS[i + 1].p) {
      i++;
    }
    const l0 = TIMELINE_LANDMARKS[i];
    const l1 = TIMELINE_LANDMARKS[i + 1];

    // Local segment parameter t with smooth Hermite easing
    const segSpan = l1.p - l0.p;
    const rawT = segSpan > 0 ? (p - l0.p) / segSpan : 0;
    const t = Math.max(0, Math.min(1, rawT));
    // Cubic Hermite smoothstep: 3t^2 - 2t^3
    const s = t * t * (3 - 2 * t);

    // 1. Camera Position & LookAt
    const camX = THREE.MathUtils.lerp(l0.camPos[0], l1.camPos[0], s);
    const camY = THREE.MathUtils.lerp(l0.camPos[1], l1.camPos[1], s);
    const camZ = THREE.MathUtils.lerp(l0.camPos[2], l1.camPos[2], s);
    camera.position.set(camX, camY, camZ);

    const lookX = THREE.MathUtils.lerp(l0.lookAt[0], l1.lookAt[0], s);
    const lookY = THREE.MathUtils.lerp(l0.lookAt[1], l1.lookAt[1], s);
    const lookZ = THREE.MathUtils.lerp(l0.lookAt[2], l1.lookAt[2], s);
    camera.lookAt(lookX, lookY, lookZ);

    // 2. Chassis Base Tilt
    baseRotY = THREE.MathUtils.lerp(l0.baseRotY, l1.baseRotY, s);
    baseRotX = THREE.MathUtils.lerp(l0.baseRotX, l1.baseRotX, s);

    // 3. Recipient Slips Feed
    slip1Mesh.position.z = THREE.MathUtils.lerp(l0.slip1Z, l1.slip1Z, s);
    slip2Mesh.position.z = THREE.MathUtils.lerp(l0.slip2Z, l1.slip2Z, s);
    slip3Mesh.position.z = THREE.MathUtils.lerp(l0.slip3Z, l1.slip3Z, s);

    // 4. Certificate Position & Tilt
    const certPosX = THREE.MathUtils.lerp(l0.certPos[0], l1.certPos[0], s);
    const certPosY = THREE.MathUtils.lerp(l0.certPos[1], l1.certPos[1], s);
    const certPosZ = THREE.MathUtils.lerp(l0.certPos[2], l1.certPos[2], s);
    emergingCertGroup.position.set(certPosX, certPosY, certPosZ);
    emergingCertGroup.rotation.x = THREE.MathUtils.lerp(l0.certRotX, l1.certRotX, s);

    // Physically flatten parchment curvature when docked inside the archival envelope pocket in Act V
    if (p >= 0.80) {
      const dockS = THREE.MathUtils.smoothstep(p, 0.80, 0.90);
      emergingCertGroup.scale.z = 1.0 - 0.85 * dockS;
    } else {
      emergingCertGroup.scale.z = 1.0;
    }

    // 5. Progressive Printing Shader Reveal (Blank -> Printed)
    const printProg = THREE.MathUtils.lerp(l0.printProgress, l1.printProgress, s);
    printUniforms.uPrintProgress.value = printProg;

    // 6. Laser Printhead Motion & Laser Beam
    let baseCarriageX = THREE.MathUtils.lerp(l0.carriageX, l1.carriageX, s);
    // Smooth sinusoidal scan sweep during Act III printing phase
    if (p >= 0.40 && p <= 0.68) {
      const sweepProgress = (p - 0.40) / 0.28;
      const sweepSin = Math.sin(sweepProgress * Math.PI * 4.0);
      baseCarriageX += sweepSin * 0.48;
    }
    carriageGroup.position.x = baseCarriageX;

    const laserInt = THREE.MathUtils.lerp(l0.laserIntensity, l1.laserIntensity, s);
    printLaserLight.intensity = laserInt;
    beamConeMat.opacity = THREE.MathUtils.lerp(l0.coneOpacity, l1.coneOpacity, s);

    // 7. Envelope Flap Folding & Closure
    const flapRotation = THREE.MathUtils.lerp(l0.flapRotX, l1.flapRotX, s);
    flapHingeGroup.rotation.x = flapRotation;

    // 8. Rollers & Spur Gears Continuous Spin
    const rollerRot = p * Math.PI * 22.0;
    rollerTop.rotation.x = rollerRot;
    rollerBottom.rotation.x = -rollerRot;
    leftTopGear.rotation.x = rollerRot;
    leftBottomGear.rotation.x = -rollerRot;
  };

  // High-performance direct passive window scroll observer for 0ms lag & 120-240 FPS buttery smoothness
  const onDirectWindowScroll = () => {
    if (isDisposed) return;
    const section = (container.closest('#atelier-experience') || document.getElementById('atelier-experience')) as HTMLElement | null;
    if (!section) return;
    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    const sectionTop = scrollY + section.getBoundingClientRect().top;
    const rawProgress = (scrollY - sectionTop) / total;
    targetScrollProgress = Math.max(0, Math.min(1, rawProgress));
  };

  window.addEventListener('scroll', onDirectWindowScroll, { passive: true });
  onDirectWindowScroll();

  // 13. POINTER INTERACTION (360° Drag & Parallax)
  const onPointerDown = (e: PointerEvent) => {
    if (isReducedMotion) return;
    isDragging = true;
    prevPointerX = e.clientX;
    prevPointerY = e.clientY;
    container.style.cursor = 'grabbing';
  };

  const onPointerMove = (e: PointerEvent) => {
    if (isReducedMotion) return;
    const rect = container.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    if (isDragging) {
      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      dragRotY += deltaX * 0.006;
      dragRotX += deltaY * 0.006;

      dragRotX = Math.max(-0.55, Math.min(0.55, dragRotX));
      dragRotY = Math.max(-0.85, Math.min(0.85, dragRotY));
    } else {
      // Subtle parallax response to mouse position
      keyLight.position.x = 2.4 + normX * 1.5;
      keyLight.position.y = 4.2 + normY * 1.0;
    }
  };

  const onPointerUp = () => {
    isDragging = false;
    container.style.cursor = 'grab';
  };

  const onDoubleClick = () => {
    dragRotY = 0;
    dragRotX = 0;
  };

  const onPointerLeave = () => {
    isDragging = false;
    container.style.cursor = 'grab';
  };

  container.style.cursor = 'grab';
  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  container.addEventListener('pointerleave', onPointerLeave);
  container.addEventListener('dblclick', onDoubleClick);

  // 14. RESIZE HANDLER
  const onResize = () => {
    if (isDisposed || !container) return;
    const newW = container.clientWidth || 700;
    const newH = container.clientHeight || 520;
    applyCameraLayout(newW, newH);
    renderer.setSize(newW, newH);
    onDirectWindowScroll();
  };

  window.addEventListener('resize', onResize);

  // 15. ANIMATION RENDER LOOP (High-Refresh Synchronized Exponential Smoothing)
  let lastFrameTime = performance.now();

  const animate = (time: DOMHighResTimeStamp) => {
    if (isDisposed) return;

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      lastFrameTime = time;
      animationFrameId = requestAnimationFrame(animate);
      return;
    }

    // High refresh screen delta timing synchronized with browser vsync
    const rawDelta = (time - lastFrameTime) * 0.001;
    lastFrameTime = time;
    // Clamp delta between 2ms (up to 500Hz displays) and 33ms (30Hz fallback)
    const delta = Math.min(0.033, Math.max(0.002, rawDelta));
    const elapsedTime = time * 0.001;

    if (isReducedMotion) {
      // Scroll still selects production stages; only automatic motion and
      // smoothing are disabled by the user's accessibility preference.
      currentSmoothProgress = targetScrollProgress;
      evaluateTimeline(currentSmoothProgress);
      camera.position.set(0.00, 2.75, 6.10);
      camera.lookAt(0.00, 0.45, 0.35);
    } else {
      // Frame-rate independent exponential smoothing factor (13.5 for buttery, responsive feel on 60Hz-240Hz)
      const lerpAlpha = 1.0 - Math.exp(-delta * 13.5);
      const diff = targetScrollProgress - currentSmoothProgress;
      if (Math.abs(diff) < 0.00004) {
        currentSmoothProgress = targetScrollProgress;
      } else {
        currentSmoothProgress += diff * lerpAlpha;
      }

      // Update continuous physics & timeline
      evaluateTimeline(currentSmoothProgress);

      // Subtle atmospheric dust motes float upwards
      const positions = dustParticles.geometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        let py = positions.getY(i) + delta * 0.08;
        if (py > 3.2) py = 0.2;
        positions.setY(i, py);
      }
      positions.needsUpdate = true;

      // Smooth chassis drag rotation
      const targetRotY = baseRotY + dragRotY;
      const targetRotX = baseRotX + dragRotX;
      currentRotY += (targetRotY - currentRotY) * lerpAlpha;
      currentRotX += (targetRotX - currentRotX) * lerpAlpha;

      // Smooth master chassis rotation
      atelierMasterGroup.rotation.y = currentRotY;
      atelierMasterGroup.rotation.x = currentRotX;

      // Paper breathing float in hero inspection zone (with Hermite window to eliminate edge jumps)
      if (!isDragging && currentSmoothProgress >= 0.68 && currentSmoothProgress <= 0.84) {
        const floatEnvelope =
          THREE.MathUtils.smoothstep(currentSmoothProgress, 0.68, 0.72) *
          (1.0 - THREE.MathUtils.smoothstep(currentSmoothProgress, 0.80, 0.84));
        emergingCertGroup.position.y += Math.sin(elapsedTime * 1.6) * 0.005 * floatEnvelope;
      }
    }

    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  };

  // Initial update
  evaluateTimeline(0);
  animationFrameId = requestAnimationFrame(animate);

  // 16. Controller Interface
  return {
    setReducedMotion: (enabled: boolean) => {
      isReducedMotion = enabled;
      if (enabled) {
        camera.position.set(-0.05, 2.10, 4.85);
        camera.lookAt(0.05, 0.38, 0.15);
      }
    },
    resetView: () => {
      onDoubleClick();
    },
    setScrollProgress: (progress: number) => {
      targetScrollProgress = Math.max(0, Math.min(1, progress));
      if (isReducedMotion) {
        currentSmoothProgress = targetScrollProgress;
        evaluateTimeline(currentSmoothProgress);
      }
    },
    dispose: () => {
      isDisposed = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener('scroll', onDirectWindowScroll);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);
      container.removeEventListener('dblclick', onDoubleClick);

      // Dispose Geometries
      shadowGeo.dispose();
      bedGeometry.dispose();
      rulerTrimGeometry.dispose();
      bedRailGeometry.dispose();
      gantryGeometry.dispose();
      plaqueGeom.dispose();
      micrometerKnobGeom.dispose();
      bearingGeom.dispose();
      overheadRailGeometry.dispose();
      rollerGeometry.dispose();
      axleGeom.dispose();
      gearGeometry.dispose();
      carriageGeometry.dispose();
      capGeometry.dispose();
      lensBarrelGeom.dispose();
      apertureGeom.dispose();
      beamConeGeom.dispose();
      chuteGeometry.dispose();
      guideGeometry.dispose();
      slipGeom.dispose();
      heroGeometry.dispose();
      clipGeometry.dispose();
      envBackGeom.dispose();
      envPocketGeom.dispose();
      pocketTrimGeom.dispose();
      pocketBottomTrimGeom.dispose();
      flapGeom.dispose();
      flapTrimGeom.dispose();
      flapSealGeom.dispose();
      flapSealInnerGeom.dispose();
      particleGeo.dispose();
      floorGrid.geometry.dispose();
      if (Array.isArray(floorGrid.material)) {
        floorGrid.material.forEach((m) => m.dispose());
      } else {
        floorGrid.material.dispose();
      }
      edgeCollector.geoms.forEach((g) => g.dispose());
      edgeCollector.mats.forEach((m) => m.dispose());

      // Dispose Materials
      shadowMat.dispose();
      slateBaseMaterial.dispose();
      machinedIronMaterial.dispose();
      polishedBrassMaterial.dispose();
      steelAxleMaterial.dispose();
      bronzeBushingMaterial.dispose();
      plaqueMaterial.dispose();
      redAccentMaterial.dispose();
      apertureMat.dispose();
      beamConeMat.dispose();
      slipMat1.dispose();
      slipMat2.dispose();
      slipMat3.dispose();
      heroMaterial.dispose();
      bookclothMaterial.dispose();
      particleMat.dispose();

      // Dispose Textures
      contactShadowTex.dispose();
      brushedMetalTex.dispose();
      plaqueTex.dispose();
      blankTexture.dispose();
      certTexture.dispose();
      slip1Tex.dispose();
      slip2Tex.dispose();
      slip3Tex.dispose();
      studioEnv.dispose();

      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

export { isWebGLAvailable };
