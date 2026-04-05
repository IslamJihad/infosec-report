'use client';

import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  AIConversationHistoryItem,
  AIMessage,
  AIReviewRecommendation,
  AIReviewResponse,
  ReportData,
  ResponseLength,
  ReviewType,
} from '@/types/report';
import {
  aiFollowUpStream,
  aiReview,
  aiReviewStream,
  aiFollowUp,
  deleteAIConversation,
  fetchAIHistory,
  getReviewRecommendation,
  renameAIConversation,
  togglePinAIConversation,
} from '@/lib/api';

interface Props {
  report: ReportData;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SUGGESTIONS = [
  'ما أهم 3 مخاطر يجب البدء بها اليوم؟',
  'اقترح خطة تنفيذ لمدة 30 يوما.',
  'كيف أشرح هذا الملخص للإدارة العليا؟',
];

function sortConversations(items: AIConversationHistoryItem[]): AIConversationHistoryItem[] {
  return [...items].sort((a, b) => {
    const pinDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
    if (pinDiff !== 0) return pinDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function AIReviewModal({ report, isOpen, onClose }: Props) {
  const MAX_FOLLOW_UP_CHARS = 1200;
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasFirstToken, setHasFirstToken] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<AIMessage[]>([]);
  const [conversations, setConversations] = useState<AIConversationHistoryItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [followUpQ, setFollowUpQ] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [responseLength, setResponseLength] = useState<ResponseLength>('standard');
  const [recommendation, setRecommendation] = useState<AIReviewRecommendation | null>(null);
  const [dismissedRecommendation, setDismissedRecommendation] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [error, setError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<{ key: string; status: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | ReviewType>('all');
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [deleteConfirmConversationId, setDeleteConfirmConversationId] = useState<string | null>(null);
  const [historyActionId, setHistoryActionId] = useState<string | null>(null);

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

  const responseLengthOptions = useMemo(
    () => [
      { value: 'brief' as const, label: 'مختصر' },
      { value: 'standard' as const, label: 'عادي' },
      { value: 'detailed' as const, label: 'مفصل' },
    ],
    []
  );

  const reviewFilters = useMemo(
    () => [
      { value: 'all' as const, label: 'الكل' },
      { value: 'full' as const, label: 'شامل' },
      { value: 'exec' as const, label: 'تنفيذي' },
      { value: 'board' as const, label: 'مجلس' },
      { value: 'risk' as const, label: 'مخاطر' },
      { value: 'gaps' as const, label: 'ثغرات' },
    ],
    []
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return conversations.filter((item) => {
      const matchesType = reviewFilter === 'all' || item.reviewType === reviewFilter;
      if (!matchesType) return false;
      if (!query) return true;

      return [
        item.lastUserMessage,
        item.reviewType,
        item.title ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [conversations, reviewFilter, searchQuery]);

  const pinnedConversations = useMemo(
    () => filteredConversations.filter((item) => Boolean(item.pinned)),
    [filteredConversations]
  );

  const unpinnedConversations = useMemo(
    () => filteredConversations.filter((item) => !item.pinned),
    [filteredConversations]
  );

  const loadHistory = useCallback(async (preferredConversationId?: string | null) => {
    setLoadingHistory(true);
    try {
      const items = await fetchAIHistory(report.id);
      const sortedItems = sortConversations(items);
      setConversations(sortedItems);

      const selectedId = preferredConversationId ?? null;
      if (selectedId) {
        const selected = sortedItems.find((item) => item.id === selectedId);
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

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoadingRecommendation(true);
    setDismissedRecommendation(false);

    void (async () => {
      try {
        const recommended = await getReviewRecommendation(report.id, report);
        if (!cancelled) {
          setRecommendation(recommended);
        }
      } catch {
        if (!cancelled) {
          setRecommendation(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingRecommendation(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, report, report.id]);

  if (!isOpen) return null;

  function normalizeSuggestions(nextSuggestions?: string[]): string[] {
    if (!nextSuggestions || !nextSuggestions.length) {
      return [...DEFAULT_SUGGESTIONS];
    }

    return nextSuggestions.slice(0, 3);
  }

  async function consumeStreamingReview(
    stream: AsyncGenerator<{ type: 'chunk'; chunk: string } | { type: 'done'; payload: AIReviewResponse } | { type: 'error'; error: string }>
  ): Promise<AIReviewResponse> {
    let finalPayload: AIReviewResponse | null = null;

    for await (const event of stream) {
      if (event.type === 'chunk') {
        setHasFirstToken(true);
        setLoading(false);
        setStreamingContent((prev) => prev + event.chunk);
        continue;
      }

      if (event.type === 'error') {
        throw new Error(event.error || 'تعذر إكمال البث.');
      }

      if (event.type === 'done') {
        finalPayload = event.payload;
      }
    }

    if (!finalPayload) {
      throw new Error('تعذر إكمال البث من مزود الذكاء الاصطناعي.');
    }

    return finalPayload;
  }

  async function applyReviewResult(result: AIReviewResponse, fallbackConversationId?: string | null) {
    setHistory(result.messages || []);
    const nextConversationId = result.conversationId ?? fallbackConversationId ?? null;
    setActiveConversationId(nextConversationId);
    setSuggestions(normalizeSuggestions(result.suggestions));
    await loadHistory(nextConversationId);
  }

  async function handleReview(type: ReviewType) {
    setLoading(true);
    setIsStreaming(true);
    setHasFirstToken(false);
    setStreamingContent('');
    setError('');
    setCopyFeedback(null);
    try {
      let result: AIReviewResponse;

      try {
        result = await consumeStreamingReview(
          aiReviewStream(report.id, type, report, { responseLength })
        );
      } catch {
        // Fallback to non-streaming for environments where stream parsing is unavailable.
        result = await aiReview(report.id, type, report, { responseLength });
      }

      await applyReviewResult(result, null);
      setDismissedRecommendation(true);
    } catch (e: unknown) {
      setError((e as Error).message || 'حدث خطأ');
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setHasFirstToken(false);
      setStreamingContent('');
    }
  }

  async function handleFollowUp() {
    if (!followUpQ.trim() || !history.length) return;
    const q = followUpQ.trim();
    const historyBeforeSend = [...history];
    const pendingUserMessage: AIMessage = {
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };

    setHistory((prev) => [...prev, pendingUserMessage]);
    setFollowUpQ('');
    setLoading(true);
    setIsStreaming(true);
    setHasFirstToken(false);
    setStreamingContent('');
    setError('');
    setCopyFeedback(null);
    try {
      let result: AIReviewResponse;

      try {
        result = await consumeStreamingReview(
          aiFollowUpStream(report.id, q, historyBeforeSend, activeConversationId, { responseLength })
        );
      } catch {
        // Fallback to non-streaming for environments where stream parsing is unavailable.
        result = await aiFollowUp(report.id, q, historyBeforeSend, activeConversationId, { responseLength });
      }

      await applyReviewResult(result, activeConversationId);
    } catch (e: unknown) {
      setError((e as Error).message || 'حدث خطأ');
      setHistory(historyBeforeSend);
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setHasFirstToken(false);
      setStreamingContent('');
    }
  }

  function startNewChat() {
    setHistory([]);
    setActiveConversationId(null);
    setFollowUpQ('');
    setError('');
    setCopyFeedback(null);
    setSuggestions([...DEFAULT_SUGGESTIONS]);
    setIsStreaming(false);
    setHasFirstToken(false);
    setStreamingContent('');
    setMenuConversationId(null);
    setRenamingConversationId(null);
    setDeleteConfirmConversationId(null);
  }

  function selectConversation(item: AIConversationHistoryItem) {
    setActiveConversationId(item.id);
    setHistory(item.messages || []);
    setError('');
    setCopyFeedback(null);
    setSuggestions([...DEFAULT_SUGGESTIONS]);
    setIsStreaming(false);
    setHasFirstToken(false);
    setStreamingContent('');
    setMenuConversationId(null);
    setDeleteConfirmConversationId(null);
  }

  async function handleTogglePin(item: AIConversationHistoryItem) {
    setHistoryActionId(item.id);
    setError('');

    try {
      const updated = await togglePinAIConversation(item.id, !Boolean(item.pinned));
      setConversations((prev) => sortConversations(prev.map((conversation) => (
        conversation.id === item.id
          ? {
            ...conversation,
            pinned: updated.pinned,
            title: updated.title,
          }
          : conversation
      ))));
    } catch (e: unknown) {
      setError((e as Error).message || 'فشل تحديث حالة التثبيت');
    } finally {
      setHistoryActionId(null);
    }
  }

  function startRename(item: AIConversationHistoryItem) {
    setRenamingConversationId(item.id);
    setRenameDraft(item.title ?? '');
    setMenuConversationId(null);
    setDeleteConfirmConversationId(null);
  }

  async function submitRename(conversationId: string) {
    setHistoryActionId(conversationId);
    setError('');

    try {
      const updated = await renameAIConversation(conversationId, renameDraft);
      setConversations((prev) => sortConversations(prev.map((conversation) => (
        conversation.id === conversationId
          ? {
            ...conversation,
            title: updated.title,
          }
          : conversation
      ))));
      setRenamingConversationId(null);
      setRenameDraft('');
    } catch (e: unknown) {
      setError((e as Error).message || 'فشل تحديث عنوان المحادثة');
    } finally {
      setHistoryActionId(null);
    }
  }

  async function handleDeleteConversation(conversationId: string) {
    setHistoryActionId(conversationId);
    setError('');

    try {
      await deleteAIConversation(conversationId);
      setConversations((prev) => prev.filter((item) => item.id !== conversationId));
      setDeleteConfirmConversationId(null);
      setMenuConversationId(null);

      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setHistory([]);
      }
    } catch (e: unknown) {
      setError((e as Error).message || 'فشل حذف المحادثة');
    } finally {
      setHistoryActionId(null);
    }
  }

  async function copyAssistantMessage(key: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopyFeedback({ key, status: 'success' });
      window.setTimeout(() => setCopyFeedback((prev) => (prev?.key === key ? null : prev)), 2000);
    } catch {
      setCopyFeedback({ key, status: 'error' });
      window.setTimeout(() => setCopyFeedback((prev) => (prev?.key === key ? null : prev)), 2000);
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

  function conversationTitle(item: AIConversationHistoryItem): string {
    if (item.title?.trim()) return item.title.trim();
    return `${reviewTypeLabel(item.reviewType)} - ${new Date(item.createdAt).toLocaleDateString('ar-SA')}`;
  }

  function finalizeRename(item: AIConversationHistoryItem) {
    if (renamingConversationId !== item.id) return;

    const draft = renameDraft.trim();
    const currentTitle = item.title?.trim() ?? '';

    if (draft === currentTitle) {
      setRenamingConversationId(null);
      setRenameDraft('');
      return;
    }

    void submitRename(item.id);
  }

  function renderConversationCard(item: AIConversationHistoryItem): ReactNode {
    const isActive = activeConversationId === item.id;
    const isBusy = historyActionId === item.id;

    return (
      <div
        key={item.id}
        className={`w-full text-right rounded-xl border px-3 py-2.5 transition-all ${
          isActive
            ? 'border-purple-500 bg-purple-50 shadow-sm'
            : 'border-gray-200 bg-white hover:border-purple-300'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => selectConversation(item)}
            className="flex-1 text-right"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-purple-900">{conversationTitle(item)}</span>
              <span className="text-[10px] text-gray-500">{item.messageCount} رسالة</span>
            </div>
            <p className="mt-1 text-[10px] text-purple-700">{reviewTypeLabel(item.reviewType)}</p>
          </button>

          <div className="relative flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                void handleTogglePin(item);
              }}
              disabled={isBusy}
              className={`text-xs rounded-md px-1.5 py-1 border ${
                item.pinned
                  ? 'text-amber-500 border-amber-300 bg-amber-50'
                  : 'text-gray-400 border-gray-300 bg-white'
              }`}
              title={item.pinned ? 'إلغاء التثبيت' : 'تثبيت'}
            >
              {item.pinned ? '⭐' : '☆'}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuConversationId((prev) => (prev === item.id ? null : item.id));
                setDeleteConfirmConversationId(null);
              }}
              className="text-xs rounded-md px-1.5 py-1 border border-gray-300 bg-white text-gray-600"
              title="إجراءات"
            >
              ⋮
            </button>

            {menuConversationId === item.id ? (
              <div className="absolute top-8 left-0 z-20 min-w-[120px] bg-white border border-gray-200 rounded-lg shadow-md p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRename(item);
                  }}
                  className="w-full text-right text-xs px-2 py-1.5 rounded hover:bg-gray-100"
                >
                  إعادة تسمية
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmConversationId(item.id);
                    setMenuConversationId(null);
                    setRenamingConversationId(null);
                  }}
                  className="w-full text-right text-xs px-2 py-1.5 rounded text-red-600 hover:bg-red-50"
                >
                  حذف
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {renamingConversationId === item.id ? (
          <div className="mt-2">
            <input
              autoFocus
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onBlur={() => finalizeRename(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  finalizeRename(item);
                }

                if (e.key === 'Escape') {
                  setRenamingConversationId(null);
                  setRenameDraft('');
                }
              }}
              placeholder="عنوان المحادثة"
              maxLength={120}
              className="w-full px-2.5 py-1.5 text-xs border border-purple-300 rounded-md"
            />
            <p className="mt-1 text-[10px] text-gray-500">Enter للحفظ</p>
          </div>
        ) : (
          <>
            <p className="mt-1 text-xs text-gray-700 leading-5">{messagePreview(item.lastUserMessage)}</p>
            <p className="mt-1 text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleString('ar-SA')}</p>
          </>
        )}

        {deleteConfirmConversationId === item.id ? (
          <div className="mt-2 border border-red-200 bg-red-50 rounded-lg p-2">
            <p className="text-xs text-red-700 mb-2">هل أنت متأكد؟</p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmConversationId(null)}
                className="text-xs px-2 py-1 rounded border border-gray-300 bg-white"
              >
                إلغاء
              </button>
              <button
                onClick={() => { void handleDeleteConversation(item.id); }}
                disabled={isBusy}
                className="text-xs px-2 py-1 rounded border border-red-300 bg-red-100 text-red-700 disabled:opacity-50"
              >
                حذف
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
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
      className="ai-review-modal fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style media="print">{`
        @page {
          size: A4;
          margin: 2cm;
        }
      `}</style>
      <div className="ai-review-shell bg-white rounded-2xl w-full max-w-[1050px] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_25px_65px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#1a237e] to-[#4a148c] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h3 className="text-lg font-[800]">المراجعة الذكية – AI</h3>
              <p className="text-xs opacity-60 mt-0.5">دردشة تحليلية مع سجل كامل للمحادثات</p>
            </div>
          </div>
          <div className="ai-review-no-print flex items-center gap-2">
            <button
              onClick={() => window.print()}
              disabled={!history.length && !streamingContent}
              className="bg-white/15 border-none text-white rounded-xl cursor-pointer text-xs px-3 py-1.5 hover:bg-white/25 transition-colors disabled:opacity-50"
            >
              📄 تصدير
            </button>
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
        <div className="ai-review-no-print px-6 py-4 border-b border-gray-200 bg-gray-50">
          {recommendation && !dismissedRecommendation ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 flex flex-wrap items-center gap-2 justify-between">
              <p>
                💡 نوصي بـ &quot;{reviewTypeLabel(recommendation.recommended)}&quot; — {recommendation.reason}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDismissedRecommendation(true);
                    void handleReview(recommendation.recommended);
                  }}
                  disabled={loading || isStreaming}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 disabled:opacity-50"
                >
                  بدء ▶
                </button>
                <button
                  onClick={() => setDismissedRecommendation(true)}
                  className="text-xs px-2 py-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-100"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : null}

          {loadingRecommendation && !recommendation ? (
            <p className="text-xs text-gray-500 mb-2">جاري توليد توصية ذكية...</p>
          ) : null}

          <div className="flex gap-2.5 flex-wrap">
            {reviewButtons.map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleReview(btn.type)}
                disabled={loading || isStreaming}
                className="bg-white border-[1.5px] border-border rounded-xl px-4 py-2.5 cursor-pointer text-sm font-bold text-navy-800 transition-all duration-200 hover:bg-navy-100 hover:border-navy-600 hover:shadow-sm disabled:opacity-50"
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-review-main flex flex-1 min-h-0">
          {/* History sidebar */}
          <aside className="ai-review-no-print w-[300px] border-l border-gray-200 bg-gray-50 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-extrabold text-navy-900">سجل المحادثات</h4>
              {loadingHistory ? <span className="text-xs text-gray-500">جاري التحميل...</span> : null}
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {reviewFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setReviewFilter(filter.value)}
                  className={`text-[11px] rounded-full px-2.5 py-1 border transition-colors ${
                    reviewFilter === filter.value
                      ? 'border-purple-400 bg-purple-100 text-purple-900'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-purple-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <input
              placeholder="ابحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg mb-3 text-right bg-white"
            />

            {!loadingHistory && !conversations.length ? (
              <p className="text-xs text-gray-500 leading-6">لا توجد محادثات محفوظة لهذا التقرير بعد.</p>
            ) : null}

            {!loadingHistory && conversations.length > 0 && !filteredConversations.length ? (
              <p className="text-xs text-gray-500 leading-6">لا توجد نتائج مطابقة للبحث أو الفلترة.</p>
            ) : null}

            <div className="space-y-2">
              {pinnedConversations.length > 0 ? (
                <p className="text-[11px] text-amber-600 font-bold px-1">مثبتة</p>
              ) : null}
              {pinnedConversations.map((item) => renderConversationCard(item))}

              {pinnedConversations.length > 0 && unpinnedConversations.length > 0 ? (
                <p className="text-[11px] text-gray-500 font-bold px-1 pt-1">باقي المحادثات</p>
              ) : null}
              {unpinnedConversations.map((item) => renderConversationCard(item))}
            </div>
          </aside>

          {/* Response area */}
          <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-[1.9] text-text-primary">
            {loading && !hasFirstToken ? (
              <div className="text-center py-12">
                <div className="text-4xl animate-spin inline-block">⚙️</div>
                <p className="text-purple-900 mt-3 font-bold text-base">AI يحلل البيانات...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-danger-500">
                <div className="text-3xl">⚠️</div>
                <p className="mt-2 text-base">{error}</p>
              </div>
            ) : history.length || isStreaming ? (
              <div id="print-conversation" className="ai-review-print-area space-y-3">
                {history.map((message, index) => {
                  const messageKey = `${message.role}-${message.timestamp ?? 'no-ts'}-${index}`;
                  const isAssistantMessage = message.role === 'assistant';

                  return (
                    <div key={messageKey} className={isAssistantMessage ? 'text-left' : 'text-right'}>
                      <div
                        className={
                          isAssistantMessage
                            ? 'inline-block relative max-w-[95%] rounded-2xl bg-purple-50 border border-purple-100 px-4 py-3 pr-10 text-sm text-gray-800'
                            : 'inline-block max-w-[90%] rounded-2xl bg-navy-900 text-white px-4 py-2.5 text-sm'
                        }
                      >
                        {isAssistantMessage ? (
                          <>
                            <button
                              onClick={() => { void copyAssistantMessage(messageKey, message.content); }}
                              className="ai-review-no-print absolute top-2 right-2 text-xs bg-white border border-purple-200 rounded-md px-1.5 py-1 hover:border-purple-400"
                              title="نسخ"
                            >
                              📋
                            </button>
                            {copyFeedback?.key === messageKey ? (
                              <span className="ai-review-no-print absolute top-2 left-2 text-[10px] text-purple-800 bg-white rounded px-1.5 py-0.5 border border-purple-200">
                                {copyFeedback.status === 'success' ? 'تم النسخ!' : 'تعذر النسخ'}
                              </span>
                            ) : null}
                            <div>{renderMarkdown(message.content)}</div>
                          </>
                        ) : (
                          <span>{message.content}</span>
                        )}
                      </div>
                      {message.timestamp ? (
                        <div
                          dir="ltr"
                          className={`mt-1 text-[10px] text-gray-400 ${
                            isAssistantMessage ? 'text-left' : 'text-right'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {isStreaming ? (
                  <div className="text-left">
                    <div className="inline-block max-w-[95%] rounded-2xl bg-purple-50 border border-purple-100 px-4 py-3 text-sm text-gray-800">
                      {streamingContent ? renderMarkdown(streamingContent) : null}
                      <span className="inline-block animate-pulse text-purple-900 mr-1">▍</span>
                    </div>
                  </div>
                ) : null}
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
        <div className="ai-review-no-print px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-2.5 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">طول الرد:</span>
            {responseLengthOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setResponseLength(option.value)}
                className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${
                  responseLength === option.value
                    ? 'border-purple-400 bg-purple-100 text-purple-900'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-purple-300'
                }`}
              >
                {option.label}{responseLength === option.value ? ' ✓' : ''}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap mb-2.5">
            {suggestions.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setFollowUpQ(prompt)}
                disabled={loading || isStreaming || !history.length}
                className="text-xs bg-white border border-gray-300 rounded-full px-3 py-1.5 hover:border-purple-400 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5 items-start">
            <div className="flex-1">
              <textarea
                value={followUpQ}
                onChange={(e) => setFollowUpQ(e.target.value.slice(0, MAX_FOLLOW_UP_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void handleFollowUp();
                  }
                }}
                rows={2}
                placeholder={history.length ? 'سؤال متابع...' : 'ابدأ مراجعة أولا ثم أضف أسئلتك'}
                className="w-full border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none resize-none focus:border-purple-700 focus:shadow-[0_0_0_3px_rgba(107,33,168,0.1)] hover:border-purple-200 transition-all duration-200"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-400">Ctrl+Enter للإرسال</span>
                <div
                  dir="ltr"
                  className={`text-xs ${followUpQ.length > 1100 ? 'text-red-500' : 'text-gray-400'}`}
                >
                  {followUpQ.length} / {MAX_FOLLOW_UP_CHARS}
                </div>
              </div>
            </div>
            <button
              onClick={handleFollowUp}
              disabled={loading || isStreaming || !followUpQ.trim() || !history.length}
              className="bg-gradient-to-l from-purple-800 to-purple-900 text-white border-none rounded-xl py-2.5 px-5 cursor-pointer text-sm font-bold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all duration-200 shadow-sm h-[44px]"
            >
              إرسال
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
