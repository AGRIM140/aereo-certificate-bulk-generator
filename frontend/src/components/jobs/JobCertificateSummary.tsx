import React, { useState } from 'react';
import { FileText, Download, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { downloadCertificatePdf } from '../../api/certificates';
import type { Certificate } from '../../types/api';

interface JobCertificateSummaryProps {
  certificates: Certificate[];
  jobId: string;
}

const PREVIEW_LIMIT = 10;

export const JobCertificateSummary: React.FC<JobCertificateSummaryProps> = ({
  certificates,
  jobId,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const displayList = certificates.slice(0, PREVIEW_LIMIT);
  const totalCount = certificates.length;

  const handleDownloadSinglePdf = async (cert: Certificate) => {
    if (cert.status !== 'GENERATED') return;
    setDownloadingId(cert.id);
    try {
      const { blob, filename } = await downloadCertificatePdf(cert.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Individual download error handled silently or logged
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="dell-ribbon-card shadow-none">
      {/* Catalog Ribbon Header */}
      <div className="dell-ribbon-bar bg-[#a5b8c0]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-black" />
          <span className="font-ui font-bold text-xs uppercase tracking-wider text-black">
            CERTIFICATE ROSTER MANIFEST ({totalCount} RECORDS)
          </span>
        </div>
        <span className="font-mono text-[10px] text-black">
          {totalCount > PREVIEW_LIMIT ? `SHOWING 1–${PREVIEW_LIMIT} OF ${totalCount}` : `ALL ${totalCount} RECORDS`}
        </span>
      </div>

      <div className="p-0 bg-white">
        {certificates.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-black">
            NO RECIPIENT CERTIFICATE RECORDS FOUND IN THIS BATCH MANIFEST.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dell-table w-full text-left">
              <thead>
                <tr>
                  <th scope="col" className="w-12 text-center">#</th>
                  <th scope="col">RECIPIENT NAME</th>
                  <th scope="col">EMAIL ADDRESS</th>
                  <th scope="col">CERTIFICATE ID</th>
                  <th scope="col">STATUS</th>
                  <th scope="col" className="text-right">DOCUMENT</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[#fbf7ee] transition-colors">
                    <td className="text-center font-mono text-xs text-black">
                      {String(cert.row_number).padStart(2, '0')}
                    </td>
                    <td className="font-body-dell font-bold text-black text-sm">
                      {cert.recipient_name}
                    </td>
                    <td className="font-body-dell text-black text-xs">
                      {cert.recipient_email}
                    </td>
                    <td className="font-mono text-xs font-bold text-black">
                      {cert.certificate_number || '—'}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge status={cert.status} size="sm" />
                        {cert.status === 'FAILED' && cert.error && (
                          <span
                            className="text-[10px] text-[#e91d2a] font-mono flex items-center gap-1 max-w-[200px] truncate"
                            title={`${cert.error.type}: ${cert.error.message}`}
                          >
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {cert.error.message}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right">
                      {cert.status === 'GENERATED' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadSinglePdf(cert)}
                          isLoading={downloadingId === cert.id}
                          disabled={downloadingId === cert.id}
                          className="text-[10px] h-6 px-2"
                          aria-label={`Download PDF for ${cert.recipient_name}`}
                          title="Download individual certificate PDF"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          <span>PDF</span>
                        </Button>
                      ) : (
                        <span className="font-mono text-black text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > PREVIEW_LIMIT && (
          <div className="p-3 bg-[#e8e4c9] border-t-2 border-black flex items-center justify-between text-xs font-mono text-black">
            <span>
              Previewing initial {PREVIEW_LIMIT} of {totalCount} certificates.
            </span>
            <span className="font-bold">
              BATCH ID: {jobId.slice(0, 8)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
