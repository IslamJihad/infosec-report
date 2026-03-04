'use client';

import { useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '@/lib/api';
import Link from 'next/link';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    aiApiKey: '',
    aiModel: 'sonar',
    defaultOrgName: '',
    defaultAuthor: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSettings();
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
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.aiApiKey}`,
        },
        body: JSON.stringify({
          model: settings.aiModel || 'sonar',
          messages: [{ role: 'user', content: 'مرحباً، أجب بكلمة واحدة: تجربة' }],
          max_tokens: 20,
        }),
      });
      if (res.ok) {
        setTestResult('✅ الاتصال ناجح! API يعمل بشكل صحيح.');
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
    <div className="min-h-screen bg-gradient-to-br from-[#e8edf4] to-[#d0dae8]">
      {/* Header */}
      <header className="bg-navy-950 text-white">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h1 className="text-base font-[900]">إعدادات النظام</h1>
              <p className="text-[9px] opacity-50">ضبط الذكاء الاصطناعي والإعدادات الافتراضية</p>
            </div>
          </div>
          <Link href="/" className="text-white/60 hover:text-white transition-colors text-[11px] no-underline">
            → الرجوع للوحة
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* AI Settings */}
        <div className="bg-white rounded-lg border border-border mb-4 overflow-hidden shadow-sm">
          <div className="bg-purple-900 text-white px-4 py-2.5 text-[12px] font-bold flex items-center gap-2">
            🤖 إعدادات الذكاء الاصطناعي (Perplexity AI)
          </div>
          <div className="p-4">
            <div className="mb-3">
              <label className="text-[10px] font-bold text-text-secondary block mb-1">مفتاح API – Perplexity</label>
              <div className="flex gap-2">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.aiApiKey}
                  onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                  className="flex-1 border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-purple-900"
                  placeholder="pplx-..."
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="bg-gray-100 border-none rounded-md px-3 text-[10px] cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-[9px] text-text-hint mt-1">
                احصل على مفتاح API من{' '}
                <a href="https://www.perplexity.ai/settings/api" target="_blank" className="text-purple-900 underline">perplexity.ai/settings/api</a>
              </p>
            </div>

            <div className="mb-3">
              <label className="text-[10px] font-bold text-text-secondary block mb-1">النموذج</label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
                className="border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-purple-900 bg-white w-full"
              >
                <option value="sonar">Sonar (سريع + بحث)</option>
                <option value="sonar-pro">Sonar Pro (متقدم)</option>
                <option value="sonar-reasoning">Sonar Reasoning (تفكير عميق)</option>
                <option value="sonar-reasoning-pro">Sonar Reasoning Pro (الأفضل)</option>
              </select>
            </div>

            <button
              onClick={handleTestConnection}
              className="bg-purple-100 text-purple-900 border border-purple-300 rounded-md px-3.5 py-1.5 text-[10px] font-[Cairo] font-bold cursor-pointer hover:bg-purple-200 transition-colors"
            >
              🔌 اختبار الاتصال
            </button>
            {testResult && (
              <p className="text-[10px] mt-2 p-2 rounded bg-gray-50 border border-border">{testResult}</p>
            )}
          </div>
        </div>

        {/* Default Settings */}
        <div className="bg-white rounded-lg border border-border mb-4 overflow-hidden shadow-sm">
          <div className="bg-navy-800 text-white px-4 py-2.5 text-[12px] font-bold flex items-center gap-2">
            🏢 الإعدادات الافتراضية
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-text-secondary block mb-1">اسم المنظمة الافتراضي</label>
                <input
                  value={settings.defaultOrgName}
                  onChange={(e) => setSettings({ ...settings, defaultOrgName: e.target.value })}
                  className="w-full border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-navy-800"
                  placeholder="شركة المستقبل للتقنية"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-text-secondary block mb-1">معد التقرير الافتراضي</label>
                <input
                  value={settings.defaultAuthor}
                  onChange={(e) => setSettings({ ...settings, defaultAuthor: e.target.value })}
                  className="w-full border-[1.5px] border-border rounded-[7px] py-[7px] px-2.5 font-[Cairo] text-[11px] outline-none focus:border-navy-800"
                  placeholder="إدارة أمن المعلومات"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-navy-800 text-white border-none rounded-lg px-6 py-2.5 text-[12px] font-[Cairo] font-bold hover:bg-navy-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
          </button>
          {saved && (
            <span className="text-success-700 text-[11px] font-bold animate-fadeIn">✅ تم الحفظ بنجاح</span>
          )}
        </div>
      </div>
    </div>
  );
}
