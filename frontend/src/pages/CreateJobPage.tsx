import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Building2, Award, Upload } from 'lucide-react';
import { createJob } from '../api/jobs';
import type { JobRequest, RecipientInput } from '../types/api';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { RecipientRowEditor, type EditableRecipient } from '../components/jobs/RecipientRowEditor';
import { BatchSummaryCard } from '../components/jobs/BatchSummaryCard';
import { FileImportModal } from '../components/jobs/FileImportModal';

function getInitialTodayDate(): string {
  return new Date().toISOString().substring(0, 10);
}

export const CreateJobPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [eventName, setEventName] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(getInitialTodayDate);

  const [recipients, setRecipients] = useState<EditableRecipient[]>([
    { id: '1', name: '', email: '' },
  ]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<Error | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Recipient Roster Handlers
  const handleAddRecipient = () => {
    if (recipients.length >= 500) return;
    const newId = String(Date.now() + Math.random());
    setRecipients((prev) => [...prev, { id: newId, name: '', email: '' }]);
  };

  const handleUpdateRecipient = (id: string, field: 'name' | 'email', value: string) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    // Clear inline error when typing
    if (validationErrors[`recipient-${id}-${field}`]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[`recipient-${id}-${field}`];
        return copy;
      });
    }
  };

  const handleRemoveRecipient = (id: string) => {
    if (recipients.length <= 1) return;
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = () => {
    setRecipients([{ id: String(Date.now()), name: '', email: '' }]);
    setValidationErrors({});
  };

  const handleFileImport = (imported: RecipientInput[], mode: 'replace' | 'append') => {
    const formatted: EditableRecipient[] = imported.map((r, i) => ({
      id: String(Date.now() + i),
      name: r.name,
      email: r.email || '',
    }));

    if (mode === 'replace') {
      setRecipients(formatted.length > 0 ? formatted : [{ id: '1', name: '', email: '' }]);
    } else {
      setRecipients((prev) => {
        const combined = [...prev, ...formatted];
        return combined.slice(0, 500);
      });
    }
  };

  // Client-Side Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!eventName.trim()) {
      errors.eventName = 'Event name is required (1–150 characters).';
    } else if (eventName.trim().length > 150) {
      errors.eventName = 'Event name must not exceed 150 characters.';
    }

    if (!orgName.trim()) {
      errors.orgName = 'Organization name is required (1–100 characters).';
    } else if (orgName.trim().length > 100) {
      errors.orgName = 'Organization name must not exceed 100 characters.';
    }

    if (issueDate && !/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
      errors.issueDate = 'Issue date must be in YYYY-MM-DD format.';
    }

    if (recipients.length === 0) {
      errors.recipients = 'At least 1 recipient is required.';
    } else if (recipients.length > 500) {
      errors.recipients = 'Maximum batch limit is 500 recipients.';
    }

    // Per-recipient client check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    recipients.forEach((r, idx) => {
      const rowNum = idx + 1;
      if (!r.name.trim()) {
        errors[`recipient-${r.id}-name`] = `Row ${rowNum}: Name is required.`;
      }
      if (r.email.trim() && !emailRegex.test(r.email.trim())) {
        errors[`recipient-${r.id}-email`] = `Row ${rowNum}: Enter a valid email address.`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setApiError(null);

    const isValid = validateForm();
    if (!isValid) return;

    setIsSubmitting(true);

    const payload: JobRequest = {
      event_name: eventName.trim(),
      organization_name: orgName.trim(),
      issue_date: issueDate || undefined,
      recipients: recipients.map((r) => ({
        name: r.name.trim(),
        email: r.email.trim() || undefined,
      })),
    };

    try {
      const createdJob = await createJob(payload);
      // HTTP 202 Accepted returned -> Navigate to Job Command Center
      navigate(`/jobs/${createdJob.id}`);
    } catch (err) {
      setIsSubmitting(false);
      setApiError(err instanceof Error ? err : new Error('Failed to dispatch generation job'));
    }
  };

  const isFormValid =
    Boolean(eventName.trim()) &&
    Boolean(orgName.trim()) &&
    recipients.length > 0 &&
    recipients.length <= 500 &&
    recipients.every((r) => Boolean(r.name.trim()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2dac9]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#161a22] uppercase font-serif">
            INITIALIZE CERTIFICATE BATCH
          </h1>
          <p className="text-xs text-[#5a6678] mt-1">
            Configure event credentials and populate the recipient roster for high-volume automated document generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Import CSV / JSON
          </Button>
        </div>
      </div>

      {/* Global API Error */}
      {apiError && (
        <Alert
          variant="error"
          title="Batch Submission Failed"
          error={apiError}
          onDismiss={() => setApiError(null)}
        />
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Batch Credentials & Recipient Roster */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Credentials */}
          <Card>
            <CardHeader>
              <CardTitle>1. BATCH CREDENTIALS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Event Name"
                  requiredMark
                  placeholder="e.g. Full Stack Engineering Workshop 2026"
                  value={eventName}
                  onChange={(e) => {
                    setEventName(e.target.value);
                    if (validationErrors.eventName) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.eventName;
                        return copy;
                      });
                    }
                  }}
                  error={validationErrors.eventName}
                  disabled={isSubmitting}
                  maxLength={150}
                  leftIcon={<Award className="w-4 h-4" />}
                />

                <Input
                  label="Organization Name"
                  requiredMark
                  placeholder="e.g. Antigravity Academy"
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    if (validationErrors.orgName) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.orgName;
                        return copy;
                      });
                    }
                  }}
                  error={validationErrors.orgName}
                  disabled={isSubmitting}
                  maxLength={100}
                  leftIcon={<Building2 className="w-4 h-4" />}
                />
              </div>

              <div className="sm:w-1/2">
                <Input
                  label="Issue Date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => {
                    setIssueDate(e.target.value);
                    if (validationErrors.issueDate) {
                      setValidationErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.issueDate;
                        return copy;
                      });
                    }
                  }}
                  helperText="Defaults to current date if left empty"
                  error={validationErrors.issueDate}
                  disabled={isSubmitting}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Recipient Editor */}
          <Card>
            <CardHeader>
              <CardTitle>2. RECIPIENT ROSTER</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {validationErrors.recipients && (
                <p role="alert" className="text-xs text-rose-400 font-mono-telemetry">
                  ⚠ {validationErrors.recipients}
                </p>
              )}

              <RecipientRowEditor
                recipients={recipients}
                onAddRecipient={handleAddRecipient}
                onUpdateRecipient={handleUpdateRecipient}
                onRemoveRecipient={handleRemoveRecipient}
                onClearAll={handleClearAll}
                disabled={isSubmitting}
                errors={validationErrors}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Reactive Summary & Dispatch CTA */}
        <div className="lg:col-span-4">
          <BatchSummaryCard
            eventName={eventName}
            orgName={orgName}
            issueDate={issueDate}
            recipientCount={recipients.length}
            isValid={isFormValid}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* File Import Modal */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleFileImport}
        currentCount={recipients.length}
      />
    </div>
  );
};
