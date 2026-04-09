import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { buildPercentileMap, calculateGlobalSecurityScore } from '@/lib/scoring';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const original = await prisma.report.findUnique({
      where: { id },
      include: {
        decisions: { orderBy: { sortOrder: 'asc' } },
        risks: { orderBy: { sortOrder: 'asc' } },
        maturityDomains: { orderBy: { sortOrder: 'asc' } },
        recommendations: { orderBy: { sortOrder: 'asc' } },
        challenges: { orderBy: { sortOrder: 'asc' } },
        efficiencyKPIs: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!original) {
      return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    }

    const {
      id: originalId,
      createdAt,
      updatedAt,
      decisions,
      risks,
      maturityDomains,
      recommendations,
      challenges,
      efficiencyKPIs,
      securityScore,
      ...data
    } = original;
    void originalId;
    void createdAt;
    void updatedAt;
    void securityScore;

    const cleanDecision = decisions.map((item) => {
      const { id: decisionId, reportId, ...next } = item;
      void decisionId;
      void reportId;
      return next;
    });

    const cleanRisk = risks.map((item) => {
      const { id: riskId, reportId, ...next } = item;
      void riskId;
      void reportId;
      return next;
    });

    const cleanMaturity = maturityDomains.map((item) => {
      const { id: maturityId, reportId, ...next } = item;
      void maturityId;
      void reportId;
      return next;
    });

    const cleanRecommendation = recommendations.map((item) => {
      const { id: recommendationId, reportId, ...next } = item;
      void recommendationId;
      void reportId;
      return next;
    });

    const cleanChallenge = challenges.map((item) => {
      const { id: challengeId, reportId, ...next } = item;
      void challengeId;
      void reportId;
      return next;
    });

    const cleanEfficiencyKPI = efficiencyKPIs.map((item) => {
      const { id: efficiencyId, reportId, ...next } = item;
      void efficiencyId;
      void reportId;
      return next;
    });

    const duplicate = await prisma.report.create({
      data: {
        ...data,
        title: `${data.title} (نسخة)`,
        status: 'draft',
        decisions: {
          create: cleanDecision,
        },
        risks: {
          create: cleanRisk,
        },
        maturityDomains: {
          create: cleanMaturity,
        },
        recommendations: {
          create: cleanRecommendation,
        },
        challenges: {
          create: cleanChallenge,
        },
        efficiencyKPIs: {
          create: cleanEfficiencyKPI,
        },
      },
      include: {
        decisions: { orderBy: { sortOrder: 'asc' } },
        risks: { orderBy: { sortOrder: 'asc' } },
        maturityDomains: { orderBy: { sortOrder: 'asc' } },
        recommendations: { orderBy: { sortOrder: 'asc' } },
        challenges: { orderBy: { sortOrder: 'asc' } },
        efficiencyKPIs: { orderBy: { sortOrder: 'asc' } },
      },
    });

    const scoreResult = calculateGlobalSecurityScore(duplicate);
    if (duplicate.securityScore !== scoreResult.securityScore) {
      await prisma.report.update({
        where: { id: duplicate.id },
        data: { securityScore: scoreResult.securityScore },
      });
    }

    const allScores = await prisma.report.findMany({
      select: { id: true, securityScore: true },
    });
    const percentileMap = buildPercentileMap(
      allScores.map((entry) =>
        entry.id === duplicate.id ? { ...entry, securityScore: scoreResult.securityScore } : entry,
      ),
    );

    return NextResponse.json({
      ...duplicate,
      securityScore: scoreResult.securityScore,
      scoreBreakdown: scoreResult.scoreBreakdown,
      scorePercentile: percentileMap[duplicate.id] ?? 0,
    });
  } catch (error) {
    console.error('Error duplicating report:', error);
    return NextResponse.json({ error: 'فشل في نسخ التقرير' }, { status: 500 });
  }
}
