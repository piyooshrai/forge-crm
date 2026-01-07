'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import {
  Button,
  TextInput,
  SelectInput,
  TextareaInput,
  SearchableSelect,
  useToast,
} from '@/components/ui';
import type { DealLeadOption } from '@/components/ui';
import { ActivityOutcome } from '@prisma/client';

const callOutcomes: { value: string; label: string }[] = [
  { value: '', label: 'Select outcome...' },
  { value: 'CONNECTED', label: 'Connected' },
  { value: 'LEFT_VOICEMAIL', label: 'Left Voicemail' },
  { value: 'NO_ANSWER', label: 'No Answer' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'WRONG_NUMBER', label: 'Wrong Number' },
  { value: 'SCHEDULED_CALLBACK', label: 'Scheduled Callback' },
];

interface CallEntry {
  id: string;
  dealLead: DealLeadOption | null;
  contactName: string;
  duration: string;
  outcome: string;
  notes: string;
}

function createEmptyCall(): CallEntry {
  return {
    id: Math.random().toString(36).substring(7),
    dealLead: null,
    contactName: '',
    duration: '',
    outcome: '',
    notes: '',
  };
}

function BulkLogCallsContent() {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const [callDate, setCallDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [defaultOutcome, setDefaultOutcome] = useState('');

  const [calls, setCalls] = useState<CallEntry[]>(() => [
    createEmptyCall(),
    createEmptyCall(),
    createEmptyCall(),
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateCall = (id: string, field: keyof CallEntry, value: any) => {
    setCalls(calls.map((call) => (call.id === id ? { ...call, [field]: value } : call)));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${id}-${field}`];
      return newErrors;
    });
  };

  const addCall = () => {
    setCalls([...calls, createEmptyCall()]);
  };

  const removeCall = (id: string) => {
    if (calls.length <= 1) {
      showToast('At least one call entry is required', 'warning');
      return;
    }
    setCalls(calls.filter((call) => call.id !== id));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!callDate) {
      newErrors['date'] = 'Date is required';
    } else {
      const selectedDate = new Date(callDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors['date'] = 'Cannot log calls for future dates';
      }
    }

    calls.forEach((call) => {
      if (!call.dealLead) {
        newErrors[`${call.id}-dealLead`] = 'Deal or Lead is required';
      }
      if (call.duration && (isNaN(Number(call.duration)) || Number(call.duration) < 0)) {
        newErrors[`${call.id}-duration`] = 'Duration must be a positive number';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showToast('Please fix the errors before submitting', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        date: callDate,
        defaultOutcome: defaultOutcome || undefined,
        calls: calls.map((call) => ({
          dealId: call.dealLead?.type === 'deal' ? call.dealLead.id : undefined,
          leadId: call.dealLead?.type === 'lead' ? call.dealLead.id : undefined,
          contactName: call.contactName || undefined,
          duration: call.duration ? Number(call.duration) : undefined,
          outcome: call.outcome || undefined,
          notes: call.notes || undefined,
        })),
      };

      const res = await fetch('/api/activities/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save calls');
      }

      const data = await res.json();
      setSavedCount(data.count);
      setShowSuccess(true);
    } catch (error: any) {
      showToast(error.message || 'Failed to save calls', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogMore = () => {
    setShowSuccess(false);
    setSavedCount(0);
    setCalls([createEmptyCall(), createEmptyCall(), createEmptyCall()]);
  };

  if (showSuccess) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
        <GlassCard variant="primary" className="p-8 text-center">
          <div className="text-5xl mb-4">&#x2705;</div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {savedCount} call{savedCount !== 1 ? 's' : ''} logged successfully
          </h2>
          <p className="text-white/60 mb-6">Your call activities have been saved.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleLogMore}>Log More Calls</Button>
            <Link href="/deals">
              <Button variant="secondary">View Deals</Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <SectionHeader title="Bulk Log Calls" subtitle="Log multiple call activities at once" />
      </div>

      <GlassCard className="mb-6 p-4">
        <h3 className="text-sm font-medium text-white/70 mb-4">Default Settings</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Call Date"
            type="date"
            value={callDate}
            onChange={(e) => {
              setCallDate(e.target.value);
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors['date'];
                return newErrors;
              });
            }}
            error={errors['date']}
            max={new Date().toISOString().split('T')[0]}
          />
          <SelectInput
            label="Default Outcome (Optional)"
            value={defaultOutcome}
            onChange={(e) => setDefaultOutcome(e.target.value)}
            options={callOutcomes}
          />
        </div>
      </GlassCard>

      <div className="space-y-4 mb-6">
        {calls.map((call, index) => (
          <GlassCard key={call.id} variant="secondary" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">Call #{index + 1}</h3>
              <button
                type="button"
                onClick={() => removeCall(call.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SearchableSelect
                label="Deal / Lead *"
                value={call.dealLead}
                onChange={(option) => updateCall(call.id, 'dealLead', option)}
                placeholder="Search deals or leads..."
                error={errors[`${call.id}-dealLead`]}
              />
              <TextInput
                label="Contact Name"
                value={call.contactName}
                onChange={(e) => updateCall(call.id, 'contactName', e.target.value)}
                placeholder="e.g., John Smith"
              />
              <TextInput
                label="Duration (minutes)"
                type="number"
                value={call.duration}
                onChange={(e) => updateCall(call.id, 'duration', e.target.value)}
                placeholder="e.g., 15"
                min={0}
                error={errors[`${call.id}-duration`]}
              />
              <SelectInput
                label="Outcome"
                value={call.outcome}
                onChange={(e) => updateCall(call.id, 'outcome', e.target.value)}
                options={callOutcomes}
              />
            </div>

            <div className="mt-4">
              <TextareaInput
                label="Notes"
                value={call.notes}
                onChange={(e) => updateCall(call.id, 'notes', e.target.value)}
                placeholder="Call notes..."
              />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="secondary" onClick={addCall}>
          + Add Another Call
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} isLoading={submitting}>
          {submitting ? 'Saving...' : `Save All Calls (${calls.length})`}
        </Button>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-white/10 rounded mb-6"></div>
        <div className="h-32 bg-white/5 rounded-lg mb-6"></div>
        <div className="h-64 bg-white/5 rounded-lg"></div>
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
