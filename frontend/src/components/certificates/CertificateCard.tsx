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
      className="group relative flex flex-col justify-between border-2 border-black bg-white shadow-[2px_2px_0px_#000000] text-black transition-none"
    >
      {/* Top Header: Index & Status */}
      <div className="dell-ribbon-bar bg-[#a5b8c0] border-b border-black">
        <div className="flex items-center gap-1.5 font-mono text-xs text-black">
          <span className="font-ui font-bold text-[10px] uppercase">ARCHIVE</span>
          <span>/</span>
          <span className="font-bold">#{rowFormatted}</span>
        </div>
        <Badge status={certificate.status} size="sm" />
      </div>

      {/* Middle Content: Certificate Number & Recipient */}
      <div className="p-4 space-y-3 flex-1 bg-white">
        <div>
          <span className="text-[10px] uppercase font-ui tracking-wider text-neutral-600 block mb-0.5 font-bold">
            CERTIFICATE IDENTIFIER
          </span>
          <p
            className={`font-mono text-xs font-bold tracking-tight truncate ${
              isGenerated
                ? 'text-black'
                : isPending
                  ? 'text-[#8e8a25] italic'
                  : 'text-neutral-400 line-through'
            }`}
            title={certificate.certificate_number || 'Awaiting generation'}
          >
            {certificate.certificate_number || 'PENDING ISSUANCE'}
          </p>
        </div>

        <div>
          <h2
            className="text-base font-bold text-black tracking-tight truncate font-body-dell"
            title={certificate.recipient_name}
          >
            {certificate.recipient_name}
          </h2>
          <p
            className="text-xs text-neutral-600 font-body-dell truncate"
            title={certificate.recipient_email}
          >
            {certificate.recipient_email}
          </p>
        </div>

        {/* Status Specific Notes */}
        {isFailed && certificate.error && (
          <div
            className="p-2 border border-black bg-[#d77a7a]/20 text-[11px] text-[#e91d2a] font-mono flex items-start gap-1.5"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5 text-[#e91d2a] shrink-0 mt-0.5" />
            <span className="truncate" title={`${certificate.error.type}: ${certificate.error.message}`}>
              {certificate.error.message}
            </span>
          </div>
        )}

        {isPending && (
          <div className="text-[11px] text-[#8e8a25] font-mono flex items-center gap-1.5 font-bold">
            <Clock className="w-3.5 h-3.5 text-black" />
            <span>Awaiting pipeline worker processing</span>
          </div>
        )}

        {isGenerated && (
          <div className="text-[11px] text-black font-serif flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-black" />
            <span>Authoritative PDF compiled & stored</span>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="p-3 border-t-2 border-black bg-neutral-50 flex items-center gap-2">
        {isGenerated ? (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onInspect(certificate)}
              className="flex-1 text-xs"
              aria-label={`Inspect certificate for ${certificate.recipient_name}`}
              title="Open Certificate in Inspector"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              INSPECT
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDownload(certificate)}
              isLoading={isDownloading}
              disabled={isDownloading}
              className="text-xs px-2.5"
              aria-label={`Download PDF for ${certificate.recipient_name}`}
              title="Download official PDF document"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline ml-1">PDF</span>
            </Button>
          </>
        ) : (
          <div className="w-full text-center py-1 text-[11px] font-ui font-bold uppercase tracking-wider text-neutral-500 border border-black bg-white">
            {isPending ? 'ACTIONS PENDING' : 'DOCUMENT UNAVAILABLE'}
          </div>
        )}
      </div>
    </article>
  );
};
