import React, { useState } from 'react';
import { FileText, Download, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
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
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b border-[#ece5d6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#15803d]" />
            <CardTitle className="text-sm font-mono-telemetry uppercase tracking-wider text-[#161a22]">
              Certificate Roster Manifest ({totalCount})
            </CardTitle>
          </div>
          <span className="text-xs font-mono-telemetry text-[#7d8b9e]">
            {totalCount > PREVIEW_LIMIT ? `Showing 1–${PREVIEW_LIMIT} of ${totalCount}` : `All ${totalCount} records`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 p-0">
        {certificates.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono-telemetry text-[#7d8b9e]">
            No recipient certificate records found in this batch manifest.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-telemetry">
              <thead>
                <tr className="border-b border-[#e2dac9] bg-[#fbf9f4] text-[#556377] text-[11px] uppercase">
                  <th scope="col" className="py-2.5 px-4 w-12 text-[#7d8b9e]">#</th>
                  <th scope="col" className="py-2.5 px-4">Recipient Name</th>
                  <th scope="col" className="py-2.5 px-4">Email</th>
                  <th scope="col" className="py-2.5 px-4">Certificate ID</th>
                  <th scope="col" className="py-2.5 px-4">Status</th>
                  <th scope="col" className="py-2.5 px-4 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece5d6] bg-[#ffffff]">
                {displayList.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[#fbf7ee] transition-colors">
                    <td className="py-2.5 px-4 text-[#7d8b9e] font-mono-telemetry">
                      {String(cert.row_number).padStart(2, '0')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#161a22]">
                      {cert.recipient_name}
                    </td>
                    <td className="py-2.5 px-4 text-[#556377]">
                      {cert.recipient_email}
                    </td>
                    <td className="py-2.5 px-4 text-[#2d3748] font-mono-telemetry font-medium">
                      {cert.certificate_number || '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge status={cert.status} size="sm" />
                        {cert.status === 'FAILED' && cert.error && (
                          <span
                            className="text-[10px] text-[#b83a34] flex items-center gap-1 max-w-[200px] truncate"
                            title={`${cert.error.type}: ${cert.error.message}`}
                          >
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {cert.error.message}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {cert.status === 'GENERATED' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadSinglePdf(cert)}
                          isLoading={downloadingId === cert.id}
                          disabled={downloadingId === cert.id}
                          className="text-[11px] h-7 px-2"
                          aria-label={`Download PDF for ${cert.recipient_name}`}
                          title="Download individual certificate PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline ml-1">PDF</span>
                        </Button>
                      ) : (
                        <span className="text-[#9ea8b6] text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCount > PREVIEW_LIMIT && (
          <div className="p-3 bg-[#fbf9f4] border-t border-[#e2dac9] flex items-center justify-between text-xs font-mono-telemetry text-[#647287]">
            <span>
              Previewing initial {PREVIEW_LIMIT} of {totalCount} certificates.
            </span>
            <span className="text-[#7d8b9e] text-[11px]">
              Full certificate gallery for job {jobId.slice(0, 8)} available in Phase F5
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
