import React from 'react';
import { Download, Eye, AlertCircle, Clock, FileCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Certificate } from '../../types/api';

interface CertificateCardProps {
  certificate: Certificate;
  onInspect: (certificate: Certificate) => void;
  onDownload: (certificate: Certificate) => void;
  isDownloading?: boolean;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  onInspect,
  onDownload,
  isDownloading = false,
}) => {
  const isGenerated = certificate.status === 'GENERATED';
  const isPending = certificate.status === 'PENDING';
  const isFailed = certificate.status === 'FAILED';

  const rowFormatted = String(certificate.row_number).padStart(2, '0');

  return (
    <article
      aria-label={`Certificate record ${certificate.certificate_number || rowFormatted} for ${certificate.recipient_name}`}
      className="group relative flex flex-col justify-between rounded-lg border border-[#e2dac9] bg-[#ffffff] p-5 shadow-sm transition-all duration-200 hover:border-[#b8a892] hover:shadow-md text-[#161a22]"
    >
      {/* Top Header: Index & Status */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#ece5d6]">
        <div className="flex items-center gap-1.5 font-mono-telemetry text-xs text-[#7d8b9e]">
          <span className="font-semibold text-[#7d8b9e]">ARCHIVE</span>
          <span className="text-[#c5b9a4]">/</span>
          <span className="text-[#1f304d] font-bold">#{rowFormatted}</span>
        </div>
        <Badge status={certificate.status} size="sm" />
      </div>

      {/* Middle Content: Certificate Number & Recipient */}
      <div className="py-4 space-y-3 flex-1">
        <div>
          <span className="text-[10px] uppercase font-mono-telemetry tracking-wider text-[#7d8b9e] block mb-0.5 font-semibold">
            CERTIFICATE IDENTIFIER
          </span>
          <p
            className={`font-mono-telemetry text-xs font-bold tracking-tight truncate ${
              isGenerated
                ? 'text-[#15803d]'
                : isPending
                  ? 'text-[#b45309] italic'
                  : 'text-[#9ea8b6] line-through'
            }`}
            title={certificate.certificate_number || 'Awaiting generation'}
          >
            {certificate.certificate_number || 'PENDING ASSIGNMENT'}
          </p>
        </div>

        <div>
          <h2
            className="text-base font-bold text-[#161a22] tracking-tight truncate font-serif"
            title={certificate.recipient_name}
          >
            {certificate.recipient_name}
          </h2>
          <p
            className="text-xs text-[#647287] font-mono-telemetry truncate"
            title={certificate.recipient_email}
          >
            {certificate.recipient_email}
          </p>
        </div>

        {/* Status Specific Notes */}
        {isFailed && certificate.error && (
          <div
            className="p-2.5 rounded bg-[#fef2f2] border border-[#fecaca] text-[11px] text-[#b83a34] font-mono-telemetry flex items-start gap-1.5"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5 text-[#b83a34] shrink-0 mt-0.5" />
            <span className="truncate" title={`${certificate.error.type}: ${certificate.error.message}`}>
              {certificate.error.message}
            </span>
          </div>
        )}

        {isPending && (
          <div className="text-[11px] text-[#b45309] font-mono-telemetry flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#b45309]" />
            <span>Awaiting pipeline worker processing</span>
          </div>
        )}

        {isGenerated && (
          <div className="text-[11px] text-[#15803d] font-mono-telemetry flex items-center gap-1.5 font-medium">
            <FileCheck className="w-3.5 h-3.5 text-[#15803d]" />
            <span>Authoritative PDF compiled & stored</span>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="pt-3 border-t border-[#ece5d6] flex items-center gap-2">
        {isGenerated ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onInspect(certificate)}
              className="flex-1 text-xs font-mono-telemetry"
              aria-label={`Inspect certificate for ${certificate.recipient_name}`}
              title="Open Certificate in Inspector (Phase F6)"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Inspect
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDownload(certificate)}
              isLoading={isDownloading}
              disabled={isDownloading}
              className="text-xs font-mono-telemetry px-2.5"
              aria-label={`Download PDF for ${certificate.recipient_name}`}
              title="Download official PDF document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline ml-1">PDF</span>
            </Button>
          </>
        ) : (
          <div className="w-full text-center py-1 text-[11px] font-mono-telemetry text-[#7d8b9e] bg-[#fbf9f4] rounded border border-[#e2dac9] font-medium">
            {isPending ? 'ACTIONS PENDING' : 'DOCUMENT UNAVAILABLE'}
          </div>
        )}
      </div>
    </article>
  );
};
