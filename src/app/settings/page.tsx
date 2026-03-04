'use client';

import { useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '@/lib/api';
import Link from 'next/link';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    aiApiKey: '',
    aiModel: 'gemini-2.5-flash-preview-05-20',
    defaultOrgName: '',
    defaultAuthor: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const geminiModels = ['gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash-lite-preview-06-17'];

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSettings();
        // Migrate old Perplexity model values to Gemini default
        if (data.aiModel && !geminiModels.includes(data.aiModel)) {
          data.aiModel = 'gemini-2.5-flash-preview-05-20';
        }
        setSettings(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    if (!settings.aiApiKey) {
      setTestResult('❌ يرجى إدخال مفتاح API أولاً');
      return;
    }
    setTestResult('⏳ جاري الاختبار...');
    try {
      const modelToTest = geminiModels.includes(settings.aiModel) ? settings.aiModel : 'gemini-2.5-flash-preview-05-20';
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelToTest}:generateContent?key=${settings.aiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'مرحباً، أجب بكلمة واحدة: تجربة' }] }],
            generationConfig: { maxOutputTokens: 20 },
          }),
        }
      );
      if (res.ok) {
        setTestResult('✅ الاتصال ناجح! Gemini API يعمل بشكل صحيح.');
      } else {
        const err = await res.json().catch(() => ({}));
        setTestResult(`❌ خطأ ${res.status}: ${JSON.stringify(err).slice(0, 100)}`);
      }
    } catch {
      setTestResult('❌ فشل الاتصال بالخادم');
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
    <div className="min-h-screen bg-gradient-to-br from-[#e8edf4] via-[#dce4f0] to-[#c8d6e8]">
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
        <div className="bg-white rounded-2xl border border-border/60 mb-5 overflow-hidden shadow-md">
          <div className="bg-gradient-to-l from-purple-800 to-purple-900 text-white px-6 py-4 text-base font-bold flex items-center gap-2.5">
            🤖 إعدادات الذكاء الاصطناعي (Google Gemini)
          </div>
          <div className="p-6">
            <div className="mb-5">
              <label className="text-sm font-bold text-text-secondary block mb-2">مفتاح API – Google Gemini</label>
              <div className="flex gap-2.5">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.aiApiKey}
                  onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                  className="flex-1 border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-purple-700 focus:shadow-[0_0_0_3px_rgba(107,33,168,0.1)] hover:border-purple-200 transition-all duration-200"
                  placeholder="AIza..."
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="bg-gray-100 border border-gray-200 rounded-xl px-4 text-base cursor-pointer hover:bg-gray-200 transition-all duration-200"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-text-hint mt-2">
                احصل على مفتاح API من{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" className="text-purple-800 underline font-semibold">Google AI Studio</a>
              </p>
            </div>

            <div className="mb-5">
              <label className="text-sm font-bold text-text-secondary block mb-2">النموذج</label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-purple-700 focus:shadow-[0_0_0_3px_rgba(107,33,168,0.1)] bg-white w-full hover:border-purple-200 transition-all duration-200"
              >
                <option value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash (5 RPM - متقدم)</option>
                <option value="gemini-2.5-flash-lite-preview-06-17">Gemini 2.5 Flash Lite (10 RPM - أسرع)</option>
              </select>
            </div>

            <button
              onClick={handleTestConnection}
              className="bg-purple-50 text-purple-900 border border-purple-300 rounded-xl px-5 py-2.5 text-sm font-bold cursor-pointer hover:bg-purple-100 hover:shadow-sm transition-all duration-200"
            >
              🔌 اختبار الاتصال
            </button>
            {testResult && (
              <p className="text-sm mt-3 p-3 rounded-xl bg-gray-50 border border-border">{testResult}</p>
            )}
          </div>
        </div>

        {/* Default Settings */}
        <div className="bg-white rounded-2xl border border-border/60 mb-5 overflow-hidden shadow-md">
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
                  className="w-full border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] hover:border-navy-200 transition-all duration-200"
                  placeholder="شركة المستقبل للتقنية"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-text-secondary block mb-2">معد التقرير الافتراضي</label>
                <input
                  value={settings.defaultAuthor}
                  onChange={(e) => setSettings({ ...settings, defaultAuthor: e.target.value })}
                  className="w-full border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_rgba(26,58,124,0.1)] hover:border-navy-200 transition-all duration-200"
                  placeholder="إدارة أمن المعلومات"
                />
              </div>
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
