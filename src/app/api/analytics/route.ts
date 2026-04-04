import { NextResponse } from 'next/server';
import { getAnalyticsSnapshot } from '@/lib/analytics/snapshot';
import type { AnalyticsQueryOptions } from '@/types/analytics';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query: Partial<AnalyticsQueryOptions> = {
      from: url.searchParams.get('from') || undefined,
      to: url.searchParams.get('to') || undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      groupBy: (url.searchParams.get('groupBy') || undefined) as AnalyticsQueryOptions['groupBy'],
      riskSeverity: (url.searchParams.get('riskSeverity') || undefined) as AnalyticsQueryOptions['riskSeverity'],
      riskStatus: (url.searchParams.get('riskStatus') || undefined) as AnalyticsQueryOptions['riskStatus'],
      reportId: url.searchParams.get('reportId') || undefined,
    };
    const response = await getAnalyticsSnapshot(query);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json({ error: 'فشل في تحميل التحليلات' }, { status: 500 });
  }
}