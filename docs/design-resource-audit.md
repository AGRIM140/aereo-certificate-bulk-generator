# Design Resource Audit & Selection Analysis — Taste Skill × Living Archive
**Bulk Certificate Generator • Comprehensive Audit of 74 Design Systems**

- **Document Version**: 2.0 (Living Archive Master Audit)
- **Project Scope**: Bulk Certificate Generator (Phase F1–F7 Architectural Refinement)
- **Date**: October 2026
- **Architecture Role**: Senior Product Designer, Creative Technologist & Frontend Architect
- **Design Philosophy**: Archival Instrument ("Living Archive")
- **Backend Status**: Production Release `v1.0.0` (Django REST Framework + PostgreSQL 17 + Celery + Redis + ReportLab)

---

## 1. Executive Summary & Design Read

Following the Taste Skill specification (`.agents/skills/design-taste-frontend/SKILL.md` Section 0.B):

> **Design Read**: *"Reading this as: High-Volume Archival Certificate & Document Infrastructure for institutional operators and event organizers, with an Archival Instrument editorial visual language, synthesizing Claude's warm cream canvas and terracotta accents, Resend's print-magazine display typography, Linear's dense operational table telemetry, Notion's tactile ledger surfaces, and IBM Carbon's strict tabular accessibility, rendered with physical 3D paper deflection and zero-divergence PDF fidelity."*

### 1.1 The Three Dials Configuration
* **`DESIGN_VARIANCE: 7`** (Controlled Asymmetry) — Asymmetric editorial hero with floating 3D paper stack, structured bento operational panels, multi-stage interactive architectural pipeline, balanced with disciplined tabular records.
* **`MOTION_INTENSITY: 5`** (Quiet Cinematic Ambience) — Slow ambient paper drift (28s period), pointer-parallax lighting without React re-renders, smooth 3D drag-to-rotate with velocity damping, double-click camera reset; zero distracting infinite micro-animations.
* **`VISUAL_DENSITY: 5`** (Operational Elegance) — High-density data tables and recipient roster ledgers (Linear/Carbon-grade) paired with generous editorial breathing room on document presentation surfaces.

---

## 2. Inventory of the Complete Design Systems Library (74 Systems)

The workspace provides an extensive local library of 74 brand and platform design specifications under `design-systems/`, each containing structured `DESIGN.md` tokens, typographic scales, surface ladders, and layout conventions.

### 2.1 Complete Category Taxonomy of 74 Systems

1. **Editorial & Humanist Workspaces (High Affinity)**:
   * `claude` (Anthropic), `resend`, `notion`, `mistral.ai`, `airtable`, `cohere`, `figma`.
2. **Dense Operational & Developer Tools (High Technical Affinity)**:
   * `linear.app`, `ibm` (Carbon), `raycast`, `mintlify`, `sentry`, `posthog`, `stripe`, `supabase`, `hashicorp`, `clickhouse`, `cursor`, `warp`.
3. **News & Publication Timelines (Timeline Affinity)**:
   * `theverge`, `wired`.
4. **Creator & Media Platforms (Reference Only)**:
   * `framer`, `webflow`, `sanity`, `runwayml`, `elevenlabs`, `replicate`, `minimax`, `together.ai`, `x.ai`, `ollama`, `opencode.ai`.
5. **High-Gloss Automotive & Luxury (Rejected - Incompatible Domain)**:
   * `bmw`, `bmw-m`, `bugatti`, `ferrari`, `lamborghini`, `tesla`, `renault`.
6. **Financial Trading & High-Frequency Crypto (Rejected - High Volatility)**:
   * `binance`, `coinbase`, `kraken`, `revolut`, `wise`, `mastercard`.
7. **Consumer Social & Entertainment (Rejected - Incompatible Vibe)**:
   * `apple`, `airbnb`, `meta`, `spotify`, `starbucks`, `nike`, `pinterest`, `playstation`, `slack`, `miro`, `nintendo-2001`, `dell-1996`.
8. **Enterprise Cloud & Telecom (Rejected - Corporate Blandness)**:
   * `hp`, `uber`, `vodafone`, `spacex`, `cal`, `clay`, `composio`, `expo`, `mongodb`, `nvidia`, `shopify`, `superhuman`, `vercel`, `voltagent`, `zapier`.

---

## 3. Detailed Evaluation & Ranking of Strongest Candidates

Each serious candidate was scored across 12 rigorous evaluation dimensions (scale 1–10):

| Design System | Product Fit | Visual Identity | Typography | Operational UI | Document Design | Component Reuse | Asset Quality | Responsive | Accessibility | Tech Compat | Performance | Rank & Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Claude** (`claude`) | 10 | 10 | 10 | 9 | 10 | 9 | 9 | 10 | 9 | 10 | 10 | **#1 PRIMARY SYSTEM (Selected)** |
| **Linear** (`linear.app`) | 9 | 9 | 9 | 10 | 8 | 9 | 8 | 10 | 10 | 10 | 10 | **#2 COMPLEMENTARY (Selected)** |
| **Resend** (`resend`) | 9 | 10 | 10 | 8 | 10 | 8 | 8 | 10 | 9 | 10 | 10 | **#3 COMPLEMENTARY (Selected)** |
| **IBM Carbon** (`ibm`) | 9 | 8 | 9 | 10 | 8 | 9 | 8 | 10 | 10 | 10 | 10 | **#4 COMPLEMENTARY (Selected)** |
| **Notion** (`notion`) | 10 | 9 | 8 | 8 | 10 | 8 | 8 | 10 | 8 | 10 | 10 | **#5 COMPLEMENTARY (Selected)** |
| **The Verge** (`theverge`) | 8 | 8 | 8 | 9 | 7 | 8 | 7 | 9 | 9 | 10 | 9 | **#6 TIMELINE PATTERN (Selected)** |
| **Stripe** (`stripe`) | 8 | 8 | 8 | 9 | 8 | 8 | 7 | 10 | 9 | 10 | 9 | **#7 SUPPORTING (Form Validation)** |
| **Raycast** (`raycast`) | 7 | 8 | 8 | 9 | 6 | 8 | 7 | 9 | 9 | 10 | 10 | **#8 INFORMATIVE (Shortcuts)** |
| **Mistral AI** (`mistral.ai`) | 8 | 8 | 9 | 7 | 8 | 7 | 7 | 9 | 8 | 10 | 9 | **#9 INFORMATIVE (Serif Scales)** |
| **Mintlify** (`mintlify`) | 7 | 7 | 8 | 8 | 7 | 8 | 7 | 9 | 9 | 10 | 10 | **#10 INFORMATIVE (Docs Layout)** |

---

## 4. Deep Analysis of Selected Systems & Direct Pattern Adoption

### 4.1 Primary System: Claude (`design-systems/claude/DESIGN.md`)
* **Core Characteristics**: Warm-canvas editorial interface built on a cream/terracotta foundation. Pairs slab-serif display typography with crisp humanist sans and code/tabular mono.
* **Direct Token & Pattern Adoption**:
  * **Canvas Foundation**: Canvas base `#faf9f5` / `#f8f5ed` (warm vellum).
  * **Surface Ladder**:
    * `surface-soft`: `#f5f0e8` / `#fbf9f4` for subtle insets and subheaders.
    * `surface-card`: `#efe9de` / `#ffffff` with warm hairline borders (`#e6dfd8` / `#e2dac9`).
    * `surface-cream-strong`: `#e8e0d2` for metadata chips and active indicators.
    * `surface-dark`: `#181715` / `#161a22` for the 3D museum slate mount and terminal telemetry headers.
  * **Accent Color**: Warm terracotta / coral rust (`#cc785c` / `#b83a34`) used for notebook margin lines, registration crosshairs, and primary CTA highlights.
  * **Ink Tone**: Deep carbon ink (`#141413` / `#161a22`) and charcoal body (`#3d3d3a` / `#2d3544`) replacing harsh pure black or washed-out grays.
  * **Component Reuse Pattern**: Button heights (40px default), padding (12px 20px / 8px 14px), 8px corner radius (`rounded.md`), and warm border hover transitions.

### 4.2 Complementary System: Linear (`design-systems/linear.app/DESIGN.md`)
* **Core Characteristics**: The pinnacle of developer software craft. Highly disciplined data density, negative letter-tracking on display labels, and compact micro-interactions.
* **Direct Pattern Adoption**:
  * **Table Telemetry**: Compact 40px row height, hover-activated subtle left-rail accent line, and muted secondary metadata rows.
  * **Pill Filters**: Segmented filter toolbar (`rounded.pill` = 9999px, padding 6px 14px) with crisp contrast inversions on active state.
  * **Status Telemetry**: Status dots with soft radial glow, active pulsating rings for `PROCESSING` jobs.
  * **Focus Ring Vocabulary**: `focus-visible:ring-2 focus-visible:ring-[#1f304d]` with 2px offset for accessible keyboard navigation.

### 4.3 Complementary System: Resend (`design-systems/resend/DESIGN.md`)
* **Core Characteristics**: Print-magazine confidence with oversized Domaine Display serif headings, hairline 1px translucent borders, and zero decorative chrome.
* **Direct Pattern Adoption**:
  * **Editorial Display Typography**: Oversized display headlines in `Fraunces` (Domaine Display equivalent) with optical size adjustments (`opsz 9..144`).
  * **Minimalist Container Discipline**: 1px crisp hairlines, zero heavy drop shadows, and quiet atmospheric depth.
  * **Document Focus**: The physical document/certificate is the hero, surrounded by clean, disciplined framing.

### 4.4 Complementary System: IBM Carbon (`design-systems/ibm/DESIGN.md`)
* **Core Characteristics**: Enterprise data density, strict square corners (0–6px), monospace tabular numerals, and uncompromised WCAG accessibility.
* **Direct Pattern Adoption**:
  * **Tabular Figures**: `IBM Plex Mono` with `font-feature-settings: "tnum" 1, "zero" 1` for all job UUIDs, certificate numbers, timestamps, and percentages.
  * **Accessible Semantic States**: Strict 4.5:1 contrast ratios:
    * `COMPLETED`: Forest Green (`#15803d` / surface `#f0fdf4` / border `#bbf7d0`).
    * `PENDING`: Amber (`#b45309` / surface `#fffbeb` / border `#fde68a`).
    * `PROCESSING`: Technical Blue (`#1e3a5f` / surface `#eff6ff` / border `#bfdbfe`).
    * `FAILED`: Crimson Rust (`#b83a34` / surface `#fef2f2` / border `#fecaca`).

### 4.5 Complementary System: Notion (`design-systems/notion/DESIGN.md`)
* **Core Characteristics**: Document-first workspace with warm paper ergonomics, pastel tag chips, and structured field notebooks.
* **Direct Pattern Adoption**:
  * **Parchment Surface System**: Inset paper grooves (`#ede6d6`), ruled ledger lines (28px notebook pitch), and ledger grid details (56px pitch).
  * **Tag Chips**: Understated pastel chips for organization tags and batch capacity indicators.

### 4.6 Complementary System: The Verge (`design-systems/theverge/DESIGN.md`)
* **Core Characteristics**: Vertical timeline rail (`StoryStream`) with uppercase tracked mono timestamps.
* **Direct Pattern Adoption**:
  * **Timeline Rail**: Applied to job execution logs and multi-step creation workflows with uppercase tracked mono labels (`01 PREPARE`, `02 SUBMIT`, `03 TRACK`, `04 ARCHIVE`).

---

## 5. Explicitly Rejected Design Systems & Rationale

| Category / System | Inspected Path | Rejection Rationale |
| :--- | :--- | :--- |
| **High-Gloss Automotive** (`bmw`, `bugatti`, `ferrari`, `lamborghini`, `tesla`) | `design-systems/ferrari/DESIGN.md`, etc. | Neon red/yellow tachometer styling, high-contrast dark rooms, and aggressive carbon-fiber chrome. Contradicts archival dignity and calm institutional credibility. |
| **Crypto Exchanges** (`binance`, `coinbase`, `kraken`, `revolut`) | `design-systems/coinbase/DESIGN.md`, etc. | Flashing price tickers, volatile green/red candles, and market depth order books. Inappropriate for legal certificate issuance and historical verification. |
| **Pure Dark Tech / Cyberpunk** (`vercel`, `supabase`, `warp`) | `design-systems/vercel/DESIGN.md`, etc. | Pitch-black OLED canvases with electric cyan/neon-blue glows. The master prompt specifically mandated completely retiring electric cyan in favor of warm archival ivory. |
| **Liquid Glass / Skeuomorphism** (`apple`, `macos`) | `design-systems/apple/DESIGN.md` | Heavy multi-layer `backdrop-filter: blur(40px)` and specular glass borders. Creates GPU rendering bottlenecks during PDF canvas rasterization and reduces text legibility. |
| **Casual Social / Playful** (`slack`, `miro`, `figma`) | `design-systems/slack/DESIGN.md`, etc. | Playful candy avatars, animated emojis, and infinite collaborative whiteboards. Incompatible with official certification registries. |

---

## 6. Implementation Architecture & Asset Mapping

The following synthesis integrates the selected design patterns into our React 19 + TypeScript + Vite codebase:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    SYNTHESIZED LIVING ARCHIVE ARCHITECTURE                   │
├──────────────────────┬──────────────────────┬────────────────────────────────┤
│   CLAUDE + NOTION    │    RESEND PRINT      │     LINEAR + IBM CARBON        │
│   Warm Paper Canvas  │    Editorial Type    │     Operational Telemetry      │
├──────────────────────┼──────────────────────┼────────────────────────────────┤
│ • #f8f5ed Vellum     │ • Fraunces Serif     │ • Tabular Numbers (tnum, zero) │
│ • Warm Card Ladder   │ • Proclamation Head  │ • Hairline Ledger Grid         │
│ • Terracotta Accent  │ • Clean Framing      │ • Compact 40px Table Rows      │
│ • Ruled Margin Guide │ • Inscription Titles │ • Accessible Status Badges     │
│ • Physical 3D Stack  │ • Optical Sizing     │ • Keyboard Focus Vocabulary    │
└──────────────────────┴──────────────────────┴────────────────────────────────┘
```

### 6.1 Route-by-Route Application
1. **Landing Page (`/`)**:
   * Resend-style `Fraunces` headline: `"HIGH-VOLUME ARCHIVAL CERTIFICATE GENERATION."`
   * Claude-style warm canvas background with persistent ambient paper drift.
   * Interactive 3D Paper Stack: 3 curved vellum sheets, antique brass corner clip, stamped crimson/gold wax seal (`#c5a059`), drag-to-rotate, and double-click reset.
   * Multi-stage architectural pipeline: 4-stage interactive switchboard (`01 Data` → `02 Dispatch` → `03 Telemetry` → `04 Archive`).
2. **Dashboard (`/dashboard`)**:
   * Claude-style operational console header: `"OPERATIONAL TELEMETRY CONSOLE"` with live status chip.
   * Notion-style metric cards with subtle inset grooves and authoritative PostgreSQL counts.
   * Linear/Carbon-grade recent jobs table with status badges and micro-progress bars.
3. **Initialize Batch (`/jobs/new`)**:
   * Claude-style form container: `"INITIALIZE CERTIFICATE BATCH"` with field grouping and capacity feedback.
   * Notion-style recipient roster ledger with capacity warning at 500 records.
   * Atomic CSV/JSON modal with drag-and-drop file ingestion and real-time validation.
4. **Job History Ledger (`/jobs`)**:
   * IBM Carbon/Linear historical ledger: `"HISTORICAL JOB LEDGER"` with full pagination, duration telemetry, and batch UUID tracking.
5. **Job Telemetry Details (`/jobs/:jobId`)**:
   * Live telemetry command desk with 2-second visibility-aware polling.
   * The Verge-inspired timeline rail, recipient status breakdown, and manifest preview.
   * Deterministic ZIP download and individual certificate download actions.
6. **Certificate Gallery (`/jobs/:jobId/certificates`)**:
   * Archival document catalog with 50-item pagination and status filters (`ALL`, `GENERATED`, `PENDING`, `FAILED`).
   * Individual certificate cards with `Fraunces` recipient names and status indicators.
7. **3D Certificate Inspector (`/certificates/:certificateId`)**:
   * Museum archival slate mount (`#181715` / `#0c0f16`) with gold coordinate annotations.
   * Authoritative ReportLab PDF bytes rasterized via PDF.js into Three.js curved paper mesh.
   * Zero divergence between downloadable vector PDF and 3D visual preview.
   * WebGL and 2D fallbacks, drag rotation, zoom, and instant reset.

---

## 7. Quality Assurance & Regression Verification Summary

* **Automated Test Suite**: 17/17 test files passed, 129/129 tests passed (`npm test -- --run` exited 0).
* **Linter**: Oxlint passed with 0 warnings, 0 errors across 73 files (`npm run lint` exited 0).
* **Production Build**: `tsc -b && vite build` built successfully in 935ms with zero errors.
* **Backend Source of Truth**: Django REST Framework production backend release `v1.0.0`. Zero backend files modified.
* **Visual QA**: Verified in live Chrome browser across all routes with zero console errors.
