import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CertificateInspectorPage } from '../pages/CertificateInspectorPage';
import * as certificatesApi from '../api/certificates';
import * as pdfLib from '../lib/pdf/renderCertificatePdf';
import * as threeLib from '../lib/three/createCertificateScene';
import type { CertificateDetail } from '../types/api';

const mockCertDetail: CertificateDetail = {
  id: 'c1111111-1111-1111-1111-111111111111',
  job_id: '587e4f8e-6b80-4438-b6a6-69ff421c364b',
  row_number: 1,
  certificate_number: 'CERT-2026-466DBC643C27',
  recipient_name: 'Dr. Elena Rostova',
  recipient_email: 'elena.rostova@quantum.org',
  status: 'GENERATED',
  generated_at: '2026-10-09T00:00:03Z',
  error: null,
  download_url: '/api/certificates/c1111111-1111-1111-1111-111111111111/download/',
};

const mockPendingCert: CertificateDetail = {
  ...mockCertDetail,
  id: 'c2222222-2222-2222-2222-222222222222',
  status: 'PENDING',
  certificate_number: null,
};

const mockFailedCert: CertificateDetail = {
  ...mockCertDetail,
  id: 'c3333333-3333-3333-3333-333333333333',
  status: 'FAILED',
  error: {
    type: 'GENERATION',
    message: 'ReportLab canvas syntax error in custom font metric',
  },
};

function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 848;
  return canvas;
}

function renderInspector(certId = 'c1111111-1111-1111-1111-111111111111') {
  return render(
    <MemoryRouter initialEntries={[`/certificates/${certId}`]}>
      <Routes>
        <Route path="/certificates/:certificateId" element={<CertificateInspectorPage />} />
        <Route path="/jobs/:jobId/certificates" element={<div>CERTIFICATE ARCHIVE PAGE</div>} />
        <Route path="/jobs" element={<div>JOB LEDGER PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CertificateInspectorPage Integration (Zero-Divergence)', () => {
  let mockPdfBlob: Blob;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockPdfBlob = new Blob(['%PDF-1.4 mock pdf binary'], { type: 'application/pdf' });

    // Mock matchMedia for jsdom
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

  it('1. Inspector route renders and displays loading pipeline telemetry', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockImplementation(
      () => new Promise(() => {}) // never resolves to keep in loading
    );

    renderInspector();

    expect(screen.getByText(/LOADING CERTIFICATE METADATA/i)).toBeInTheDocument();
    expect(screen.getByText(/Querying authoritative ledger/i)).toBeInTheDocument();
  });

  it('2. Certificate metadata loads authoritative details', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockCertDetail);
    vi.spyOn(certificatesApi, 'downloadCertificatePdf').mockResolvedValue({
      blob: mockPdfBlob,
      filename: 'CERT-2026-466DBC643C27.pdf',
    });
    vi.spyOn(pdfLib, 'renderCertificatePdfPage').mockResolvedValue({
      canvas: createMockCanvas(),
      width: 1200,
      height: 848,
      aspectRatio: 1.415,
    });
    vi.spyOn(threeLib, 'isWebGLAvailable').mockReturnValue(false); // test with 2D fallback

    renderInspector();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Dr. Elena Rostova' })).toBeInTheDocument();
    });

    expect(screen.getByText('CERT-2026-466DBC643C27')).toBeInTheDocument();
    expect(screen.getByText(/elena\.rostova@quantum\.org/i)).toBeInTheDocument();
    expect(screen.getByText('ZERO DIVERGENCE')).toBeInTheDocument();
  });

  it('3. GENERATED certificate initializes inspection pipeline (fetches PDF and rasterizes via PDF.js)', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockCertDetail);
    const pdfFetchSpy = vi.spyOn(certificatesApi, 'downloadCertificatePdf').mockResolvedValue({
      blob: mockPdfBlob,
      filename: 'CERT-2026-466DBC643C27.pdf',
    });
    const rasterSpy = vi.spyOn(pdfLib, 'renderCertificatePdfPage').mockResolvedValue({
      canvas: createMockCanvas(),
      width: 1200,
      height: 848,
      aspectRatio: 1.415,
    });
    vi.spyOn(threeLib, 'isWebGLAvailable').mockReturnValue(false);

    renderInspector();

    await waitFor(() => {
      expect(pdfFetchSpy).toHaveBeenCalledWith('c1111111-1111-1111-1111-111111111111');
      expect(rasterSpy).toHaveBeenCalled();
    });
  });

  it('4. PENDING certificate does NOT initialize Three.js or download PDF', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockPendingCert);
    const pdfFetchSpy = vi.spyOn(certificatesApi, 'downloadCertificatePdf');
    const rasterSpy = vi.spyOn(pdfLib, 'renderCertificatePdfPage');

    renderInspector('c2222222-2222-2222-2222-222222222222');

    await waitFor(() => {
      expect(screen.getByText('CERTIFICATE NOT READY')).toBeInTheDocument();
    });

    expect(pdfFetchSpy).not.toHaveBeenCalled();
    expect(rasterSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Return to Gallery/i })).toBeInTheDocument();
  });

  it('5. FAILED certificate does NOT initialize Three.js and shows backend failure reason', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockFailedCert);
    const pdfFetchSpy = vi.spyOn(certificatesApi, 'downloadCertificatePdf');
    const rasterSpy = vi.spyOn(pdfLib, 'renderCertificatePdfPage');

    renderInspector('c3333333-3333-3333-3333-333333333333');

    await waitFor(() => {
      expect(screen.getByText('CERTIFICATE GENERATION FAILED')).toBeInTheDocument();
    });

    expect(screen.getByText(/ReportLab canvas syntax error/i)).toBeInTheDocument();
    expect(pdfFetchSpy).not.toHaveBeenCalled();
    expect(rasterSpy).not.toHaveBeenCalled();
  });

  it('6. WebGL fallback works seamlessly when WebGL is unavailable (Zero-Divergence 2D mode)', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockCertDetail);
    vi.spyOn(certificatesApi, 'downloadCertificatePdf').mockResolvedValue({
      blob: mockPdfBlob,
      filename: 'CERT-2026-466DBC643C27.pdf',
    });
    vi.spyOn(pdfLib, 'renderCertificatePdfPage').mockResolvedValue({
      canvas: createMockCanvas(),
      width: 1200,
      height: 848,
      aspectRatio: 1.415,
    });
    vi.spyOn(threeLib, 'isWebGLAvailable').mockReturnValue(false);

    renderInspector();

    await waitFor(() => {
      expect(screen.getByText(/2D ARCHIVAL FALLBACK MODE \(WEBGL UNAVAILABLE\)/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Rendering authoritative PDF raster directly/i)).toBeInTheDocument();
  });

  it('7. Handles PDF rasterization failure with CERTIFICATE PREVIEW UNAVAILABLE and provides download', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockCertDetail);
    vi.spyOn(certificatesApi, 'downloadCertificatePdf').mockResolvedValue({
      blob: mockPdfBlob,
      filename: 'CERT-2026-466DBC643C27.pdf',
    });
    vi.spyOn(pdfLib, 'renderCertificatePdfPage').mockRejectedValue(
      new Error('PDF.js worker initialization timeout')
    );

    renderInspector();

    await waitFor(() => {
      expect(screen.getByText('CERTIFICATE PREVIEW UNAVAILABLE')).toBeInTheDocument();
    });

    expect(screen.getByText(/PDF\.js worker initialization timeout/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
  });

  it('8. Allows downloading authoritative backend PDF and displays confirmation', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockCertDetail);
    vi.spyOn(certificatesApi, 'downloadCertificatePdf').mockResolvedValue({
      blob: mockPdfBlob,
      filename: 'CERT-2026-466DBC643C27.pdf',
    });
    vi.spyOn(pdfLib, 'renderCertificatePdfPage').mockResolvedValue({
      canvas: createMockCanvas(),
      width: 1200,
      height: 848,
      aspectRatio: 1.415,
    });
    vi.spyOn(threeLib, 'isWebGLAvailable').mockReturnValue(false);

    const downloadSpy = vi
      .spyOn(certificatesApi, 'downloadAndSaveCertificatePdf')
      .mockResolvedValue('CERT-2026-466DBC643C27.pdf');

    renderInspector();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Dr. Elena Rostova' })).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Download official PDF certificate/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('c1111111-1111-1111-1111-111111111111');
    });

    expect(await screen.findByText(/Downloaded: CERT-2026-466DBC643C27\.pdf/i)).toBeInTheDocument();
  });

  it('9. Handles download 404 and 409 error responses gracefully', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockCertDetail);
    vi.spyOn(certificatesApi, 'downloadCertificatePdf').mockResolvedValue({
      blob: mockPdfBlob,
      filename: 'CERT-2026-466DBC643C27.pdf',
    });
    vi.spyOn(pdfLib, 'renderCertificatePdfPage').mockResolvedValue({
      canvas: createMockCanvas(),
      width: 1200,
      height: 848,
      aspectRatio: 1.415,
    });
    vi.spyOn(threeLib, 'isWebGLAvailable').mockReturnValue(false);

    vi.spyOn(certificatesApi, 'downloadAndSaveCertificatePdf').mockRejectedValue(
      new Error('Download failed with HTTP 404')
    );

    renderInspector();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Dr. Elena Rostova' })).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole('button', { name: /Download official PDF certificate/i });
    fireEvent.click(downloadBtn);

    expect(
      await screen.findByText(/Authoritative certificate PDF was not found on the server \(404 Not Found\)/i)
    ).toBeInTheDocument();
  });

  it('10. Renders RECORD NOT ACCESSIBLE if certificate ID is invalid or not found', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockRejectedValue(
      new Error('Certificate record not found')
    );

    renderInspector('invalid-uuid');

    await waitFor(() => {
      expect(screen.getByText('RECORD NOT ACCESSIBLE')).toBeInTheDocument();
    });

    expect(screen.getByText(/Certificate record not found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Ledger/i })).toBeInTheDocument();
  });

  it('11. Navigates back to certificate archive when clicking Archive button', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockCertDetail);
    vi.spyOn(certificatesApi, 'downloadCertificatePdf').mockResolvedValue({
      blob: mockPdfBlob,
      filename: 'CERT-2026-466DBC643C27.pdf',
    });
    vi.spyOn(pdfLib, 'renderCertificatePdfPage').mockResolvedValue({
      canvas: createMockCanvas(),
      width: 1200,
      height: 848,
      aspectRatio: 1.415,
    });
    vi.spyOn(threeLib, 'isWebGLAvailable').mockReturnValue(false);

    renderInspector();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Return to batch certificate archive/i })).toBeInTheDocument();
    });

    const archiveBtn = screen.getByRole('button', { name: /Return to batch certificate archive/i });
    fireEvent.click(archiveBtn);

    await waitFor(() => {
      expect(screen.getByText('CERTIFICATE ARCHIVE PAGE')).toBeInTheDocument();
    });
  });

  it('12. In 2D fallback mode, zoom controls and reset operate smoothly', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockCertDetail);
    vi.spyOn(certificatesApi, 'downloadCertificatePdf').mockResolvedValue({
      blob: mockPdfBlob,
      filename: 'CERT-2026-466DBC643C27.pdf',
    });
    vi.spyOn(pdfLib, 'renderCertificatePdfPage').mockResolvedValue({
      canvas: createMockCanvas(),
      width: 1200,
      height: 848,
      aspectRatio: 1.415,
    });
    vi.spyOn(threeLib, 'isWebGLAvailable').mockReturnValue(false);

    renderInspector();

    await waitFor(() => {
      expect(screen.getByLabelText(/Zoom in on 2D certificate/i)).toBeInTheDocument();
    });

    const zoomInBtn = screen.getByLabelText(/Zoom in on 2D certificate/i);
    const zoomOutBtn = screen.getByLabelText(/Zoom out from 2D certificate/i);
    const resetBtn = screen.getByLabelText(/Reset 2D canvas zoom and pan/i);

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    fireEvent.click(resetBtn);

    expect(resetBtn).toBeInTheDocument();
  });

  it('13. Initializes 3D scene when WebGL is available, controls operate, and disposes on unmount', async () => {
    vi.spyOn(certificatesApi, 'getCertificateDetail').mockResolvedValue(mockCertDetail);
    vi.spyOn(certificatesApi, 'downloadCertificatePdf').mockResolvedValue({
      blob: mockPdfBlob,
      filename: 'CERT-2026-466DBC643C27.pdf',
    });
    vi.spyOn(pdfLib, 'renderCertificatePdfPage').mockResolvedValue({
      canvas: createMockCanvas(),
      width: 1200,
      height: 848,
      aspectRatio: 1.415,
    });
    vi.spyOn(threeLib, 'isWebGLAvailable').mockReturnValue(true);

    const mockDispose = vi.fn();
    const mockController: threeLib.CertificateSceneController = {
      rotateLeft: vi.fn(),
      rotateRight: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      resetView: vi.fn(),
      setReducedMotion: vi.fn(),
      dispose: mockDispose,
    };

    const sceneSpy = vi
      .spyOn(threeLib, 'createCertificateScene')
      .mockReturnValue(mockController);

    const { unmount } = renderInspector();

    await waitFor(() => {
      expect(sceneSpy).toHaveBeenCalled();
      expect(screen.getByTestId('certificate-3d-stage')).toBeInTheDocument();
    });

    // Test controller buttons in 3D HUD
    const rotateLeftBtn = screen.getByLabelText(/Rotate certificate counter-clockwise/i);
    fireEvent.click(rotateLeftBtn);
    expect(mockController.rotateLeft).toHaveBeenCalled();

    const rotateRightBtn = screen.getByLabelText(/Rotate certificate clockwise/i);
    fireEvent.click(rotateRightBtn);
    expect(mockController.rotateRight).toHaveBeenCalled();

    const zoomInBtn = screen.getByLabelText(/Zoom in on certificate/i);
    fireEvent.click(zoomInBtn);
    expect(mockController.zoomIn).toHaveBeenCalled();

    const zoomOutBtn = screen.getByLabelText(/Zoom out from certificate/i);
    fireEvent.click(zoomOutBtn);
    expect(mockController.zoomOut).toHaveBeenCalled();

    const resetBtn = screen.getByLabelText(/Reset camera and rotation orientation/i);
    fireEvent.click(resetBtn);
    expect(mockController.resetView).toHaveBeenCalled();

    // Verify unmount triggers scene disposal
    unmount();
    expect(mockDispose).toHaveBeenCalled();
  });
});
