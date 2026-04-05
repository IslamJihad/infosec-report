import type {
  AIReviewRecommendation,
  AIConversationHistoryItem,
  AIMessage,
  AIReviewResponse,
  AppSettings,
  ReportData,
  ResponseLength,
  ReviewType,
  SPSDomain,
} from '@/types/report';
import { DEFAULT_SPS_DOMAINS } from '@/lib/constants';
import type {
  AnalyticsAISummaryRequest,
  AnalyticsAISummaryResponse,
  AnalyticsQueryOptions,
  AnalyticsResponse,
} from '@/types/analytics';

// isoControls and spsDomainsJson are stored as JSON strings in SQLite; parse them on every read.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseReport(raw: any): ReportData {
  let isoControls = raw.isoControls ?? [];
  if (typeof raw.isoControls === 'string') {
    try {
      isoControls = JSON.parse(raw.isoControls || '[]');
    } catch {
      console.error('Failed to parse isoControls payload. Falling back to an empty array.');
      isoControls = [];
    }
  }

  let spsDomains: SPSDomain[] = DEFAULT_SPS_DOMAINS;
  if (typeof raw.spsDomainsJson === 'string' && raw.spsDomainsJson !== '[]' && raw.spsDomainsJson.trim() !== '') {
    try {
      const parsed = JSON.parse(raw.spsDomainsJson);
      if (Array.isArray(parsed) && parsed.length > 0) spsDomains = parsed as SPSDomain[];
    } catch {
      console.error('Failed to parse spsDomainsJson. Falling back to defaults.');
    }
  }

  return {
    ...raw,
    isoControls: Array.isArray(isoControls) ? isoControls : [],
    spsDomains,
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

  const payload = await res.json().catch(() => null as { error?: string; detail?: string } | null);

  if (!res.ok) {
    const message = payload?.error || 'فشل في حفظ التقرير';
    const detail = payload?.detail;
    throw new Error(detail ? `${message}: ${detail}` : message);
  }

  return parseReport(payload);
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

export async function aiReview(
  reportId: string,
  reviewType: ReviewType,
  reportData: Partial<ReportData>,
  options: { responseLength?: ResponseLength } = {}
): Promise<AIReviewResponse> {
  const res = await fetch('/api/ai/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId, reviewType, reportData, responseLength: options.responseLength }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال بالذكاء الاصطناعي' }));
    throw new Error(err.error || 'خطأ غير معروف');
  }
  return res.json();
}

export async function aiFollowUp(
  reportId: string,
  question: string,
  history: AIMessage[],
  conversationId?: string | null,
  options: { responseLength?: ResponseLength } = {}
): Promise<AIReviewResponse> {
  const res = await fetch('/api/ai/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId,
      followUp: true,
      question,
      history,
      conversationId,
      responseLength: options.responseLength,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'خطأ' }));
    throw new Error(err.error);
  }
  return res.json();
}

export type AIReviewStreamEvent =
  | { type: 'chunk'; chunk: string }
  | { type: 'done'; payload: AIReviewResponse }
  | { type: 'error'; error: string };

async function* parseReviewStream(response: Response): AsyncGenerator<AIReviewStreamEvent> {
  if (!response.body) {
    throw new Error('رد البث لا يحتوي على بيانات.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const parsed = JSON.parse(line) as {
          type?: string;
          chunk?: string;
          error?: string;
          content?: string;
          messages?: AIMessage[];
          conversationId?: string | null;
          suggestions?: string[];
        };

        if (parsed.type === 'chunk' && typeof parsed.chunk === 'string') {
          yield { type: 'chunk', chunk: parsed.chunk };
          continue;
        }

        if (parsed.type === 'error') {
          yield { type: 'error', error: parsed.error || 'حدث خطأ أثناء البث.' };
          continue;
        }

        if (parsed.type === 'done') {
          yield {
            type: 'done',
            payload: {
              content: typeof parsed.content === 'string' ? parsed.content : '',
              messages: Array.isArray(parsed.messages) ? parsed.messages : [],
              conversationId: typeof parsed.conversationId === 'string' || parsed.conversationId === null
                ? parsed.conversationId
                : null,
              suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : undefined,
            },
          };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* aiReviewStream(
  reportId: string,
  reviewType: ReviewType,
  reportData: Partial<ReportData>,
  options: { responseLength?: ResponseLength } = {}
): AsyncGenerator<AIReviewStreamEvent> {
  const res = await fetch('/api/ai/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId,
      reviewType,
      reportData,
      responseLength: options.responseLength,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال بالذكاء الاصطناعي' }));
    throw new Error(err.error || 'خطأ غير معروف');
  }

  yield* parseReviewStream(res);
}

export async function* aiFollowUpStream(
  reportId: string,
  question: string,
  history: AIMessage[],
  conversationId?: string | null,
  options: { responseLength?: ResponseLength } = {}
): AsyncGenerator<AIReviewStreamEvent> {
  const res = await fetch('/api/ai/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId,
      followUp: true,
      question,
      history,
      conversationId,
      responseLength: options.responseLength,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال بالذكاء الاصطناعي' }));
    throw new Error(err.error || 'خطأ غير معروف');
  }

  yield* parseReviewStream(res);
}

export async function getReviewRecommendation(
  reportId: string,
  reportData: Partial<ReportData>
): Promise<AIReviewRecommendation> {
  const res = await fetch('/api/ai/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportId,
      reportData,
      action: 'recommend',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'فشل جلب التوصية الذكية' }));
    throw new Error(err.error || 'فشل جلب التوصية الذكية');
  }

  return res.json();
}

export async function fetchAIHistory(reportId: string): Promise<AIConversationHistoryItem[]> {
  const res = await fetch(`/api/ai/history?reportId=${encodeURIComponent(reportId)}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'فشل في جلب سجل المحادثات' }));
    throw new Error(err.error || 'فشل في جلب سجل المحادثات');
  }

  const payload = await res.json();
  return Array.isArray(payload.conversations) ? payload.conversations : [];
}

export async function renameAIConversation(id: string, title: string): Promise<AIConversationHistoryItem> {
  const res = await fetch('/api/ai/history', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'فشل تحديث عنوان المحادثة' }));
    throw new Error(err.error || 'فشل تحديث عنوان المحادثة');
  }

  const payload = await res.json();
  if (!payload?.conversation) {
    throw new Error('تعذر قراءة بيانات المحادثة بعد التحديث');
  }

  return payload.conversation as AIConversationHistoryItem;
}

export async function togglePinAIConversation(id: string, pinned: boolean): Promise<AIConversationHistoryItem> {
  const res = await fetch('/api/ai/history', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, pinned }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'فشل تحديث حالة التثبيت' }));
    throw new Error(err.error || 'فشل تحديث حالة التثبيت');
  }

  const payload = await res.json();
  if (!payload?.conversation) {
    throw new Error('تعذر قراءة بيانات المحادثة بعد التحديث');
  }

  return payload.conversation as AIConversationHistoryItem;
}

export async function deleteAIConversation(id: string): Promise<void> {
  const res = await fetch(`/api/ai/history?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'فشل حذف المحادثة' }));
    throw new Error(err.error || 'فشل حذف المحادثة');
  }
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

export async function generateAnalyticsSummary(
  payload: AnalyticsAISummaryRequest
): Promise<AnalyticsAISummaryResponse> {
  const res = await fetch('/api/ai/analytics-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'فشل توليد الملخص الذكي' }));
    throw new Error(err.error || 'فشل توليد الملخص الذكي');
  }

  return res.json();
}
