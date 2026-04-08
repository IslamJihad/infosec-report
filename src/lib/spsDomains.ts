import { DEFAULT_SPS_DOMAINS } from '@/lib/constants';
import type { SPSDomain, SPSSubMetric } from '@/types/report';

function clampPercent(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, parsed));
}

function findById<T extends { id: string }>(items: unknown, id: string): T | undefined {
  if (!Array.isArray(items)) return undefined;
  return items.find(
    (item): item is T =>
      !!item &&
      typeof item === 'object' &&
      typeof (item as { id?: unknown }).id === 'string' &&
      (item as { id: string }).id === id,
  );
}

function normalizeSubMetric(defaultSubMetric: SPSSubMetric, candidate: unknown): SPSSubMetric {
  return {
    ...defaultSubMetric,
    value: clampPercent((candidate as Partial<SPSSubMetric> | undefined)?.value, defaultSubMetric.value),
  };
}

export function normalizeSPSDomains(candidate: unknown): SPSDomain[] {
  const incomingDomains = Array.isArray(candidate) ? candidate : [];

  return DEFAULT_SPS_DOMAINS.map((defaultDomain) => {
    const incomingDomain = findById<Partial<SPSDomain>>(incomingDomains, defaultDomain.id);

    return {
      ...defaultDomain,
      subMetrics: defaultDomain.subMetrics.map((defaultSubMetric) => {
        const incomingSubMetric = findById<Partial<SPSSubMetric>>(incomingDomain?.subMetrics, defaultSubMetric.id);
        return normalizeSubMetric(defaultSubMetric, incomingSubMetric);
      }),
    };
  });
}

export function parseSPSDomainsJson(raw: unknown): SPSDomain[] {
  if (typeof raw !== 'string' || raw.trim() === '' || raw === '[]') {
    return normalizeSPSDomains(null);
  }

  try {
    return normalizeSPSDomains(JSON.parse(raw));
  } catch {
    return normalizeSPSDomains(null);
  }
}