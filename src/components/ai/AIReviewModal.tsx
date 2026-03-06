'use client';

import { useState } from 'react';
import type { ReportData } from '@/types/report';
import { aiReview, aiFollowUp } from '@/lib/api';

interface Props {
  report: ReportData;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIReviewModal({ report, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [history, setHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [followUpQ, setFollowUpQ] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleReview(type: string) {
    setLoading(true);
    setError('');
    setContent('');
    try {
      const result = await aiReview(report.id, type, report);
      setContent(result.content);
      setHistory(result.messages || []);
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
    try {
      const result = await aiFollowUp(report.id, q, history);
      setContent((prev) => prev + '\n\n---\n\n**سؤالك:** ' + q + '\n\n' + result.content);
      setHistory(result.messages || []);
    } catch (e: unknown) {
      setError((e as Error).message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  function renderMarkdown(text: string) {
    return text
      .replace(/^## (.+)$/gm, '<h3 class="text-base font-extrabold text-purple-900 mt-4 mb-2 pb-1.5 border-b-2 border-purple-200">$1</h3>')
      .replace(/^### (.+)$/gm, '<h4 class="text-sm font-extrabold text-navy-950 mt-3 mb-1.5">$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-navy-950">$1</strong>')
      .replace(/^- (.+)$/gm, '<div class="flex gap-2 my-1 text-sm"><span class="text-purple-900 flex-shrink-0">•</span><span>$1</span></div>')
      .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 my-1 text-sm"><span class="text-purple-900 font-extrabold flex-shrink-0">›</span><span>$1</span></div>')
      .replace(/`(.+?)`/g, '<code class="bg-purple-50 px-1.5 py-0.5 rounded text-xs text-purple-900">$1</code>')
      .replace(/\n\n/g, '<br/>');
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[750px] max-h-[86vh] overflow-hidden flex flex-col shadow-[0_25px_65px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#1a237e] to-[#4a148c] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <h3 className="text-lg font-[800]">المراجعة الذكية – Gemini AI</h3>
              <p className="text-xs opacity-60 mt-0.5">مدير أمن معلومات افتراضي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/15 border-none text-white w-8 h-8 rounded-full cursor-pointer text-base leading-none hover:bg-white/25 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Review types */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex gap-2.5 flex-wrap">
          {[
            { type: 'full', icon: '🔍', label: 'مراجعة شاملة' },
            { type: 'exec', icon: '👔', label: 'منظور الإدارة' },
            { type: 'board', icon: '🏛️', label: 'مجلس الإدارة' },
            { type: 'risk', icon: '⚠️', label: 'تحليل المخاطر' },
            { type: 'gaps', icon: '🕳️', label: 'الثغرات المفقودة' },
          ].map((btn) => (
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
          ) : content ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          ) : (
            <div className="text-center text-gray-400 py-12">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-base">اختر نوع المراجعة للبدء</p>
            </div>
          )}
        </div>

        {/* Follow-up input */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-2.5 bg-gray-50">
          <input
            value={followUpQ}
            onChange={(e) => setFollowUpQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFollowUp(); }}
            placeholder="سؤال متابع..."
            className="flex-1 border-[1.5px] border-border rounded-xl py-2.5 px-4 text-sm outline-none focus:border-purple-700 focus:shadow-[0_0_0_3px_rgba(107,33,168,0.1)] hover:border-purple-200 transition-all duration-200"
          />
          <button
            onClick={handleFollowUp}
            disabled={loading || !followUpQ.trim()}
            className="bg-gradient-to-l from-purple-800 to-purple-900 text-white border-none rounded-xl py-2.5 px-5 cursor-pointer text-sm font-bold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all duration-200 shadow-sm"
          >
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
