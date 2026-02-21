import prisma from '@/lib/prisma';
import { chatCompletion } from '@/lib/ai/openrouter';
import { getSetting } from '@/lib/settings/service';
import { greedyPackKeywords, computeCoverage, type PackableKeyword } from './greedy-packer';
import type { AsyncJob } from '@prisma/client';

type Strategy = 'traffic_first' | 'balanced' | 'readability_first';

interface GenerateTitleParams {
  appId: string;
  maxVariants?: number;
  strategy?: Strategy;
}

interface AITitleVariant {
  title: string;
  subtitle?: string;
  reasoning: string;
}

const MAX_TITLE_LENGTH = 200;

export async function generateTitleVariants(params: GenerateTitleParams): Promise<AsyncJob> {
  const { appId, maxVariants = 3, strategy = 'balanced' } = params;

  const job = await prisma.asyncJob.create({
    data: {
      type: 'GENERATE_TITLES',
      status: 'PENDING',
      input: { appId, maxVariants, strategy } as unknown as import('@prisma/client').Prisma.InputJsonValue,
      triggeredBy: 'system',
      relatedEntityType: 'App',
      relatedEntityId: appId,
    },
  });

  runTitleGeneration(job.id, { appId, maxVariants, strategy }).catch((err) =>
    console.error('[TitleGenerator] Background generation failed:', err)
  );

  return job;
}

async function runTitleGeneration(
  jobId: string,
  params: Required<Pick<GenerateTitleParams, 'appId' | 'maxVariants' | 'strategy'>>,
) {
  await prisma.asyncJob.update({
    where: { id: jobId },
    data: { status: 'RUNNING', startedAt: new Date(), progress: 10 },
  });

  try {
    const app = await prisma.app.findUnique({
      where: { id: params.appId },
      include: {
        keywords: {
          include: {
            keyword: {
              select: { id: true, text: true, trafficScore: true, sap: true, difficulty: true },
            },
          },
        },
        niche: { select: { name: true, displayName: true } },
      },
    });

    if (!app) throw new Error(`App ${params.appId} not found`);

    await prisma.asyncJob.update({ where: { id: jobId }, data: { progress: 20 } });

    const allKeywords: PackableKeyword[] = app.keywords
      .map((ak) => ({ text: ak.keyword.text, trafficScore: ak.keyword.trafficScore ?? 0 }))
      .filter((k) => k.text.length > 0);

    if (allKeywords.length === 0) {
      throw new Error('No keywords linked to this app. Add keywords before generating titles.');
    }

    const packed = greedyPackKeywords(allKeywords, MAX_TITLE_LENGTH);

    await prisma.asyncJob.update({ where: { id: jobId }, data: { progress: 40 } });

    const model = ((await getSetting('ai.defaultModel')) as string) || 'openai/gpt-4o';
    const temperature = ((await getSetting('ai.temperature')) as number) || 0.7;

    const strategyGuide: Record<Strategy, string> = {
      traffic_first: 'Maximize keyword coverage and traffic. Readability is secondary — pack as many high-traffic keywords as possible.',
      balanced: 'Balance readability with keyword coverage. The title should read naturally while including as many keywords as possible.',
      readability_first: 'Prioritize a clean, readable title that makes sense to users. Include keywords naturally but don\'t force awkward combinations.',
    };

    const keywordList = allKeywords
      .sort((a, b) => b.trafficScore - a.trafficScore)
      .slice(0, 50)
      .map((k) => `"${k.text}" (traffic: ${k.trafficScore})`)
      .join('\n');

    const prompt = `You are an App Store Optimization (ASO) expert. Generate ${params.maxVariants} title variants for an iOS app.

App Name: ${app.name}
Category: ${app.category || 'Unknown'}
Niche: ${app.niche?.displayName || 'Unknown'}
Current Title: ${app.currentTitle || app.name}

Available keywords (sorted by traffic):
${keywordList}

Greedy-packed reference title (max keyword density):
"${packed.title}"
(${packed.charCount} chars, ${packed.selected.length} keywords, traffic: ${packed.totalTraffic})

Strategy: ${params.strategy} — ${strategyGuide[params.strategy]}

Rules:
- Each title MUST be ${MAX_TITLE_LENGTH} characters or fewer
- Use separators like " - ", " | ", or " : " between sections
- Include the app name or core brand at the start
- Pack as many keywords as possible while respecting the strategy
- Each variant should use a different structure/approach

Return a JSON array:
[
  {"title": "...", "subtitle": "optional subtitle up to 30 chars", "reasoning": "1-2 sentences explaining approach"}
]

Return ONLY valid JSON, no markdown fences or extra text.`;

    const response = await chatCompletion(
      [
        { role: 'system', content: 'You are an ASO expert for the Apple App Store. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      { model, temperature, maxTokens: 2048 },
    );

    await prisma.asyncJob.update({ where: { id: jobId }, data: { progress: 70 } });

    const content = (response as { choices: { message: { content: string } }[] }).choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const variants: AITitleVariant[] = JSON.parse(cleaned);

    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('AI returned invalid variants format');
    }

    await prisma.asyncJob.update({ where: { id: jobId }, data: { progress: 85 } });

    const created = [];
    for (const variant of variants.slice(0, params.maxVariants)) {
      const titleText = variant.title.slice(0, MAX_TITLE_LENGTH);
      const coverage = computeCoverage(titleText, allKeywords);

      const score = computeScore(coverage.percentage, coverage.trafficCovered, coverage.trafficTotal, titleText.length);

      const record = await prisma.titleVariant.create({
        data: {
          appId: params.appId,
          title: titleText,
          subtitle: variant.subtitle || null,
          charCount: titleText.length,
          keywordsCovered: coverage.covered,
          keywordCount: coverage.covered.length,
          trafficCovered: coverage.trafficCovered,
          status: 'DRAFT',
          isActive: false,
          generatedBy: 'ai',
          aiPrompt: params.strategy,
          aiReasoning: variant.reasoning,
          score,
        },
      });

      created.push(record);
    }

    await prisma.asyncJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        output: {
          variantIds: created.map((v) => v.id),
          count: created.length,
          bestScore: Math.max(...created.map((v) => v.score ?? 0)),
        },
        completedAt: new Date(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.asyncJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: message, completedAt: new Date() },
    });
    throw err;
  }
}

function computeScore(
  coveragePct: number,
  trafficCovered: number,
  trafficTotal: number,
  charCount: number,
): number {
  const trafficRatio = trafficTotal > 0 ? trafficCovered / trafficTotal : 0;
  const charEfficiency = charCount > 0 ? Math.min(1, charCount / MAX_TITLE_LENGTH) : 0;

  const score =
    coveragePct * 0.3 +
    trafficRatio * 100 * 0.5 +
    charEfficiency * 100 * 0.2;

  return Math.round(score * 10) / 10;
}
