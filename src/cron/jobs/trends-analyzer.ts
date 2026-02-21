import prisma from '@/lib/prisma';
import { withCronWrapper } from '../wrapper';
import { chatCompletion } from '@/lib/ai/openrouter';
import { getSetting } from '@/lib/settings/service';

export async function trendsAnalyzerJob(): Promise<void> {
  await withCronWrapper('trends-analyzer', async () => {
    const minChangePercent =
      ((await getSetting('trends.minChangePercent')) as number | null) ?? 20;

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const interestingTrends = await prisma.trendSnapshot.findMany({
      where: {
        capturedAt: { gte: since },
        OR: [
          { changePercent: { gte: minChangePercent } },
          { isBreakout: true },
        ],
      },
      orderBy: { changePercent: 'desc' },
      take: 50,
    });

    if (interestingTrends.length === 0) {
      return { itemsProcessed: 0, metadata: { message: 'No interesting trends found' } };
    }

    const existingOpportunities = await prisma.trendOpportunity.findMany({
      where: {
        createdAt: { gte: since },
        trendQuery: { in: interestingTrends.map((t) => t.query) },
      },
      select: { trendQuery: true, geo: true },
    });

    const alreadyProcessed = new Set(
      existingOpportunities.map((o) => `${o.trendQuery}:${o.geo}`),
    );

    const niches = await prisma.niche.findMany({
      select: { id: true, name: true, displayName: true },
    });

    let created = 0;

    for (const trend of interestingTrends) {
      const key = `${trend.query}:${trend.geo}`;
      if (alreadyProcessed.has(key)) continue;

      try {
        const matchingKeywords = await prisma.keyword.findMany({
          where: {
            normalizedText: { contains: trend.query.toLowerCase() },
          },
          select: { id: true, text: true, trafficScore: true, nicheId: true },
          take: 20,
        });

        const aiResult = await chatCompletion([
          {
            role: 'system',
            content: `You are an ASO trend analyst. Analyze the Google Trends data and suggest App Store opportunities.
Reply in JSON format:
{
  "suggestedNiche": "string or null",
  "suggestedKeywords": ["keyword1", "keyword2"],
  "appStoreGap": 0.0-1.0,
  "estimatedTraffic": number,
  "competitionLevel": "low|medium|high",
  "recommendation": "string",
  "confidenceScore": 0.0-1.0
}`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              trendQuery: trend.query,
              geo: trend.geo,
              currentInterest: trend.interestCurrent,
              changePercent: trend.changePercent,
              isBreakout: trend.isBreakout,
              peakInterest: trend.peakInterest,
              existingKeywords: matchingKeywords.map((k) => ({
                text: k.text,
                traffic: k.trafficScore,
              })),
              availableNiches: niches.map((n) => n.displayName),
            }),
          },
        ]);

        const aiResponse = aiResult as { choices?: Array<{ message?: { content?: string } }> };
        const content = aiResponse.choices?.[0]?.message?.content ?? '';

        let analysis: {
          suggestedNiche?: string;
          suggestedKeywords?: string[];
          appStoreGap?: number;
          estimatedTraffic?: number;
          competitionLevel?: string;
          recommendation?: string;
          confidenceScore?: number;
        } = {};

        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) analysis = JSON.parse(jsonMatch[0]);
        } catch {
          analysis = { recommendation: content };
        }

        const matchedNiche = analysis.suggestedNiche
          ? niches.find(
              (n) =>
                n.name.toLowerCase() === analysis.suggestedNiche!.toLowerCase() ||
                n.displayName.toLowerCase() === analysis.suggestedNiche!.toLowerCase(),
            )
          : undefined;

        await prisma.trendOpportunity.create({
          data: {
            trendQuery: trend.query,
            trendCategory: trend.category,
            geo: trend.geo,
            interestScore: trend.interestCurrent,
            changePercent: trend.changePercent ?? 0,
            isBreakout: trend.isBreakout,
            suggestedNiche: analysis.suggestedNiche,
            suggestedKeywords: (analysis.suggestedKeywords ?? []) as import('@prisma/client').Prisma.InputJsonValue,
            appStoreGap: analysis.appStoreGap,
            estimatedTraffic: analysis.estimatedTraffic,
            competitionLevel: analysis.competitionLevel,
            aiAnalysis: content,
            aiRecommendation: analysis.recommendation,
            confidenceScore: analysis.confidenceScore,
            matchedNicheId: matchedNiche?.id,
            matchedKeywordIds: matchingKeywords.map((k) => k.id),
            analyzedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        created++;
        alreadyProcessed.add(key);
      } catch (error) {
        console.error(
          `[CRON] trends-analyzer: failed for trend="${trend.query}" geo="${trend.geo}":`,
          error,
        );
      }
    }

    return {
      itemsProcessed: created,
      metadata: {
        interestingTrends: interestingTrends.length,
        skippedAlreadyProcessed: alreadyProcessed.size - created,
      },
    };
  });
}
