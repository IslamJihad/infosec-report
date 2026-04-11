'use client';

import { useState } from 'react';
import { useReportStore } from '@/store/reportStore';
import { DEFAULT_SPS_DOMAINS } from '@/lib/constants';
import type { SPSDomain } from '@/types/report';
import { FormCard } from './GeneralInfoForm';

function computeDomainScore(domain: SPSDomain): number {
  const subMetrics = domain.subMetrics ?? [];
  const totalWeight = subMetrics.reduce((s, sm) => s + sm.weight, 0);
  if (subMetrics.length === 0 || totalWeight <= 0) return 50;
  const raw = subMetrics.reduce((s, sm) => s + Math.min(100, Math.max(0, sm.value)) * sm.weight, 0) / totalWeight;
  return Math.min(100, Math.max(0, raw));
}

function computeOverallSPS(domains: SPSDomain[]): number {
  const raw = domains.reduce((s, d) => s + computeDomainScore(d) * d.weight, 0);
  return Math.min(100, Math.max(0, Math.round(raw)));
}

function scoreColor(score: number): { bar: string; text: string } {
  if (score >= 75) return { bar: 'bg-success-500', text: 'text-success-700' };
  if (score >= 50) return { bar: 'bg-warning-500', text: 'text-warning-700' };
  return { bar: 'bg-danger-500', text: 'text-danger-500' };
}

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className="w-full bg-[color:var(--sps-meter-track)] rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-300 ${className}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function SPSDomainsForm() {
  const { report, updateSPSSubMetric, resetSPSDomains } = useReportStore();
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

  if (!report) return null;

  const domains: SPSDomain[] =
    Array.isArray(report.spsDomains) && report.spsDomains.length > 0
      ? report.spsDomains
      : DEFAULT_SPS_DOMAINS;

  const overallSPS = computeOverallSPS(domains);
  const { bar: overallBar, text: overallText } = scoreColor(overallSPS);

  function toggleDomain(id: string) {
    setExpandedDomains((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div id="search-editor-section-sps" className="animate-fadeIn">
      <FormCard icon="🛡️" title="مؤشرات وضع الأمان (SPS)">
        {/* Overall score bar */}
        <div className="bg-[color:var(--surface-muted)] border border-border rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">درجة وضع الأمان الإجمالية (SPS)</span>
            <span className={`text-2xl font-bold ${overallText}`}>{overallSPS}</span>
          </div>
          <ProgressBar value={overallSPS} className={overallBar} />
          <p className="text-xs text-text-hint mt-2 text-left ltr">
            SPS = clamp(round(Σ DomainScore × DomainWeight), 0, 100)
          </p>
        </div>

        {/* Domain cards */}
        <div className="space-y-3">
          {domains.map((domain) => {
            const domainScore = computeDomainScore(domain);
            const contribution = domainScore * domain.weight;
            const isExpanded = !!expandedDomains[domain.id];
            const { bar, text } = scoreColor(domainScore);
            const totalSubWeight = domain.subMetrics.reduce((s, sm) => s + sm.weight, 0);

            return (
              <div
                key={domain.id}
                className="border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Domain header */}
                <button
                  type="button"
                  onClick={() => toggleDomain(domain.id)}
                  className="w-full bg-[color:var(--surface-elevated)] px-5 py-4 flex items-center gap-4 text-right hover:bg-[color:var(--surface-muted)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-text-primary text-sm">{domain.nameAr}</span>
                      <span className="text-xs bg-[color:var(--sps-weight-badge-bg)] text-[color:var(--sps-weight-badge-text)] px-2 py-0.5 rounded-full border border-[color:var(--sps-weight-badge-border)]">
                        وزن {Math.round(domain.weight * 100)}%
                      </span>
                    </div>
                    <ProgressBar value={domainScore} className={bar} />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xl font-bold ${text}`}>{Math.round(domainScore)}</span>
                    <span className="text-text-hint text-lg">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded sub-metrics */}
                {isExpanded && (
                  <div className="bg-[color:var(--surface-muted)] border-t border-border/70 px-5 py-4">
                    <div className="space-y-3">
                      {domain.subMetrics.map((sm) => (
                        <div key={sm.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-text-secondary">{sm.nameAr}</span>
                          </div>
                          <span className="text-xs text-text-hint shrink-0">
                            و:{sm.weight}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={sm.value}
                              onChange={(e) => {
                                const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                updateSPSSubMetric(domain.id, sm.id, val);
                              }}
                              className="w-16 text-center border border-border rounded-lg px-2 py-1 text-sm font-medium bg-[color:var(--surface-elevated)] text-text-primary outline-none focus:border-navy-700 focus:shadow-[0_0_0_3px_var(--color-focus-ring)]"
                            />
                            <span className="text-xs text-text-hint">/ 100</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Domain contribution footer */}
                    <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-text-muted">
                      <span>
                        مساهمة المجال:{' '}
                        <span className="font-semibold text-text-secondary">{contribution.toFixed(1)} نقطة</span>
                      </span>
                      <span className="ltr text-left text-text-hint">
                        Σ(مقياس × وزن) ÷ {totalSubWeight}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reset button */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={resetSPSDomains}
            className="text-sm text-text-secondary border border-border rounded-xl px-4 py-2 hover:bg-[color:var(--button-soft-hover)] transition-colors"
          >
            إعادة تعيين إلى القيم الافتراضية
          </button>
        </div>
      </FormCard>
    </div>
  );
}
