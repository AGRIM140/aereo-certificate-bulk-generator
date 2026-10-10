import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import * as threeLandingLib from '../lib/three/createLandingScene';

describe('Interactive 3D Landing Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('1. Renders the editorial hero headline, narrative, and supporting descriptions', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /HIGH-VOLUME ARCHIVAL CERTIFICATE GENERATION/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/ARCHIVE → PAPER → DATA → CERTIFICATE/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Transform structured recipient datasets into high-fidelity, verified/i)
    ).toBeInTheDocument();
  });

  it('2. Navigates to /jobs/new when clicking the primary hero CTA', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/jobs/new" element={<div>INITIALIZE BATCH PAGE</div>} />
        </Routes>
      </MemoryRouter>
    );

    const ctaButton = screen.getByRole('button', { name: /Initialize Certificate Batch/i });
    fireEvent.click(ctaButton);

    await waitFor(() => {
      expect(screen.getByText('INITIALIZE BATCH PAGE')).toBeInTheDocument();
    });
  });

  it('3. Navigates to /jobs when clicking the secondary hero CTA', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/jobs" element={<div>HISTORICAL JOB LEDGER PAGE</div>} />
        </Routes>
      </MemoryRouter>
    );

    const ledgerButton = screen.getByRole('button', { name: /View Job Ledger/i });
    fireEvent.click(ledgerButton);

    await waitFor(() => {
      expect(screen.getByText('HISTORICAL JOB LEDGER PAGE')).toBeInTheDocument();
    });
  });

  it('4. Renders the 4-stage architectural workflow with accurate specifications', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('PREPARE RECIPIENT DATA')).toBeInTheDocument();

    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('SUBMIT BATCH JOB')).toBeInTheDocument();

    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('TRACK REAL-TIME PROGRESS')).toBeInTheDocument();

    expect(screen.getByText('04')).toBeInTheDocument();
    expect(screen.getByText('INSPECT & EXPORT ARCHIVE')).toBeInTheDocument();
  });

  it('5. Renders technical core capabilities and architectural guarantees in specs grid', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/FAILURE ISOLATION \(FR-006\)/i)).toBeInTheDocument();
    expect(screen.getByText(/REPORTLAB COMPILER \(FR-005\)/i)).toBeInTheDocument();
    expect(screen.getByText(/POSTGRESQL \+ CELERY \(FR-019\)/i)).toBeInTheDocument();
    expect(screen.getByText(/DETERMINISTIC IDS \(FR-021\)/i)).toBeInTheDocument();
    expect(screen.getByText(/BULK ZIP EXPORT \(FR-016\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ZERO DIVERGENCE \(PRODUCTION\)/i)).toBeInTheDocument();
  });

  it('6. Renders the telemetry footer with production release and infrastructure details', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/RELEASE v1\.0\.0 \(STABLE\)/i)).toBeInTheDocument();
    expect(screen.getByText(/PIPELINE: REPORTLAB \+ CELERY/i)).toBeInTheDocument();
    expect(screen.getByText(/STORAGE: POSTGRESQL \+ LOCAL MEDIA/i)).toBeInTheDocument();
  });

  it('7. Renders 2D fallback when WebGL is unavailable', () => {
    vi.spyOn(threeLandingLib, 'isWebGLAvailable').mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('landing-2d-fallback')).toBeInTheDocument();
    expect(screen.getByText('2D FALLBACK')).toBeInTheDocument();
    expect(screen.getByText('Dr. Elena Rostova')).toBeInTheDocument();
  });

  it('8. Initializes 3D scene when WebGL is available and cleans up on unmount', () => {
    vi.spyOn(threeLandingLib, 'isWebGLAvailable').mockReturnValue(true);

    const mockDispose = vi.fn();
    const mockController: threeLandingLib.LandingSceneController = {
      setReducedMotion: vi.fn(),
      dispose: mockDispose,
    };

    const createSpy = vi
      .spyOn(threeLandingLib, 'createLandingScene')
      .mockReturnValue(mockController);

    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    expect(createSpy).toHaveBeenCalled();
    expect(screen.getByTestId('landing-3d-stage')).toBeInTheDocument();

    unmount();
    expect(mockDispose).toHaveBeenCalled();
  });

  it('9. Mobile navigation toggle reveals mobile drawer links and navigates', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<div>DASHBOARD CONSOLE</div>} />
        </Routes>
      </MemoryRouter>
    );

    const toggleButton = screen.getByRole('button', { name: /Toggle navigation menu/i });
    fireEvent.click(toggleButton);

    const consoleLinks = screen.getAllByRole('link', { name: /Operational Console/i });
    expect(consoleLinks.length).toBeGreaterThan(0);

    fireEvent.click(consoleLinks[1]); // Mobile drawer link

    await waitFor(() => {
      expect(screen.getByText('DASHBOARD CONSOLE')).toBeInTheDocument();
    });
  });
});
