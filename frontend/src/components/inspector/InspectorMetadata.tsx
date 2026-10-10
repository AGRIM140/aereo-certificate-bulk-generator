import React from 'react';
import { ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDateTime, shortenUuid } from '../../lib/formatters';
import type { CertificateDetail } from '../../types/api';

interface InspectorMetadataProps {
  certificate: CertificateDetail;
  onBackToArchive: () => void;
  onDownloadPdf: () => void;
  isDownloading?: boolean;
}

export const InspectorMetadata: React.FC<InspectorMetadataProps> = ({
  certificate,
  onBackToArchive,
  onDownloadPdf,
  isDownloading = false,
}) => {
  const isGenerated = certificate.status === 'GENERATED';

  return (
    <div className="border-2 border-black bg-white shadow-[2px_2px_0px_#000000] text-black">
      {/* Ribbon Bar Header */}
      <div className="bg-[#a5b8c0] border-b-2 border-black p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-ui tracking-wider font-bold text-black">
              CERTIFICATE IDENTIFIER
            </span>
            <span className="font-mono text-xs font-bold text-black bg-white px-2 py-0.5 border border-black">
              {certificate.certificate_number || 'PENDING ISSUANCE'}
            </span>
            <Badge status={certificate.status} size="sm" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black uppercase font-ui tracking-wide text-black">
            {certificate.recipient_name}
          </h1>
          <p className="text-xs font-serif text-black leading-tight">
            RECIPIENT EMAIL: <span className="font-bold">{certificate.recipient_email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:self-start">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackToArchive}
            className="text-xs"
            aria-label="Return to batch certificate archive"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            ARCHIVE
          </Button>

          {isGenerated && (
            <Button
              variant="primary"
              size="sm"
              onClick={onDownloadPdf}
              isLoading={isDownloading}
              disabled={isDownloading}
              className="text-xs bg-[#e91d2a] hover:bg-[#b8141e] text-white border-2 border-black font-ui uppercase font-bold"
              aria-label={`Download official PDF certificate for ${certificate.recipient_name}`}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              DOWNLOAD PDF
            </Button>
          )}
        </div>
      </div>

      {/* Technical Archival Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#fbf9f4] border-t border-black text-xs font-mono">
        <div className="p-2 border border-black bg-white">
          <span className="text-neutral-600 block text-[10px] uppercase font-ui font-bold">ROW INDEX</span>
          <span className="text-black font-bold">#{String(certificate.row_number).padStart(2, '0')}</span>
        </div>
        <div className="p-2 border border-black bg-white">
          <span className="text-neutral-600 block text-[10px] uppercase font-ui font-bold">BATCH UUID</span>
          <span className="text-black font-bold" title={certificate.job_id}>
            {shortenUuid(certificate.job_id)}
          </span>
        </div>
        <div className="p-2 border border-black bg-white">
          <span className="text-neutral-600 block text-[10px] uppercase font-ui font-bold">GENERATED AT</span>
          <span className="text-black">{formatDateTime(certificate.generated_at)}</span>
        </div>
        <div className="p-2 border border-black bg-[#c0d4a7]/40">
          <span className="text-black block text-[10px] uppercase font-ui font-bold">INTEGRITY MODEL</span>
          <span className="text-black font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            ZERO DIVERGENCE
          </span>
        </div>
      </div>
    </div>
  );
};
