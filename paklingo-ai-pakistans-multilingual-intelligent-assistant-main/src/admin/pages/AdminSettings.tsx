/**
 * PakLingo AI - Administrative Settings & Governance
 * Control global platform flags, maintenance mode, module enable/disable switches, and AI model policies.
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Cpu,
  Lock,
  Layers,
  Sliders,
} from 'lucide-react';
import { AdminAPI } from '../api';
import { SystemSettingsConfig } from '../types';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminAPI.getSettings();
      setSettings(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await AdminAPI.updateSettings(settings);
      setSettings(res.settings);
      setSuccessMessage('System configuration saved and applied across the cluster.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to persist settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeature = (key: keyof SystemSettingsConfig['enabledFeatures']) => {
    if (!settings) return;
    setSettings({
      ...settings,
      enabledFeatures: {
        ...settings.enabledFeatures,
        [key]: !settings.enabledFeatures[key],
      },
    });
  };

  if (isLoading && !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">Loading system configurations...</p>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div id="admin-settings-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
            <Settings className="w-6 h-6 text-[var(--accent)]" />
            <span>Administrative Governance & Policies</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure system parameters, access policies, AI model allocations, and feature availability
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaving ? 'Applying Changes...' : 'Save Configuration'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: General Platform Flags */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <Sliders className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">General Operational Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">Platform Brand Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">Default Fallback Language</label>
              <select
                value={settings.defaultLanguage}
                onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
              >
                <option value="ur">Urdu (اردو)</option>
                <option value="en">English</option>
                <option value="pa">Punjabi (پنجابی)</option>
                <option value="ps">Pashto (پښتو)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <div>
                <div className="font-semibold text-[var(--text-primary)]">Maintenance Mode</div>
                <div className="text-[11px] text-[var(--text-muted)]">Show maintenance splash to standard citizens</div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              <div>
                <div className="font-semibold text-[var(--text-primary)]">Allow Public Citizen Signups</div>
                <div className="text-[11px] text-[var(--text-muted)]">Permit new account creations via login portal</div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowPublicSignups}
                onChange={(e) => setSettings({ ...settings, allowPublicSignups: e.target.checked })}
                className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Feature & Module Toggles */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <Layers className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Feature Module Governance</h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Instantly enable or disable individual assistant modules across the public website.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(settings.enabledFeatures).map(([key, isEnabled]) => {
              const formattedName = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase());

              return (
                <div
                  key={key}
                  onClick={() => toggleFeature(key as any)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isEnabled
                      ? 'bg-[var(--surface-secondary)] border-[var(--accent)]/50 text-[var(--text-primary)]'
                      : 'bg-[var(--surface-secondary)]/40 border-[var(--border)] text-[var(--text-muted)] opacity-60'
                  }`}
                >
                  <span className="text-xs font-semibold capitalize">{formattedName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isEnabled
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                    }`}
                  >
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: AI Model Allocations & Rate Limiting */}
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <Cpu className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">AI Model Routing & Rate Limiting</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">Primary Reasoning Model</label>
              <select
                value={settings.aiModels.primaryModel}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    aiModels: { ...settings.aiModels, primaryModel: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Standard High Speed)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Advanced Multi-turn Legal/Medical)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">Fallback Model</label>
              <select
                value={settings.aiModels.fallbackModel}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    aiModels: { ...settings.aiModels, fallbackModel: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                Rate Limit per Citizen (Requests / min)
              </label>
              <input
                type="number"
                value={settings.rateLimitPerMinute}
                onChange={(e) => setSettings({ ...settings, rateLimitPerMinute: parseInt(e.target.value, 10) || 60 })}
                min={10}
                max={600}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1.5">
                Data Retention Window (Days)
              </label>
              <input
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value, 10) || 90 })}
                min={7}
                max={365}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* Save Footer Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save System Governance Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
