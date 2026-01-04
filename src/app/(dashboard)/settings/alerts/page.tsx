'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import SectionHeader from '@/components/SectionHeader';
import { Modal, Button, TextInput, SelectInput, TextareaInput, Badge, EmptyState, Tabs, Checkbox } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime, formatDate } from '@/lib/mock-data';
import { AlertCategory, AlertSeverity, AlertType } from '@prisma/client';

const categoryLabels: Record<AlertCategory, string> = {
  QUOTA: 'Quota Tracking',
  STALE: 'Stale Leads/Deals',
  ACTIVITY: 'Activity Monitoring',
  TASK: 'Task Alerts',
  MARKETING: 'Marketing Performance',
  MONTHLY: 'Monthly Review',
};

const categoryDescriptions: Record<AlertCategory, string> = {
  QUOTA: 'Alerts when quota targets are at risk or achieved',
  STALE: 'Alerts for leads/deals with no recent activity',
  ACTIVITY: 'Alerts for low activity levels',
  TASK: 'Alerts for overdue tasks',
  MARKETING: 'Alerts for marketing task success rates',
  MONTHLY: 'End-of-month performance reviews',
};

const thresholdLabels: Record<AlertCategory, { red: string; yellow: string; green: string }> = {
  QUOTA: { red: 'RED if below %', yellow: 'YELLOW if below %', green: 'GREEN if above %' },
  STALE: { red: 'RED if > days', yellow: 'YELLOW if > days', green: 'N/A' },
  ACTIVITY: { red: 'RED if below % target', yellow: 'YELLOW if below % target', green: 'GREEN if above % target' },
  TASK: { red: 'RED if > overdue', yellow: 'YELLOW if > overdue', green: 'N/A' },
  MARKETING: { red: 'RED if success < %', yellow: 'YELLOW if success < %', green: 'GREEN if success > %' },
  MONTHLY: { red: 'RED if below %', yellow: 'YELLOW if below %', green: 'GREEN if above %' },
};

const severityColors: Record<AlertSeverity, string> = {
  RED: 'bg-red-500/20 text-red-400 border-red-500/30',
  YELLOW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  GREEN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AlertConfig {
  id: string;
  alertCategory: AlertCategory;
  enabled: boolean;
  schedule: string;
  redThreshold: number | null;
  yellowThreshold: number | null;
  greenThreshold: number | null;
  ccRecipients: string[];
  bccAdmin: boolean;
  testMode: boolean;
}

interface GlobalSettings {
  id: string;
  fromEmail: string;
  bccAllToAdmin: boolean;
  adminEmail: string;
  testMode: boolean;
}

interface Exclusion {
  id: string;
  userId: string;
  user: User;
  startDate: string;
  endDate: string;
  reason: string | null;
}

interface AlertHistoryItem {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  user: User;
  recipientTo: string;
  recipientsCc: string[];
  subject: string;
  sentAt: string;
}

export default function AlertSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [exclusions, setExclusions] = useState<Exclusion[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Modal states
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isExclusionModalOpen, setIsExclusionModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AlertConfig | null>(null);

  // Form states
  const [configForm, setConfigForm] = useState({
    schedule: '',
    redThreshold: '',
    yellowThreshold: '',
    greenThreshold: '',
    ccRecipients: '',
    bccAdmin: false,
    testMode: false,
  });

  const [exclusionForm, setExclusionForm] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [globalForm, setGlobalForm] = useState({
    fromEmail: '',
    bccAllToAdmin: false,
    adminEmail: '',
    testMode: false,
  });

  // Check authorization
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/settings/alerts');
        if (!res.ok) {
          if (res.status === 403) {
            router.push('/dashboard');
            return;
          }
          throw new Error('Failed to fetch');
        }
        const data = await res.json();
        setAlertConfigs(data.alertConfigs);
        setGlobalSettings(data.globalSettings);
        setExclusions(data.exclusions);
        setAlertHistory(data.alertHistory);
        setUsers(data.users);

        if (data.globalSettings) {
          setGlobalForm({
            fromEmail: data.globalSettings.fromEmail,
            bccAllToAdmin: data.globalSettings.bccAllToAdmin,
            adminEmail: data.globalSettings.adminEmail,
            testMode: data.globalSettings.testMode,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Failed to load alert settings', 'error');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.role === 'SUPER_ADMIN') {
      fetchData();
    }
  }, [session, router, showToast]);

  const handleToggleConfig = async (config: AlertConfig) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'alertConfig',
          id: config.id,
          data: { ...config, enabled: !config.enabled },
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setAlertConfigs((prev) =>
        prev.map((c) => (c.id === config.id ? { ...c, enabled: !c.enabled } : c))
      );
      showToast(`${categoryLabels[config.alertCategory]} ${!config.enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      showToast('Failed to update alert', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openConfigModal = (config: AlertConfig) => {
    setEditingConfig(config);
    setConfigForm({
      schedule: config.schedule,
      redThreshold: config.redThreshold?.toString() || '',
      yellowThreshold: config.yellowThreshold?.toString() || '',
      greenThreshold: config.greenThreshold?.toString() || '',
      ccRecipients: config.ccRecipients.join(', '),
      bccAdmin: config.bccAdmin,
      testMode: config.testMode,
    });
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'alertConfig',
          id: editingConfig.id,
          data: {
            ...editingConfig,
            schedule: configForm.schedule,
            redThreshold: parseFloat(configForm.redThreshold) || null,
            yellowThreshold: parseFloat(configForm.yellowThreshold) || null,
            greenThreshold: parseFloat(configForm.greenThreshold) || null,
            ccRecipients: configForm.ccRecipients.split(',').map((e) => e.trim()).filter(Boolean),
            bccAdmin: configForm.bccAdmin,
            testMode: configForm.testMode,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setAlertConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setIsConfigModalOpen(false);
      setEditingConfig(null);
      showToast('Alert configuration updated', 'success');
    } catch (error) {
      showToast('Failed to update configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGlobalSettings = async () => {
    if (!globalSettings) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'globalSettings',
          id: globalSettings.id,
          data: globalForm,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setGlobalSettings(updated);
      showToast('Global settings updated', 'success');
    } catch (error) {
      showToast('Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExclusion = async () => {
    if (!exclusionForm.userId || !exclusionForm.startDate || !exclusionForm.endDate) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings/alerts/exclusions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exclusionForm),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create');
      }

      const newExclusion = await res.json();
      setExclusions((prev) => [...prev, newExclusion]);
      setIsExclusionModalOpen(false);
      setExclusionForm({ userId: '', startDate: '', endDate: '', reason: '' });
      showToast('Exclusion added', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to add exclusion', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExclusion = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/alerts/exclusions?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setExclusions((prev) => prev.filter((e) => e.id !== id));
      showToast('Exclusion removed', 'info');
    } catch (error) {
      showToast('Failed to remove exclusion', 'error');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/10 rounded" />
          <div className="h-64 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  // Tab contents
  const configurationContent = (
    <div className="space-y-4">
      {/* Alert Configuration Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="pb-3 text-left text-xs font-medium text-white/50">Alert Type</th>
              <th className="pb-3 text-center text-xs font-medium text-white/50">Enabled</th>
              <th className="pb-3 text-center text-xs font-medium text-white/50">Schedule</th>
              <th className="pb-3 text-center text-xs font-medium text-white/50">Thresholds</th>
              <th className="pb-3 text-center text-xs font-medium text-white/50">Test Mode</th>
              <th className="pb-3 text-right text-xs font-medium text-white/50">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alertConfigs.map((config) => (
              <tr key={config.id} className="border-b border-white/5">
                <td className="py-4">
                  <div>
                    <p className="text-sm font-medium text-white">{categoryLabels[config.alertCategory]}</p>
                    <p className="text-xs text-white/50">{categoryDescriptions[config.alertCategory]}</p>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <button
                    onClick={() => handleToggleConfig(config)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.enabled ? 'bg-cyan-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="py-4 text-center">
                  <span className="text-xs text-white/70 font-mono">{config.schedule}</span>
                </td>
                <td className="py-4 text-center">
                  <div className="flex justify-center gap-1">
                    {config.redThreshold !== null && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                        R:{config.redThreshold}
                      </span>
                    )}
                    {config.yellowThreshold !== null && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        Y:{config.yellowThreshold}
                      </span>
                    )}
                    {config.greenThreshold !== null && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        G:{config.greenThreshold}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 text-center">
                  {config.testMode && (
                    <Badge variant="warning" size="sm">Test</Badge>
                  )}
                </td>
                <td className="py-4 text-right">
                  <Button size="sm" variant="secondary" onClick={() => openConfigModal(config)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const globalSettingsContent = (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="From Email Address"
          type="email"
          value={globalForm.fromEmail}
          onChange={(e) => setGlobalForm({ ...globalForm, fromEmail: e.target.value })}
          placeholder="alerts@forge-crm.com"
        />
        <TextInput
          label="Admin Email Address"
          type="email"
          value={globalForm.adminEmail}
          onChange={(e) => setGlobalForm({ ...globalForm, adminEmail: e.target.value })}
          placeholder="admin@forge-crm.com"
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={globalForm.bccAllToAdmin}
            onChange={(e) => setGlobalForm({ ...globalForm, bccAllToAdmin: e.target.checked })}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/30"
          />
          <span className="text-sm text-white">BCC all alert emails to admin</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={globalForm.testMode}
            onChange={(e) => setGlobalForm({ ...globalForm, testMode: e.target.checked })}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/30"
          />
          <div>
            <span className="text-sm text-white">Global Test Mode</span>
            <p className="text-xs text-white/50">Send all alerts to admin only, not actual recipients</p>
          </div>
        </label>
      </div>

      <div className="pt-4">
        <Button onClick={handleSaveGlobalSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Global Settings'}
        </Button>
      </div>
    </div>
  );

  const exclusionsContent = (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-white/60">
          Pause alerts for specific users during vacations, onboarding, etc.
        </p>
        <Button size="sm" onClick={() => setIsExclusionModalOpen(true)}>
          + Add Exclusion
        </Button>
      </div>

      {exclusions.length === 0 ? (
        <EmptyState
          icon="🔕"
          title="No active exclusions"
          description="Add exclusions to pause alerts for specific users"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 text-left text-xs font-medium text-white/50">User</th>
                <th className="pb-3 text-left text-xs font-medium text-white/50">Start Date</th>
                <th className="pb-3 text-left text-xs font-medium text-white/50">End Date</th>
                <th className="pb-3 text-left text-xs font-medium text-white/50">Reason</th>
                <th className="pb-3 text-right text-xs font-medium text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exclusions.map((exclusion) => (
                <tr key={exclusion.id} className="border-b border-white/5">
                  <td className="py-3">
                    <div>
                      <p className="text-sm text-white">{exclusion.user.name}</p>
                      <p className="text-xs text-white/50">{exclusion.user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-white/70">
                    {formatDate(new Date(exclusion.startDate))}
                  </td>
                  <td className="py-3 text-sm text-white/70">
                    {formatDate(new Date(exclusion.endDate))}
                  </td>
                  <td className="py-3 text-sm text-white/60">
                    {exclusion.reason || '-'}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDeleteExclusion(exclusion.id)}
                      className="text-white/40 hover:text-red-400 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const historyContent = (
    <div className="space-y-4">
      <p className="text-sm text-white/60">
        Alert history from the last 30 days
      </p>

      {alertHistory.length === 0 ? (
        <EmptyState
          icon="📧"
          title="No alerts sent yet"
          description="Alert history will appear here once alerts are triggered"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 text-left text-xs font-medium text-white/50">Date/Time</th>
                <th className="pb-3 text-left text-xs font-medium text-white/50">Alert Type</th>
                <th className="pb-3 text-left text-xs font-medium text-white/50">User</th>
                <th className="pb-3 text-center text-xs font-medium text-white/50">Severity</th>
                <th className="pb-3 text-left text-xs font-medium text-white/50">Recipients</th>
              </tr>
            </thead>
            <tbody>
              {alertHistory.map((item) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="py-3 text-xs text-white/70">
                    {formatDateTime(new Date(item.sentAt))}
                  </td>
                  <td className="py-3 text-sm text-white">
                    {item.alertType.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3">
                    <div>
                      <p className="text-sm text-white">{item.user.name}</p>
                      <p className="text-xs text-white/50">{item.user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${severityColors[item.severity]}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-white/60">
                    <div>
                      <p>To: {item.recipientTo}</p>
                      {item.recipientsCc.length > 0 && (
                        <p className="text-white/40">CC: {item.recipientsCc.join(', ')}</p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/70 mb-2"
        >
          ← Back to Settings
        </Link>
        <SectionHeader
          title="Alert Management"
          subtitle="Configure alert thresholds, schedules, and recipients"
        />
      </div>

      <GlassCard variant="primary" className="p-6">
        <Tabs
          tabs={[
            { id: 'configuration', label: 'Alert Configuration', content: configurationContent },
            { id: 'global', label: 'Global Settings', content: globalSettingsContent },
            { id: 'exclusions', label: 'User Exclusions', content: exclusionsContent },
            { id: 'history', label: 'Alert History', content: historyContent },
          ]}
        />
      </GlassCard>

      {/* Edit Config Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => { setIsConfigModalOpen(false); setEditingConfig(null); }}
        title={editingConfig ? `Edit ${categoryLabels[editingConfig.alertCategory]}` : 'Edit Alert'}
        size="md"
      >
        {editingConfig && (
          <div className="space-y-4">
            <TextInput
              label="Schedule (Cron Format)"
              value={configForm.schedule}
              onChange={(e) => setConfigForm({ ...configForm, schedule: e.target.value })}
              placeholder="0 9 * * 1-5"
            />
            <p className="text-xs text-white/50 -mt-2">
              Examples: "0 9 * * 1-5" (9am weekdays), "0 8 * * *" (8am daily)
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <TextInput
                label={thresholdLabels[editingConfig.alertCategory].red}
                type="number"
                value={configForm.redThreshold}
                onChange={(e) => setConfigForm({ ...configForm, redThreshold: e.target.value })}
              />
              <TextInput
                label={thresholdLabels[editingConfig.alertCategory].yellow}
                type="number"
                value={configForm.yellowThreshold}
                onChange={(e) => setConfigForm({ ...configForm, yellowThreshold: e.target.value })}
              />
              <TextInput
                label={thresholdLabels[editingConfig.alertCategory].green}
                type="number"
                value={configForm.greenThreshold}
                onChange={(e) => setConfigForm({ ...configForm, greenThreshold: e.target.value })}
              />
            </div>

            <TextareaInput
              label="CC Recipients (comma-separated emails)"
              value={configForm.ccRecipients}
              onChange={(e) => setConfigForm({ ...configForm, ccRecipients: e.target.value })}
              placeholder="hr@company.com, manager@company.com"
            />

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.bccAdmin}
                  onChange={(e) => setConfigForm({ ...configForm, bccAdmin: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500"
                />
                <span className="text-sm text-white">BCC admin on all alerts</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.testMode}
                  onChange={(e) => setConfigForm({ ...configForm, testMode: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500"
                />
                <span className="text-sm text-white">Test mode (send to admin only)</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => { setIsConfigModalOpen(false); setEditingConfig(null); }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Exclusion Modal */}
      <Modal
        isOpen={isExclusionModalOpen}
        onClose={() => setIsExclusionModalOpen(false)}
        title="Add User Exclusion"
      >
        <div className="space-y-4">
          <SelectInput
            label="User"
            value={exclusionForm.userId}
            onChange={(e) => setExclusionForm({ ...exclusionForm, userId: e.target.value })}
            options={[
              { value: '', label: 'Select user...' },
              ...users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` })),
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Start Date"
              type="date"
              value={exclusionForm.startDate}
              onChange={(e) => setExclusionForm({ ...exclusionForm, startDate: e.target.value })}
            />
            <TextInput
              label="End Date"
              type="date"
              value={exclusionForm.endDate}
              onChange={(e) => setExclusionForm({ ...exclusionForm, endDate: e.target.value })}
            />
          </div>

          <TextareaInput
            label="Reason (optional)"
            value={exclusionForm.reason}
            onChange={(e) => setExclusionForm({ ...exclusionForm, reason: e.target.value })}
            placeholder="e.g., Vacation, Onboarding, Medical leave"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsExclusionModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleAddExclusion} disabled={saving}>
              {saving ? 'Adding...' : 'Add Exclusion'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
