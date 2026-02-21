import prisma from '@/lib/prisma';
import { chatCompletion } from '@/lib/ai/openrouter';
import { getSetting } from '@/lib/settings/service';

interface InsightResult {
  insights: string[];
  updatedRecords: number;
}

export async function generateInsights(): Promise<InsightResult> {
  const records = await prisma.pushLearningRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  if (records.length === 0) {
    return { insights: ['No campaign data available yet. Run campaigns to generate insights.'], updatedRecords: 0 };
  }

  const nicheGroups: Record<string, typeof records> = {};
  for (const r of records) {
    (nicheGroups[r.nicheSlug] ??= []).push(r);
  }

  const summary = Object.entries(nicheGroups).map(([niche, recs]) => {
    const total = recs.length;
    const successful = recs.filter((r) => r.outcome === 'SUCCESS').length;
    const pessimized = recs.filter((r) => r.pessimized).length;
    const avgDaily = Math.round(recs.reduce((s, r) => s + r.dailyInstalls, 0) / total);
    const avgDuration = Math.round(recs.reduce((s, r) => s + r.durationDays, 0) / total);
    const strategies = [...new Set(recs.map((r) => r.pushStrategy))];

    return `Niche "${niche}": ${total} campaigns, ${successful} successful, ${pessimized} pessimized, avg ${avgDaily} daily installs, avg ${avgDuration} days, strategies used: ${strategies.join(', ')}`;
  });

  const model = ((await getSetting('ai.defaultModel')) as string) || 'openai/gpt-4o';

  const response = await chatCompletion(
    [
      {
        role: 'system',
        content: 'You are an ASO analytics expert. Analyze push campaign learning records and provide actionable insights. Return a JSON object: { "insights": ["insight1", "insight2", ...], "lessonsPerNiche": { "niche_slug": "lesson text", ... } }',
      },
      {
        role: 'user',
        content: `Analyze these push campaign results and provide insights:\n\n${summary.join('\n')}\n\nRecords with pessimization:\n${records
          .filter((r) => r.pessimized)
          .slice(0, 10)
          .map((r) => `- Niche: ${r.nicheSlug}, Strategy: ${r.pushStrategy}, Daily: ${r.dailyInstalls}, Pessimized day: ${r.pessimizationDay}`)
          .join('\n') || 'None'}\n\nProvide 5-8 specific, actionable insights.`,
      },
    ],
    { model, temperature: 0.5, maxTokens: 2048 }
  );

  const content = (response as { choices: { message: { content: string } }[] }).choices?.[0]?.message?.content;
  if (!content) return { insights: ['Failed to generate insights — empty AI response.'], updatedRecords: 0 };

  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned) as {
    insights: string[];
    lessonsPerNiche?: Record<string, string>;
  };

  let updatedRecords = 0;
  if (parsed.lessonsPerNiche) {
    for (const [niche, lesson] of Object.entries(parsed.lessonsPerNiche)) {
      const { count } = await prisma.pushLearningRecord.updateMany({
        where: { nicheSlug: niche, lessonsLearned: null },
        data: { lessonsLearned: lesson },
      });
      updatedRecords += count;
    }
  }

  return { insights: parsed.insights || [], updatedRecords };
}
