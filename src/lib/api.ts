import type { ReportData } from '@/types/report';

export async function fetchReports(): Promise<ReportData[]> {
  const res = await fetch('/api/reports', { cache: 'no-store' });
  if (!res.ok) throw new Error('فشل في تحميل التقارير');
  return res.json();
}

export async function fetchReport(id: string): Promise<ReportData> {
  const res = await fetch(`/api/reports/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('فشل في تحميل التقرير');
  return res.json();
}

export async function createReport(): Promise<ReportData> {
  const res = await fetch('/api/reports', { method: 'POST' });
  if (!res.ok) throw new Error('فشل في إنشاء التقرير');
  return res.json();
}

export async function updateReport(id: string, data: Partial<ReportData>): Promise<ReportData> {
  const res = await fetch(`/api/reports/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في حفظ التقرير');
  return res.json();
}

export async function deleteReport(id: string): Promise<void> {
  const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف التقرير');
}

export async function duplicateReport(id: string): Promise<ReportData> {
  const res = await fetch(`/api/reports/${id}/duplicate`, { method: 'POST' });
  if (!res.ok) throw new Error('فشل في نسخ التقرير');
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('فشل في تحميل الإعدادات');
  return res.json();
}

export async function updateSettings(data: Record<string, string>) {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في حفظ الإعدادات');
  return res.json();
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
