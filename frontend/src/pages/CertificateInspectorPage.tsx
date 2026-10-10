import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  XCircle,
  FileWarning,
  Download,
} from 'lucide-react';
import { getCertificateDetail, downloadAndSaveCertificatePdf } from '../api/certificates';
import { downloadCertificatePdf } from '../api/certificates';
import { renderCertificatePdfPage, type RenderedPdfPage } from '../lib/pdf/renderCertificatePdf';
import { isWebGLAvailable } from '../lib/three/createCertificateScene';
import { Certificate3DScene } from '../components/inspector/Certificate3DScene';
import { InspectorFallback } from '../components/inspector/InspectorFallback';
import { InspectorMetadata } from '../components/inspector/InspectorMetadata';
import { InspectorLoading, type InspectorLoadingStage } from '../components/inspector/InspectorLoading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import type { CertificateDetail } from '../types/api';

export const CertificateInspectorPage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();

  const [certificate, setCertificate] = useState<CertificateDetail | null>(null);
  const [loadingStage, setLoadingStage] = useState<InspectorLoadingStage | null>(() =>
    certificateId ? 'loading_metadata' : null
  );
  const [metadataError, setMetadataError] = useState<string | null>(() =>
    certificateId ? null : 'No certificate identifier provided.'
  );
  const [pdfPage, setPdfPage] = useState<RenderedPdfPage | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<boolean>(false);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!certificateId) return;

    const initInspectorPipeline = async () => {
      setLoadingStage('loading_metadata');
      setMetadataError(null);
      setPdfError(null);
      setWebglError(false);

      let cert: CertificateDetail | null = null;
      try {
        // Step 1: Query authoritative metadata
        cert = await getCertificateDetail(certificateId);
        if (!isMounted) return;
        setCertificate(cert);

        // Step 2: Handle non-GENERATED states (No 3D / PDF pipeline)
        if (cert.status !== 'GENERATED') {
          setLoadingStage(null);
          return;
        }

        // Step 3: Fetch authoritative PDF bytes
        setLoadingStage('fetching_pdf');
        const { blob } = await downloadCertificatePdf(cert.id);
        if (!isMounted) return;

        const arrayBuffer = await blob.arrayBuffer();
        if (!isMounted) return;

        // Step 4: Rasterize Page 1 with PDF.js
        setLoadingStage('rasterizing');
        const rendered = await renderCertificatePdfPage(arrayBuffer);
        if (!isMounted) return;
        setPdfPage(rendered);

        // Step 5: Initialize 3D Physical Surface
        setLoadingStage('building_scene');
        if (!isWebGLAvailable()) {
          setWebglError(true);
        }

        if (isMounted) {
          setLoadingStage(null);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setLoadingStage(null);

        const errorMessage =
          err instanceof Error ? err.message : 'Unknown pipeline error occurred.';

        // If we don't have certificate metadata yet, it is a metadata retrieval failure
        if (!cert) {
          setMetadataError(errorMessage);
        } else {
          // If we had metadata but failed downloading or rasterizing the PDF
          setPdfError(errorMessage);
        }
      }
    };

    initInspectorPipeline();

    return () => {
      isMounted = false;
    };
  }, [certificateId]);

  const handleDownload = async () => {
    if (!certificate || certificate.status !== 'GENERATED') return;
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(null);

    try {
      const filename = await downloadAndSaveCertificatePdf(certificate.id);
      setDownloadSuccess(`Downloaded: ${filename}`);
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown network failure';
      if (message.includes('404')) {
        setDownloadError('Authoritative certificate PDF was not found on the server (404 Not Found).');
      } else if (message.includes('409')) {
        setDownloadError('Certificate document is not ready or generation conflict occurred (409 Conflict).');
      } else {
        setDownloadError(`Failed to download certificate PDF document: ${message}`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBackToGallery = () => {
    if (certificate?.job_id) {
      navigate(`/jobs/${certificate.job_id}/certificates`);
    } else {
      navigate('/jobs');
    }
  };

  // 1. Loading Pipeline State
  if (loadingStage) {
    return (
      <InspectorLoading
        stage={loadingStage}
        certificateId={certificate?.certificate_number || certificateId}
      />
    );
  }

  // 2. Metadata Error State
  if (metadataError || !certificate) {
    return (
      <div className="space-y-6">
        <div className="border-2 border-black bg-[#d77a7a] p-3 shadow-[2px_2px_0px_#000000]">
          <h1 className="text-lg sm:text-xl font-black uppercase font-ui tracking-wide text-black">
            CERTIFICATE INSPECTOR — ERROR
          </h1>
          <p className="font-mono text-xs text-black mt-0.5 font-bold">
            IDENTIFIER: {certificateId}
          </p>
        </div>

        <div className="bg-white border-2 border-black p-8 space-y-4 shadow-[2px_2px_0px_#000000] text-black">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#e91d2a] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-black uppercase font-ui tracking-wide">
                RECORD NOT ACCESSIBLE
              </h2>
              <p className="text-xs font-serif text-black">
                {metadataError || `No certificate record found with identifier "${certificateId}".`}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/jobs')}
            className="text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            RETURN TO LEDGER
          </Button>
        </div>
      </div>
    );
  }

  // 3. Status PENDING State (No 3D initialization)
  if (certificate.status === 'PENDING') {
    return (
      <div className="space-y-6">
        <InspectorMetadata
          certificate={certificate}
          onBackToArchive={handleBackToGallery}
          onDownloadPdf={handleDownload}
          isDownloading={isDownloading}
        />

        <div className="bg-white border-2 border-black p-8 text-center space-y-4 shadow-[2px_2px_0px_#000000] text-black">
          <div className="flex justify-center">
            <Clock className="w-10 h-10 text-black animate-pulse" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge status="PENDING" size="md" />
            </div>
            <h2 className="text-base font-bold text-black font-ui uppercase tracking-wide">
              CERTIFICATE NOT READY
            </h2>
            <p className="text-xs text-black leading-relaxed font-serif">
              The PDF document has not yet been compiled by the backend worker.
              Inspection will become available as soon as generation completes in the batch queue.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackToGallery}
              className="text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              RETURN TO GALLERY
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Status FAILED State (No 3D initialization)
  if (certificate.status === 'FAILED') {
    return (
      <div className="space-y-6">
        <InspectorMetadata
          certificate={certificate}
          onBackToArchive={handleBackToGallery}
          onDownloadPdf={handleDownload}
          isDownloading={isDownloading}
        />

        <div className="bg-white border-2 border-black p-8 text-center space-y-4 shadow-[2px_2px_0px_#000000] text-black">
          <div className="flex justify-center">
            <XCircle className="w-10 h-10 text-[#e91d2a]" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge status="FAILED" size="md" />
            </div>
            <h2 className="text-base font-bold text-black font-ui uppercase tracking-wide">
              CERTIFICATE GENERATION FAILED
            </h2>
            <p className="text-xs text-[#e91d2a] leading-relaxed font-mono font-medium">
              {typeof certificate.error === 'string'
                ? certificate.error
                : certificate.error?.message ||
                  'The backend PDF compiler reported an error generating this document.'}
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackToGallery}
              className="text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              RETURN TO GALLERY
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 5. PDF Rasterization Failure State
  if (pdfError || !pdfPage) {
    return (
      <div className="space-y-6">
        <InspectorMetadata
          certificate={certificate}
          onBackToArchive={handleBackToGallery}
          onDownloadPdf={handleDownload}
          isDownloading={isDownloading}
        />

        <div className="bg-[#ffffff] border border-[#fde68a] rounded-lg p-8 text-center space-y-4 shadow-sm text-[#161a22]">
          <div className="flex justify-center">
            <FileWarning className="w-10 h-10 text-[#b45309]" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base font-bold text-[#161a22] font-mono-telemetry">
              CERTIFICATE PREVIEW UNAVAILABLE
            </h2>
            <p className="text-xs text-[#556377] leading-relaxed font-mono-telemetry">
              The authoritative PDF could not be rasterized in the current environment: {pdfError}
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              isLoading={isDownloading}
              disabled={isDownloading}
              className="text-xs font-mono-telemetry"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackToGallery}
              className="text-xs font-mono-telemetry"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Return to Gallery
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 6. GENERATED Ready State — Inspection Stage
  return (
    <div className="space-y-6">
      {/* Top Metadata Header */}
      <InspectorMetadata
        certificate={certificate}
        onBackToArchive={handleBackToGallery}
        onDownloadPdf={handleDownload}
        isDownloading={isDownloading}
      />

      {/* Action Feedback Alerts */}
      {downloadSuccess && (
        <Alert variant="success" title="Download Completed" onClose={() => setDownloadSuccess(null)}>
          {downloadSuccess}
        </Alert>
      )}

      {downloadError && (
        <Alert variant="error" title="Download Error" onClose={() => setDownloadError(null)}>
          {downloadError}
        </Alert>
      )}

      {/* Main Inspection Stage: 3D Scene or 2D Zero-Divergence Fallback */}
      <div className="space-y-3">
        {!webglError ? (
          <Certificate3DScene
            canvas={pdfPage.canvas}
            aspectRatio={pdfPage.aspectRatio}
            onError={() => setWebglError(true)}
          />
        ) : (
          <InspectorFallback
            canvas={pdfPage.canvas}
            aspectRatio={pdfPage.aspectRatio}
          />
        )}
      </div>
    </div>
  );
};

export default CertificateInspectorPage;
