import type { ReportData } from '@/types/report';
import type { AnalyticsQueryOptions, AnalyticsResponse } from '@/types/analytics';
import type { AppSettings } from '@/types/report';

// isoControls is stored as a JSON string in SQLite; parse it back to an array on every read.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseReport(raw: any): ReportData {
  return {
    ...raw,
    isoControls: typeof raw.isoControls === 'string'
      ? JSON.parse(raw.isoControls || '[]')
      : (raw.isoControls ?? []),
  };
}

export async function fetchReports(): Promise<ReportData[]> {
  const res = await fetch('/api/reports', { cache: 'no-store' });
  if (!res.ok) throw new Error('فشل في تحميل التقارير');
  return (await res.json()).map(parseReport);
}

export async function fetchReport(id: string): Promise<ReportData> {
  const res = await fetch(`/api/reports/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('فشل في تحميل التقرير');
  return parseReport(await res.json());
}

export async function createReport(): Promise<ReportData> {
  const res = await fetch('/api/reports', { method: 'POST' });
  if (!res.ok) throw new Error('فشل في إنشاء التقرير');
  return parseReport(await res.json());
}

export async function updateReport(id: string, data: Partial<ReportData>): Promise<ReportData> {
  const res = await fetch(`/api/reports/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في حفظ التقرير');
  return parseReport(await res.json());
}

export async function deleteReport(id: string): Promise<void> {
  const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف التقرير');
}

export async function duplicateReport(id: string): Promise<ReportData> {
  const res = await fetch(`/api/reports/${id}/duplicate`, { method: 'POST' });
  if (!res.ok) throw new Error('فشل في نسخ التقرير');
  return parseReport(await res.json());
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('فشل في تحميل الإعدادات');
  return res.json();
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في حفظ الإعدادات');
  return res.json();
}

export async function testAIConnection(data: Pick<AppSettings, 'aiProvider' | 'aiModel' | 'geminiApiKey' | 'nvidiaApiKey'>) {
  const res = await fetch('/api/settings/test-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const payload = await res.json().catch(() => ({} as { ok?: boolean; error?: string; message?: string }));
  if (!res.ok || !payload.ok) {
    throw new Error(payload.error || 'فشل اختبار الاتصال');
  }

  return payload;
}

export async function aiReview(reportId: string, reviewType: string, reportData: Partial<ReportData>) {
  const res = await fetch('/api/ai/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId, reviewType, reportData }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال بالذكاء الاصطناعي' }));
    throw new Error(err.error || 'خطأ غير معروف');
  }
  return res.json();
}

export async function aiFollowUp(reportId: string, question: string, history: Array<{ role: string; content: string }>) {
  const res = await fetch('/api/ai/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId, followUp: true, question, history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'خطأ' }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function fetchAnalytics(options: AnalyticsQueryOptions = {}): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  if (typeof options.limit === 'number') params.set('limit', String(options.limit));
  if (options.groupBy && options.groupBy !== 'none') params.set('groupBy', options.groupBy);
  if (options.riskSeverity) params.set('riskSeverity', options.riskSeverity);
  if (options.riskStatus) params.set('riskStatus', options.riskStatus);
  if (options.reportId) params.set('reportId', options.reportId);

  const query = params.toString();
  const res = await fetch(`/api/analytics${query ? `?${query}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('فشل في تحميل بيانات التحليلات');
  return res.json();
}
