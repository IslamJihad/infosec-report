'use client';

import { useEffect, useState } from 'react';
import { fetchSettings, testAIConnection, updateSettings } from '@/lib/api';
import Link from 'next/link';
import type { AppSettings } from '@/types/report';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { useTheme } from '@/components/theme/ThemeProvider';
import { normalizeThemeMode, type ThemeMode } from '@/lib/theme';
import {
  AI_MODEL_OPTIONS,
  AI_PROVIDER_OPTIONS,
  getDefaultModelForProvider,
  getProviderMeta,
  normalizeAIModel,
  normalizeAIProvider,
  type AIProvider,
} from '@/lib/ai/models';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'singleton',
  aiProvider: 'gemini',
  aiModel: getDefaultModelForProvider('gemini'),
  theme: 'system',
  geminiApiKey: '',
  nvidiaApiKey: '',
  aiApiKey: '',
  hasGeminiApiKey: false,
  hasNvidiaApiKey: false,
  geminiApiKeyMasked: '',
  nvidiaApiKeyMasked: '',
  defaultOrgName: '',
  defaultAuthor: '',
};

export default function SettingsPage() {
  const { setMode: setThemeMode } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const providerMeta = getProviderMeta(settings.aiProvider);
  const modelOptions = AI_MODEL_OPTIONS[settings.aiProvider];
  const activeApiKey = settings.aiProvider === 'nvidia' ? settings.nvidiaApiKey : settings.geminiApiKey;
  const activeHasStoredKey = settings.aiProvider === 'nvidia'
    ? Boolean(settings.hasNvidiaApiKey)
    : Boolean(settings.hasGeminiApiKey);
  const activeMaskedKey = settings.aiProvider === 'nvidia'
    ? (settings.nvidiaApiKeyMasked || '')
    : (settings.geminiApiKeyMasked || '');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSettings();
        const aiProvider = normalizeAIProvider(data.aiProvider);
        const aiModel = normalizeAIModel(aiProvider, data.aiModel);
        const theme = normalizeThemeMode(data.theme);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          aiProvider,
          aiModel,
          theme,
          geminiApiKey: '',
          nvidiaApiKey: data.nvidiaApiKey || '',
          aiApiKey: '',
          hasGeminiApiKey: Boolean(data.hasGeminiApiKey),
          hasNvidiaApiKey: Boolean(data.hasNvidiaApiKey),
          geminiApiKeyMasked: data.geminiApiKeyMasked || '',
          nvidiaApiKeyMasked: data.nvidiaApiKeyMasked || '',
        });
        setThemeMode(theme);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setThemeMode]);

  function setProvider(provider: AIProvider) {
    setSettings((prev) => ({
      ...prev,
      aiProvider: provider,
      aiModel: normalizeAIModel(provider, prev.aiModel),
    }));
    setTestResult(null);
  }

  function setActiveProviderKey(value: string) {
    setSettings((prev) => (
      prev.aiProvider === 'nvidia'
        ? { ...prev, nvidiaApiKey: value }
        : { ...prev, geminiApiKey: value, aiApiKey: value }
    ));
    setTestResult(null);
  }

  function handleThemeChange(nextTheme: ThemeMode) {
    const normalized = normalizeThemeMode(nextTheme);
    setSettings((prev) => ({ ...prev, theme: normalized }));
    setThemeMode(normalized);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const nextSettings: Partial<AppSettings> = {
        aiProvider: settings.aiProvider,
        aiModel: normalizeAIModel(settings.aiProvider, settings.aiModel),
        theme: settings.theme,
        defaultOrgName: settings.defaultOrgName,
        defaultAuthor: settings.defaultAuthor,
      };

      const geminiApiKey = settings.geminiApiKey.trim();
      const nvidiaApiKey = settings.nvidiaApiKey.trim();

      if (geminiApiKey) {
        nextSettings.geminiApiKey = geminiApiKey;
        nextSettings.aiApiKey = geminiApiKey;
      }

      if (nvidiaApiKey) {
        nextSettings.nvidiaApiKey = nvidiaApiKey;
      }

      const updated = await updateSettings(nextSettings);
      const aiProvider = normalizeAIProvider(updated.aiProvider);
      const aiModel = normalizeAIModel(aiProvider, updated.aiModel);

      setSettings((prev) => ({
        ...prev,
        ...updated,
        aiProvider,
        aiModel,
        theme: normalizeThemeMode(updated.theme),
        geminiApiKey: '',
        nvidiaApiKey: '',
        aiApiKey: '',
      }));

      setThemeMode(normalizeThemeMode(updated.theme));

      setSaved(true);
      setTestResult(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    if (!activeApiKey && !activeHasStoredKey) {
      setTestResult(`❌ يرجى إدخال مفتاح API لمزود ${providerMeta.label} أولاً`);
      return;
    }

    setTestResult('⏳ جاري الاختبار...');
    try {
      const result = await testAIConnection({
        aiProvider: settings.aiProvider,
        aiModel: settings.aiModel,
        geminiApiKey: settings.geminiApiKey,
        nvidiaApiKey: settings.nvidiaApiKey,
      });
      setTestResult(`✅ ${result.message || 'الاتصال ناجح'}`);
    } catch (e: unknown) {
      setTestResult(`❌ ${(e as Error).message || 'فشل الاتصال بالخادم'}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-3xl animate-spin">⚙️</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen [background:var(--page-main-bg)]">
      {/* Header */}
      <header className="bg-gradient-to-l from-navy-950 via-navy-900 to-navy-950 text-white shadow-xl">
        <div className="max-w-3xl mx-auto px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-2xl flex items-center justify-center text-2xl shadow-lg">⚙️</div>
            <div>
              <h1 className="text-xl font-[900]">إعدادات النظام</h1>
              <p className="text-sm opacity-55 mt-0.5">ضبط الذكاء الاصطناعي والإعدادات الافتراضية</p>
            </div>
          </div>
          <Link href="/" className="text-white/70 hover:text-white transition-colors text-sm no-underline bg-white/10 rounded-xl px-5 py-2 hover:bg-white/20">
            → الرجوع للوحة
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* AI Settings */}
        <div className="bg-[color:var(--surface-elevated)] rounded-2xl border border-border/60 mb-5 overflow-hidden shadow-md">
          <div className="bg-gradient-to-l from-purple-800 to-purple-900 text-white px-6 py-4 text-base font-bold flex items-center gap-2.5">
            🤖 إعدادات الذكاء الاصطناعي
          </div>
          <div className="p-6">
            <div className="mb-5">
              <label className="text-sm font-bold text-text-secondary block mb-2">مزود الذكاء الاصطناعي</label>
              <select
                value={settings.aiProvider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                className="border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-purple-700 focus:shadow-[0_0_0_3px_var(--color-focus-ring)] bg-[color:var(--surface-elevated)] w-full hover:border-purple-200 transition-all duration-200"
              >
                {AI_PROVIDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="text-xs text-text-hint mt-2">يمكنك حفظ مفاتيح Gemini وNVIDIA بشكل منفصل والتبديل بينهما بأي وقت.</p>
            </div>

            <div className="mb-5">
              <label className="text-sm font-bold text-text-secondary block mb-2">{providerMeta.keyLabel}</label>
              <div className="flex gap-2.5">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={activeApiKey}
                  onChange={(e) => setActiveProviderKey(e.target.value)}
                  className="flex-1 border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-purple-700 focus:shadow-[0_0_0_3px_var(--color-focus-ring)] hover:border-purple-200 transition-all duration-200 bg-[color:var(--surface-elevated)] text-text-primary"
                  placeholder={activeMaskedKey ? `مفتاح محفوظ (${activeMaskedKey})` : providerMeta.keyPlaceholder}
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="bg-[color:var(--surface-muted)] border border-border rounded-xl px-4 text-base cursor-pointer hover:bg-[color:var(--button-soft-hover)] transition-all duration-200 text-text-secondary"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-text-hint mt-2">
                احصل على مفتاح API من{' '}
                <a href={providerMeta.keyHelpUrl} target="_blank" className="text-purple-800 underline font-semibold">{providerMeta.keyHelpText}</a>
              </p>
              <p className="text-xs text-text-hint mt-1">اترك الحقل فارغاً للاحتفاظ بالمفتاح المخزن حالياً.</p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-[color:var(--surface-muted)] border border-border rounded-lg px-3 py-2 text-text-secondary">
                  Gemini: {settings.geminiApiKey
                    ? '🟡 مفتاح جديد غير محفوظ'
                    : settings.hasGeminiApiKey
                      ? `✅ محفوظ (${settings.geminiApiKeyMasked || '••••••'})`
                      : '⚪ غير محفوظ'}
                </div>
                <div className="bg-[color:var(--surface-muted)] border border-border rounded-lg px-3 py-2 text-text-secondary">
                  NVIDIA: {settings.nvidiaApiKey
                    ? '🟡 مفتاح جديد غير محفوظ'
                    : settings.hasNvidiaApiKey
                      ? `✅ محفوظ (${settings.nvidiaApiKeyMasked || '••••••'})`
                      : '⚪ غير محفوظ'}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-sm font-bold text-text-secondary block mb-2">النموذج</label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-purple-700 focus:shadow-[0_0_0_3px_var(--color-focus-ring)] bg-[color:var(--surface-elevated)] w-full hover:border-purple-200 transition-all duration-200"
              >
                {modelOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleTestConnection}
              className="bg-purple-50 text-purple-900 border border-purple-300 rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer hover:bg-purple-100 hover:shadow-sm transition-all duration-200"
            >
              🔌 اختبار الاتصال
            </button>
            {testResult && (
              <p className="text-sm mt-3 p-3 rounded-xl bg-[color:var(--surface-muted)] border border-border text-text-secondary">{testResult}</p>
            )}
          </div>
        </div>

        {/* Default Settings */}
        <div className="bg-[color:var(--surface-elevated)] rounded-2xl border border-border/60 mb-5 overflow-hidden shadow-md">
          <div className="bg-gradient-to-l from-navy-800 to-navy-900 text-white px-6 py-4 text-base font-bold flex items-center gap-2.5">
            🏢 الإعدادات الافتراضية
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-bold text-text-secondary block mb-2">اسم المنظمة الافتراضي</label>
                <input
                  value={settings.defaultOrgName}
                  onChange={(e) => setSettings({ ...settings, defaultOrgName: e.target.value })}
                  className="w-full border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_var(--color-focus-ring)] hover:border-navy-200 transition-all duration-200 bg-[color:var(--surface-elevated)] text-text-primary"
                  placeholder="شركة المستقبل للتقنية"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-text-secondary block mb-2">معد التقرير الافتراضي</label>
                <input
                  value={settings.defaultAuthor}
                  onChange={(e) => setSettings({ ...settings, defaultAuthor: e.target.value })}
                  className="w-full border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_var(--color-focus-ring)] hover:border-navy-200 transition-all duration-200 bg-[color:var(--surface-elevated)] text-text-primary"
                  placeholder="إدارة أمن المعلومات"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-bold text-text-secondary block mb-2">المظهر العام</label>
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={settings.theme}
                  onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                  className="border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_var(--color-focus-ring)] bg-[color:var(--surface-elevated)] min-w-[170px]"
                >
                  <option value='light'>فاتح</option>
                  <option value='dark'>داكن</option>
                  <option value='system'>حسب النظام</option>
                </select>
                <ThemeToggle />
              </div>
              <p className="text-xs text-text-hint mt-2">يتم تطبيق هذا الاختيار على نظام التقارير وبيئة ISMS معاً.</p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-l from-navy-800 to-navy-900 text-white border-none rounded-xl px-8 py-3 text-base font-bold hover:from-navy-700 hover:to-navy-800 transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-lg shadow-navy-900/20"
          >
            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
          </button>
          {saved && (
            <span className="text-success-700 text-sm font-bold animate-fadeIn">✅ تم الحفظ بنجاح</span>
          )}
        </div>
      </div>
    </div>
  );
}
