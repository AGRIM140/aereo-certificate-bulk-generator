# Canonical Design Specification — Living Archive System
## Bulk Certificate Generator • Design System & Craft Guidelines
### Synthesizing Claude × Linear × Resend × IBM Carbon × Notion

---

## 1. Product Design Philosophy

The Bulk Certificate Generator interface is conceived as an **Archival Instrument**: a digital atelier fusing the tactile materiality of a historical certification authority with the sub-second precision of a modern data-processing platform.

### Core Tenets
1. **Material Authenticity Over Surface Gimmicks**: Surfaces feel like cold-pressed vellum, archival rag paper, and ink-inscribed ledgers—not synthetic plastic cards with decorative gradients.
2. **Editorial Hierarchy Over Generic Dashboards**: Prominent editorial serif headlines evoke official proclamation and prestige, while body text and data grids remain crisp, legible, and compact.
3. **Physical & Zero-Divergence 3D Experience**: 3D artifacts reflect authentic physical documents (curved paper deflection, layered sheets, corner binding clips, wax seals, studio lighting). The 3D certificate inspector renders the authoritative backend ReportLab-compiled PDF bytes through PDF.js without visual divergence.
4. **Quiet, Persistent Atmosphere**: A continuous paper background sits behind the application without re-mounting or interfering with mouse clicks, selection, or keyboard navigation.
5. **Purposeful Motion & Strict Restraint**: Animations communicate state changes, physical depth, and gentle ambience. Zero aggressive, infinite, or distracting motion.

---

## 2. Color System & Design Tokens

Defined in `frontend/src/index.css`:

```css
:root {
  /* Paper Canvas & Surfaces (Informed by Claude & Notion) */
  --paper-canvas: #f8f5ed;        /* Warm ivory vellum foundation */
  --paper-surface: #ffffff;       /* Pure parchment elevated surface */
  --paper-surface-muted: #fbf9f4; /* Subtle inset tint */
  --paper-surface-inset: #ede6d6; /* Ledger groove / table header tint */
  --paper-surface-card: #fdfcf9;  /* Rag paper card surface */

  /* Hairline Borders (Informed by Linear & Resend) */
  --border-paper: #e2dac9;        /* Default parchment border */
  --border-paper-subtle: #ece5d6; /* Table divider / light rule */
  --border-paper-hover: #b8a892;  /* Interactive hover border */
  --border-paper-focus: #1f304d;  /* High-contrast ink focus ring */

  /* Archival Notebook Margin Accent (Informed by Claude Terracotta) */
  --margin-rust: #b83a34;         /* Traditional notebook vertical margin rule */
  --margin-rust-subtle: rgba(184, 58, 52, 0.15);

  /* Ink Typography Hierarchy (Informed by Claude Carbon Inks) */
  --ink-primary: #151922;         /* Deep carbon black */
  --ink-secondary: #2d3544;       /* Charcoal ink */
  --ink-muted: #5a6478;           /* Muted annotation graphite */
  --ink-faint: #8893a6;           /* Ledger metadata hint */

  /* Technical & Editorial Accents */
  --ink-blue: #1f304d;            /* Technical navy */
  --ink-blue-soft: #2d4263;
  --brass-accent: #c5a059;        /* Antique gold & brass clip */
  --wax-vermilion: #991b1b;       /* Deep crimson wax seal */

  /* Semantic Status Tokens (IBM Carbon Accessibility Standards) */
  --forest-primary: #15803d;      /* COMPLETED status */
  --forest-surface: #f0fdf4;
  --forest-border: #bbf7d0;

  --amber-primary: #b45309;       /* PENDING status */
  --amber-surface: #fffbeb;
  --amber-border: #fde68a;

  --navy-primary: #2563eb;        /* PROCESSING status */
  --navy-surface: #eff6ff;
  --navy-border: #bfdbfe;

  --crimson-primary: #b83a34;     /* FAILED status */
  --crimson-surface: #fef2f2;
  --crimson-border: #fecaca;
}
```

---

## 3. Typography Hierarchy & Font Loading

### 3.1 Type Families
* **Display & Major Headlines**: `'Fraunces', Georgia, 'Times New Roman', serif;`
  * Applied via `.font-serif` or `.font-serif-editorial`.
  * Optical sizes: `opsz 9..144`, weights: `600..700`.
  * Used for: Landing hero headline, major page headings, and certificate recipient display names.
* **Modern Product Interface**: `'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`
  * Applied via default `body` and `.font-sans`.
  * Weights: `400` (regular body), `500` (medium navigation/labels), `600` (semi-bold buttons).
* **Technical Telemetry**: `'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;`
  * Applied via `.font-mono-telemetry` and `.font-mono`.
  * Font features: `"tnum" 1, "zero" 1` (tabular figures and slashed zero).
  * Used for: Job UUIDs, certificate numbers, timestamps, status tags, coordinate metadata.

### 3.2 Loading Strategy
Preconnected in `frontend/index.html` via Google Fonts with `display=swap`. Full system fallbacks defined so no layout shift occurs during network cold starts.

---

## 4. Spacing, Layout & Grid Scale

* **Base Unit**: 4px grid.
* **Padding Scale**:
  * Cards / Panels: `p-4` (16px mobile), `p-5` or `p-6` (20–24px desktop).
  * Page Container: `max-w-7xl mx-auto px-6`.
  * Section Vertical Rhythm: `py-12` to `py-20` on landing, `space-y-6` on operational routes.
* **Borders & Radii**:
  * Default Cards & Modals: `rounded-lg` (8px / 12px) with 1px border `--border-paper`.
  * Inputs & Controls: `rounded-md` (6px) with 1px border.
  * Badges & Filters: `rounded-full` (pill shape).

---

## 5. Component Patterns & Ergonomics

### 5.1 Buttons
* **Primary**: Tactile dark emerald/forest green (`bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm border border-emerald-700/80 active:translate-y-px`).
* **Secondary**: Warm parchment surface (`bg-[#ffffff] hover:bg-[#fbf8f2] text-[#1e2633] border border-[#dcd3c1] shadow-[0_1px_2px_rgba(30,20,10,0.04)]`).
* **Outline / Ghost**: Transparent with subtle hover feedback.
* **Focus State**: `focus-visible:ring-2 focus-visible:ring-[#1f304d] focus-visible:ring-offset-2`.

### 5.2 Operational Tables (Linear & Carbon Influence)
* **Row Height**: Compact 40px–44px pitch.
* **Headers**: Uppercase monospace with tracking (`font-mono-telemetry uppercase text-[11px] text-[#556377]`).
* **Interactive Rows**: Smooth hover tint (`hover:bg-[#fbf7ee]`), cursor pointer, and navigation affordance.
* **Progress Telemetry**: Micro-progress bar and numerical breakdown (`✓ generated`, `✗ failed`, `⋯ pending`).

### 5.3 Status Badges (Wax Stamp Semantic Palette)
* Pill badges with icon + uppercase label.
* Accessible `role="status"` and `aria-label="Status: {status}"`.
* Distinct hues: Amber (Pending), Blue (Processing with pulse animation), Forest Green (Completed/Generated), Crimson Rust (Failed).

---

## 6. Dynamic Paper Background Architecture

* **Component**: `frontend/src/components/layout/DynamicPaperBackground.tsx`.
* **Layers**:
  1. Warm ivory radial gradient (`#fffefc` via `#f7f3ea` to `#eee5d3`).
  2. Ambient desk lamp vignette with slow 28s / 38s keyframe drift.
  3. Pointer-parallax lighting updating CSS custom properties directly (`--light-shift-x`, `--light-shift-y`) via `requestAnimationFrame` without React re-renders.
  4. Ruled notebook lines (28px vertical pitch) & ledger grid (56px horizontal pitch).
  5. Rust-red notebook margin rule (left rail) with registration crosshairs.
  6. Cold-pressed vellum tooth SVG grain texture (`feTurbulence` + `feColorMatrix`).
* **Performance & Safety**:
  * Fixed viewport container with `pointer-events: none` and `z-index: 0`.
  * Zero interference with text selection, link clicks, scrolling, or focus.
  * Honors `prefers-reduced-motion` by disabling animation and pointer tracking.

---

## 7. 3D Document Pipeline & Zero-Divergence Rule

### 7.1 Landing Page Centerpiece
* **Component**: `frontend/src/lib/three/createLandingScene.ts`.
* 3-sheet paper stack (hero curved document + 2 askew vellum backing sheets).
* Antique brass corner clip mesh (`#d4af37`).
* Scalloped crimson wax seal with antique gold medallion stamped `"• VERIFIED • ARCHIVE"`.
* Interactive drag-to-rotate with damping, double-click camera reset, and "Record Specs" flyout.

### 7.2 3D Certificate Inspector
* **Pipeline**: Backend ReportLab PDF → PDF.js rasterization → HTML Canvas → Three.js `CanvasTexture` → 3D Paper Mesh.
* **Mount**: Museum archival slate mount (`#181715` / `#0c0f16`).
* **Integrity**: Zero divergence. The 3D view renders the exact authoritative PDF bytes that the user downloads.

---

## 8. Anti-Patterns (Strictly Prohibited)

1. **NO Neon Cyan / Cyberpunk Colors**: All synthetic electric cyans have been removed in favor of warm navy, deep carbon ink, and terracotta rust.
2. **NO Heavy Glassmorphism Blobs**: No excessive `backdrop-filter: blur(40px)` layers that impair performance or reduce contrast over paper textures.
3. **NO Fake Telemetry**: Never simulate progress or fabricate certificate results. All numbers reflect actual backend API responses.
4. **NO Mock Certificates**: Never replace the downloadable PDF or 3D canvas with an image approximation.
5. **NO Backend Modifications**: Backend is strictly frozen at commit `cf5bb3d`.
