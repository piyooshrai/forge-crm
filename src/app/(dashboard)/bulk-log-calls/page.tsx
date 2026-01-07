'use client';

import { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Button, useToast } from '@/components/ui';

interface ValidCall {
  rowNumber: number;
  dealLeadName: string;
  matchedName: string;
  matchType: 'deal' | 'lead';
  contactName: string;
  callDate: string;
  callTime: string;
  duration: number | null;
  outcome: string | null;
}

interface InvalidCall {
  rowNumber: number;
  dealLeadName: string;
  error: string;
}

interface PreviewData {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  validCalls: ValidCall[];
  invalidCalls: InvalidCall[];
}

interface ImportResult {
  success: boolean;
  imported: number;
  leadsUpdated: number;
  skipped: number;
}

function BulkLogCallsContent() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        showToast('Please select a CSV file', 'error');
        return;
      }
      setFile(selectedFile);
      setPreview(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', 'preview');

      const res = await fetch('/api/activities/bulk', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse CSV');
      }

      setPreview(data);
    } catch (error: any) {
      showToast(error.message || 'Failed to upload file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', 'import');

      const res = await fetch('/api/activities/bulk', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import calls');
      }

      setResult(data);
      setPreview(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to import calls', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
        <GlassCard variant="primary" className="p-8 text-center">
          <div className="text-5xl mb-4">&#x2705;</div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {result.imported} call{result.imported !== 1 ? 's' : ''} imported successfully
          </h2>
          {result.leadsUpdated > 0 && (
            <p className="text-cyan-400 mb-2">
              {result.leadsUpdated} lead status{result.leadsUpdated !== 1 ? 'es' : ''} updated
            </p>
          )}
          {result.skipped > 0 && (
            <p className="text-yellow-400 mb-2">{result.skipped} row{result.skipped !== 1 ? 's' : ''} skipped due to errors</p>
          )}
          <p className="text-white/60 mb-6">Your call activities have been logged.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleReset}>Import More Calls</Button>
            <Link href="/leads">
              <Button variant="secondary">View Leads</Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <SectionHeader title="Bulk Log Calls" subtitle="Import call activities from CSV" />
      </div>

      {/* Step 1: Download Template */}
      <GlassCard className="mb-6 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-semibold">
            1
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium mb-2">Download Template</h3>
            <p className="text-white/60 text-sm mb-4">
              Get the CSV template, fill it out in Excel or Google Sheets with your call data.
            </p>
            <a href="/api/activities/bulk/template" download>
              <Button variant="secondary">Download CSV Template</Button>
            </a>
          </div>
        </div>
      </GlassCard>

      {/* Step 2: Upload CSV */}
      <GlassCard className="mb-6 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-semibold">
            2
          </div>
          <div className="flex-1">
            <h3 className="text-white font-medium mb-2">Upload Your CSV</h3>
            <p className="text-white/60 text-sm mb-4">
              Upload your completed CSV file to preview and validate the data.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer rounded-lg border border-dashed border-white/20 bg-white/5 px-6 py-4 text-sm text-white/60 hover:border-cyan-500/30 hover:bg-white/10 transition-colors"
              >
                {file ? (
                  <span className="text-white">{file.name}</span>
                ) : (
                  <span>Click to select CSV file</span>
                )}
              </label>

              {file && !preview && (
                <Button onClick={handleUpload} disabled={uploading} isLoading={uploading}>
                  {uploading ? 'Processing...' : 'Upload & Preview'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Step 3: Preview & Import */}
      {preview && (
        <GlassCard className="mb-6 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-semibold">
              3
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-4">Preview & Import</h3>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <div className="text-2xl font-semibold text-white">{preview.totalRows}</div>
                  <div className="text-xs text-white/60">Total Rows</div>
                </div>
                <div className="rounded-lg bg-green-500/10 p-4 text-center">
                  <div className="text-2xl font-semibold text-green-400">{preview.validCount}</div>
                  <div className="text-xs text-white/60">Valid</div>
                </div>
                <div className="rounded-lg bg-red-500/10 p-4 text-center">
                  <div className="text-2xl font-semibold text-red-400">{preview.invalidCount}</div>
                  <div className="text-xs text-white/60">Errors</div>
                </div>
              </div>

              {/* Errors */}
              {preview.invalidCalls.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-red-400 mb-2">Errors ({preview.invalidCount})</h4>
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 max-h-40 overflow-auto">
                    {preview.invalidCalls.map((call) => (
                      <div key={call.rowNumber} className="text-sm text-white/80 mb-1">
                        <span className="text-red-400">Row {call.rowNumber}:</span> {call.error}
                        {call.dealLeadName && <span className="text-white/40"> ({call.dealLeadName})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Valid Calls Preview */}
              {preview.validCalls.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-green-400 mb-2">
                    Ready to Import ({preview.validCount})
                  </h4>
                  <div className="rounded-lg border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto max-h-60">
                      <table className="w-full text-sm">
                        <thead className="bg-white/5 text-white/70">
                          <tr>
                            <th className="px-3 py-2 text-left">Row</th>
                            <th className="px-3 py-2 text-left">Match</th>
                            <th className="px-3 py-2 text-left">Contact</th>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-left">Time</th>
                            <th className="px-3 py-2 text-left">Outcome</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {preview.validCalls.slice(0, 10).map((call) => (
                            <tr key={call.rowNumber} className="text-white/80">
                              <td className="px-3 py-2">{call.rowNumber}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    call.matchType === 'deal'
                                      ? 'bg-cyan-500/20 text-cyan-400'
                                      : 'bg-purple-500/20 text-purple-400'
                                  }`}
                                >
                                  {call.matchType}
                                </span>{' '}
                                {call.matchedName}
                              </td>
                              <td className="px-3 py-2">{call.contactName || '-'}</td>
                              <td className="px-3 py-2">{call.callDate}</td>
                              <td className="px-3 py-2">{call.callTime || '-'}</td>
                              <td className="px-3 py-2">
                                {call.outcome ? (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/10">
                                    {call.outcome.replace(/_/g, ' ')}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {preview.validCalls.length > 10 && (
                        <div className="px-3 py-2 text-sm text-white/40 bg-white/5">
                          ... and {preview.validCalls.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button variant="secondary" onClick={handleReset}>
                  Cancel
                </Button>
                {preview.validCount > 0 && (
                  <Button onClick={handleImport} disabled={importing} isLoading={importing}>
                    {importing ? 'Importing...' : `Import ${preview.validCount} Calls`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Instructions */}
      <GlassCard variant="secondary" className="p-6">
        <h3 className="text-white font-medium mb-3">CSV Format</h3>
        <div className="text-sm text-white/60 space-y-2">
          <p>
            <strong className="text-white/80">Required columns:</strong> Deal/Lead Name, Call Date
          </p>
          <p>
            <strong className="text-white/80">Optional columns:</strong> Contact Name, Call Time, Duration (min), Outcome, Notes
          </p>
          <p>
            <strong className="text-white/80">Date format:</strong> YYYY-MM-DD (e.g., 2026-01-06)
          </p>
          <p>
            <strong className="text-white/80">Time format:</strong> HH:MM 24-hour (e.g., 14:30)
          </p>
          <p>
            <strong className="text-white/80">Valid outcomes:</strong> CONNECTED, MEETING_BOOKED, LEFT_VOICEMAIL, NO_ANSWER, BUSY,
            NOT_INTERESTED, WRONG_NUMBER, CALLBACK_REQUESTED
          </p>
          <p className="text-cyan-400/80 mt-4">
            Tip: Lead statuses auto-update based on outcome (MEETING_BOOKED &rarr; Qualified, CONNECTED &rarr; Contacted, NOT_INTERESTED &rarr; Unqualified)
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-white/10 rounded mb-6"></div>
        <div className="h-32 bg-white/5 rounded-lg mb-6"></div>
        <div className="h-32 bg-white/5 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function BulkLogCallsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BulkLogCallsContent />
    </Suspense>
  );
}
