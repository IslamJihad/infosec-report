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
      .replace(/^## (.+)$/gm, '<h3 class="text-xs font-extrabold text-purple-900 mt-3.5 mb-1.5 pb-1 border-b-2 border-purple-200">$1</h3>')
      .replace(/^### (.+)$/gm, '<h4 class="text-[11px] font-extrabold text-navy-950 mt-2 mb-1">$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-navy-950">$1</strong>')
      .replace(/^- (.+)$/gm, '<div class="flex gap-1.5 my-0.5 text-[11px]"><span class="text-purple-900 flex-shrink-0">•</span><span>$1</span></div>')
      .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-1.5 my-0.5 text-[11px]"><span class="text-purple-900 font-extrabold flex-shrink-0">›</span><span>$1</span></div>')
      .replace(/`(.+?)`/g, '<code class="bg-purple-50 px-1 py-px rounded text-[10px] text-purple-900">$1</code>')
      .replace(/\n\n/g, '<br/>');
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl w-full max-w-[700px] max-h-[86vh] overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#1a237e] to-[#4a148c] text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h3 className="text-[13px] font-[800]">المراجعة الذكية – Gemini AI</h3>
              <p className="text-[9px] opacity-65 mt-px">مدير أمن معلومات افتراضي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/15 border-none text-white w-[26px] h-[26px] rounded-full cursor-pointer text-sm leading-none hover:bg-white/25 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Review types */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex gap-1.5 flex-wrap">
          {[
            { type: 'full', icon: '🔍', label: 'مراجعة شاملة' },
            { type: 'exec', icon: '👔', label: 'منظور الإدارة' },
            { type: 'risk', icon: '⚠️', label: 'تحليل المخاطر' },
            { type: 'gaps', icon: '🕳️', label: 'الثغرات المفقودة' },
          ].map((btn) => (
            <button
              key={btn.type}
              onClick={() => handleReview(btn.type)}
              disabled={loading}
              className="bg-white border-[1.5px] border-border rounded-md px-3 py-1.5 cursor-pointer font-[Cairo] text-[11px] font-bold text-navy-800 transition-colors hover:bg-navy-100 hover:border-navy-800 disabled:opacity-50"
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        {/* Response area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 text-xs leading-[2] text-text-primary">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-[26px] animate-spin inline-block">⚙️</div>
              <p className="text-purple-900 mt-2 font-bold">AI يحلل البيانات...</p>
            </div>
          ) : error ? (
            <div className="text-center py-5 text-danger-500">
              <div className="text-2xl">⚠️</div>
              <p className="mt-2">{error}</p>
            </div>
          ) : content ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          ) : (
            <div className="text-center text-gray-400 py-8">
              <div className="text-3xl mb-2">🤖</div>
              <p>اختر نوع المراجعة للبدء</p>
            </div>
          )}
        </div>

        {/* Follow-up input */}
        <div className="px-4 py-2.5 border-t border-gray-200 flex gap-2 bg-gray-50">
          <input
            value={followUpQ}
            onChange={(e) => setFollowUpQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFollowUp(); }}
            placeholder="سؤال متابع..."
            className="flex-1 border-[1.5px] border-border rounded-md py-1.5 px-2.5 font-[Cairo] text-[11px] outline-none focus:border-navy-800"
          />
          <button
            onClick={handleFollowUp}
            disabled={loading || !followUpQ.trim()}
            className="bg-purple-900 text-white border-none rounded-md py-1.5 px-3.5 cursor-pointer font-[Cairo] text-[11px] font-bold hover:bg-purple-950 disabled:opacity-50 transition-colors"
          >
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
