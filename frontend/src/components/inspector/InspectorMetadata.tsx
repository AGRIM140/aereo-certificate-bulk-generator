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
    <div className="bg-[#ffffff] border border-[#e2dac9] rounded-lg p-5 shadow-sm text-[#161a22]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ece5d6]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-mono-telemetry text-[#7d8b9e] font-semibold">
              CERTIFICATE IDENTIFIER
            </span>
            <span className="text-sm font-mono-telemetry font-bold text-[#161a22] bg-[#f5efe4] px-2 py-0.5 rounded border border-[#dcd3c1]">
              {certificate.certificate_number || 'PENDING ASSIGNMENT'}
            </span>
            <Badge status={certificate.status} size="sm" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#161a22] font-serif">
            {certificate.recipient_name}
          </h1>
          <p className="text-xs text-[#647287] font-mono-telemetry">
            RECIPIENT EMAIL: <span className="text-[#161a22] font-semibold">{certificate.recipient_email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:self-start">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBackToArchive}
            className="text-xs font-mono-telemetry"
            aria-label="Return to batch certificate archive"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Archive
          </Button>

          {isGenerated && (
            <Button
              variant="primary"
              size="sm"
              onClick={onDownloadPdf}
              isLoading={isDownloading}
              disabled={isDownloading}
              className="text-xs font-mono-telemetry"
              aria-label={`Download official PDF certificate for ${certificate.recipient_name}`}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Technical Archival Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 text-xs font-mono-telemetry">
        <div>
          <span className="text-[#7d8b9e] block text-[10px] uppercase font-semibold">ROW INDEX</span>
          <span className="text-[#1f304d] font-bold">#{String(certificate.row_number).padStart(2, '0')}</span>
        </div>
        <div>
          <span className="text-[#7d8b9e] block text-[10px] uppercase font-semibold">BATCH UUID</span>
          <span className="text-[#2d3748] font-bold" title={certificate.job_id}>
            {shortenUuid(certificate.job_id)}
          </span>
        </div>
        <div>
          <span className="text-[#7d8b9e] block text-[10px] uppercase font-semibold">GENERATED AT</span>
          <span className="text-[#2d3748]">{formatDateTime(certificate.generated_at)}</span>
        </div>
        <div>
          <span className="text-[#7d8b9e] block text-[10px] uppercase font-semibold">INTEGRITY MODEL</span>
          <span className="text-[#15803d] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#15803d]" />
            ZERO DIVERGENCE
          </span>
        </div>
      </div>
    </div>
  );
};
