'use client';

import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AIConversationHistoryItem, AIMessage, ReportData, ReviewType } from '@/types/report';
import { aiReview, aiFollowUp, fetchAIHistory } from '@/lib/api';

interface Props {
  report: ReportData;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIReviewModal({ report, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<AIMessage[]>([]);
  const [conversations, setConversations] = useState<AIConversationHistoryItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [followUpQ, setFollowUpQ] = useState('');
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  const reviewButtons: Array<{ type: ReviewType; icon: string; label: string }> = useMemo(
    () => [
      { type: 'full', icon: '🔍', label: 'مراجعة شاملة' },
      { type: 'exec', icon: '👔', label: 'منظور الإدارة' },
      { type: 'board', icon: '🏛️', label: 'مجلس الإدارة' },
      { type: 'risk', icon: '⚠️', label: 'تحليل المخاطر' },
      { type: 'gaps', icon: '🕳️', label: 'الثغرات المفقودة' },
    ],
    []
  );

  const quickPrompts = useMemo(
    () => [
      'ما أهم 3 مخاطر يجب البدء بها اليوم؟',
      'اقترح خطة تنفيذ لمدة 30 يوما.',
      'كيف أشرح هذا الملخص للإدارة العليا؟',
    ],
    []
  );

  const loadHistory = useCallback(async (preferredConversationId?: string | null) => {
    setLoadingHistory(true);
    try {
      const items = await fetchAIHistory(report.id);
      setConversations(items);

      const selectedId = preferredConversationId ?? null;
      if (selectedId) {
        const selected = items.find((item) => item.id === selectedId);
        if (selected) {
          setActiveConversationId(selected.id);
          setHistory(selected.messages || []);
        }
      }
    } catch {
      // History loading is best-effort to keep the chat usable.
    } finally {
      setLoadingHistory(false);
    }
  }, [report.id]);

  useEffect(() => {
    if (!isOpen) return;

    void loadHistory(null);
  }, [isOpen, loadHistory]);

  if (!isOpen) return null;

  async function handleReview(type: ReviewType) {
    setLoading(true);
    setError('');
    setCopyStatus('');
    try {
      const result = await aiReview(report.id, type, report);
      setHistory(result.messages || []);
      setActiveConversationId(result.conversationId ?? null);
      await loadHistory(result.conversationId ?? null);
    } catch (e: unknown) {
      setError((e as Error).message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowUp() {
    if (!followUpQ.trim() || !history.length) return;
    const q = followUpQ.trim();
    setFollowUpQ('');
    setLoading(true);
    setError('');
    setCopyStatus('');
    try {
      const result = await aiFollowUp(report.id, q, history, activeConversationId);
      setHistory(result.messages || []);
      setActiveConversationId(result.conversationId ?? activeConversationId);
      await loadHistory(result.conversationId ?? activeConversationId);
    } catch (e: unknown) {
      setError((e as Error).message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setHistory([]);
    setActiveConversationId(null);
    setFollowUpQ('');
    setError('');
    setCopyStatus('');
  }

  function selectConversation(item: AIConversationHistoryItem) {
    setActiveConversationId(item.id);
    setHistory(item.messages || []);
    setError('');
    setCopyStatus('');
  }

  async function copyLatestAssistantMessage() {
    const latestAssistant = [...history].reverse().find((message) => message.role === 'assistant');
    if (!latestAssistant?.content) return;

    try {
      await navigator.clipboard.writeText(latestAssistant.content);
      setCopyStatus('تم نسخ آخر رد');
      window.setTimeout(() => setCopyStatus(''), 1400);
    } catch {
      setCopyStatus('تعذر النسخ');
      window.setTimeout(() => setCopyStatus(''), 1400);
    }
  }

  function reviewTypeLabel(type: string): string {
    const match = reviewButtons.find((item) => item.type === type);
    if (match) return match.label;
    return type === 'followup' ? 'متابعة' : type;
  }

  function messagePreview(text: string): string {
    return text.replace(/^مراجعة:\s*/, '').slice(0, 85) || 'بدون نص';
  }

  function renderInlineMarkdown(text: string): ReactNode {
    const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

    return tokens.map((token, index) => {
      if (token.startsWith('`') && token.endsWith('`')) {
        return (
          <code key={`code-${index}`} className="bg-purple-50 px-1.5 py-0.5 rounded text-xs text-purple-900">
            {token.slice(1, -1)}
          </code>
        );
      }

      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={`strong-${index}`} className="text-navy-950">
            {token.slice(2, -2)}
          </strong>
        );
      }

      return <Fragment key={`text-${index}`}>{token}</Fragment>;
    });
  }

  function renderMarkdown(text: string): ReactNode {
    const lines = text.split('\n');
    const blocks: ReactNode[] = [];

    lines.forEach((rawLine, index) => {
      const line = rawLine.trimEnd();
      const heading2 = line.match(/^##\s+(.+)$/);
      const heading3 = line.match(/^###\s+(.+)$/);
      const bullet = line.match(/^-\s+(.+)$/);
      const numbered = line.match(/^\d+\.\s+(.+)$/);

      if (!line.trim()) {
        blocks.push(<div key={`space-${index}`} className="h-2" />);
        return;
      }

      if (heading2) {
        blocks.push(
          <h3
            key={`h2-${index}`}
            className="text-base font-extrabold text-purple-900 mt-4 mb-2 pb-1.5 border-b-2 border-purple-200"
          >
            {renderInlineMarkdown(heading2[1])}
          </h3>
        );
        return;
      }

      if (heading3) {
        blocks.push(
          <h4 key={`h3-${index}`} className="text-sm font-extrabold text-navy-950 mt-3 mb-1.5">
            {renderInlineMarkdown(heading3[1])}
          </h4>
        );
        return;
      }

      if (bullet) {
        blocks.push(
          <div key={`bullet-${index}`} className="flex gap-2 my-1 text-sm">
            <span className="text-purple-900 flex-shrink-0">•</span>
            <span>{renderInlineMarkdown(bullet[1])}</span>
          </div>
        );
        return;
      }

      if (numbered) {
        blocks.push(
          <div key={`numbered-${index}`} className="flex gap-2 my-1 text-sm">
            <span className="text-purple-900 font-extrabold flex-shrink-0">›</span>
            <span>{renderInlineMarkdown(numbered[1])}</span>
          </div>
        );
        return;
      }

      blocks.push(
        <p key={`p-${index}`} className="my-1 text-sm">
          {renderInlineMarkdown(line)}
        </p>
      );
    });

    return <>{blocks}</>;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[1050px] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_25px_65px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#1a237e] to-[#4a148c] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h3 className="text-lg font-[800]">المراجعة الذكية – AI</h3>
              <p className="text-xs opacity-60 mt-0.5">دردشة تحليلية مع سجل كامل للمحادثات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="bg-white/15 border-none text-white rounded-xl cursor-pointer text-xs px-3 py-1.5 hover:bg-white/25 transition-colors"
            >
              + محادثة جديدة
            </button>
            <button
              onClick={() => { void loadHistory(activeConversationId); }}
              className="bg-white/15 border-none text-white rounded-xl cursor-pointer text-xs px-3 py-1.5 hover:bg-white/25 transition-colors"
            >
              تحديث السجل
            </button>
            <button
              onClick={onClose}
              className="bg-white/15 border-none text-white w-8 h-8 rounded-full cursor-pointer text-base leading-none hover:bg-white/25 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Review types */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex gap-2.5 flex-wrap">
          {reviewButtons.map((btn) => (
            <button
              key={btn.type}
              onClick={() => handleReview(btn.type)}
              disabled={loading}
              className="bg-white border-[1.5px] border-border rounded-xl px-4 py-2.5 cursor-pointer text-sm font-bold text-navy-800 transition-all duration-200 hover:bg-navy-100 hover:border-navy-600 hover:shadow-sm disabled:opacity-50"
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 min-h-0">
          {/* History sidebar */}
          <aside className="w-[300px] border-l border-gray-200 bg-gray-50 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-extrabold text-navy-900">سجل المحادثات</h4>
              {loadingHistory ? <span className="text-xs text-gray-500">جاري التحميل...</span> : null}
            </div>

            {!loadingHistory && !conversations.length ? (
              <p className="text-xs text-gray-500 leading-6">لا توجد محادثات محفوظة لهذا التقرير بعد.</p>
            ) : null}

            <div className="space-y-2">
              {conversations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectConversation(item)}
                  className={`w-full text-right rounded-xl border px-3 py-2.5 transition-all ${
                    activeConversationId === item.id
                      ? 'border-purple-500 bg-purple-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-purple-900">{reviewTypeLabel(item.reviewType)}</span>
                    <span className="text-[10px] text-gray-500">{item.messageCount} رسالة</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-700 leading-5">{messagePreview(item.lastUserMessage)}</p>
                  <p className="mt-1 text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleString('ar-SA')}</p>
                </button>
              ))}
            </div>
          </aside>

          {/* Response area */}
          <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-[1.9] text-text-primary">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-4xl animate-spin inline-block">⚙️</div>
                <p className="text-purple-900 mt-3 font-bold text-base">AI يحلل البيانات...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-danger-500">
                <div className="text-3xl">⚠️</div>
                <p className="mt-2 text-base">{error}</p>
              </div>
            ) : history.length ? (
              <div className="space-y-3">
                {history.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                    <div
                      className={
                        message.role === 'user'
                          ? 'inline-block max-w-[90%] rounded-2xl bg-navy-900 text-white px-4 py-2.5 text-sm'
                          : 'inline-block max-w-[95%] rounded-2xl bg-purple-50 border border-purple-100 px-4 py-3 text-sm text-gray-800'
                      }
                    >
                      {message.role === 'assistant'
                        ? <div>{renderMarkdown(message.content)}</div>
                        : <span>{message.content}</span>}
                    </div>
                  </div>
                ))}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={copyLatestAssistantMessage}
                    className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 hover:border-purple-400"
                  >
                    نسخ آخر رد
                  </button>
                  {copyStatus ? <span className="text-xs text-gray-500">{copyStatus}</span> : null}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <div className="text-4xl mb-3">🤖</div>
                <p className="text-base">اختر نوع المراجعة للبدء أو افتح محادثة من السجل</p>
              </div>
            )}
          </div>
        </div>

        {/* Follow-up input */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2 flex-wrap mb-2.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setFollowUpQ(prompt)}
                disabled={loading || !history.length}
                className="text-xs bg-white border border-gray-300 rounded-full px-3 py-1.5 hover:border-purple-400 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5">
            <input
              value={followUpQ}
              onChange={(e) => setFollowUpQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFollowUp(); }}
              placeholder={history.length ? 'سؤال متابع...' : 'ابدأ مراجعة أولا ثم أضف أسئلتك'}
              className="flex-1 border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-purple-700 focus:shadow-[0_0_0_3px_rgba(107,33,168,0.1)] hover:border-purple-200 transition-all duration-200"
            />
            <button
              onClick={handleFollowUp}
              disabled={loading || !followUpQ.trim() || !history.length}
              className="bg-gradient-to-l from-purple-800 to-purple-900 text-white border-none rounded-xl py-2.5 px-5 cursor-pointer text-sm font-bold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all duration-200 shadow-sm"
            >
              إرسال
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
