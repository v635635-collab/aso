import prisma from "@/lib/prisma";
import { chatCompletion, type ChatMessage } from "@/lib/ai/openrouter";
import { getLocaleByCode } from "./locales";

interface LocalizationInput {
  appId: string;
  sourceLocale: string;
  targetLocales: string[];
}

interface GeneratedLocalization {
  locale: string;
  title: string;
  subtitle: string;
  keywordField: string;
  description: string | null;
  keywordsCovered: string[];
  aiReasoning: string;
}

interface AppLocalizationResult {
  id: string;
  appId: string;
  locale: string;
  title: string | null;
  subtitle: string | null;
  keywordField: string | null;
  description: string | null;
  keywordsCovered: string[];
  trafficCovered: number;
  generatedBy: string | null;
  sourceLocale: string | null;
  aiReasoning: string | null;
  isApplied: boolean;
}

export async function generateLocalizations(
  params: LocalizationInput
): Promise<AppLocalizationResult[]> {
  const { appId, sourceLocale, targetLocales } = params;

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: {
      name: true,
      currentTitle: true,
      currentSubtitle: true,
      category: true,
      keywords: {
        select: {
          keyword: {
            select: { text: true, trafficScore: true },
          },
          isInTitle: true,
          isInSubtitle: true,
        },
        take: 30,
        orderBy: { keyword: { trafficScore: "desc" } },
      },
      localizations: {
        where: { locale: sourceLocale },
        take: 1,
      },
    },
  });

  if (!app) {
    throw new Error(`App not found: ${appId}`);
  }

  const sourceLocalization = app.localizations[0];
  const sourceTitle = sourceLocalization?.title ?? app.currentTitle ?? app.name;
  const sourceSubtitle = sourceLocalization?.subtitle ?? app.currentSubtitle ?? "";
  const sourceKeywords = sourceLocalization?.keywordField ?? "";
  const sourceDescription = sourceLocalization?.description ?? "";

  const topKeywords = app.keywords
    .map((ak) => ak.keyword.text)
    .slice(0, 20);

  const results: AppLocalizationResult[] = [];

  const batchSize = 3;
  for (let i = 0; i < targetLocales.length; i += batchSize) {
    const batch = targetLocales.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((locale) =>
        generateSingleLocalization({
          appName: app.name,
          category: app.category ?? "General",
          sourceLocale,
          targetLocale: locale,
          sourceTitle,
          sourceSubtitle,
          sourceKeywords,
          sourceDescription,
          topKeywords,
        })
      )
    );

    for (const gen of batchResults) {
      const upserted = await prisma.appLocalization.upsert({
        where: {
          appId_locale: { appId, locale: gen.locale },
        },
        create: {
          appId,
          locale: gen.locale,
          title: gen.title,
          subtitle: gen.subtitle,
          keywordField: gen.keywordField,
          description: gen.description,
          keywordsCovered: gen.keywordsCovered,
          generatedBy: "ai",
          sourceLocale,
          aiReasoning: gen.aiReasoning,
        },
        update: {
          title: gen.title,
          subtitle: gen.subtitle,
          keywordField: gen.keywordField,
          description: gen.description,
          keywordsCovered: gen.keywordsCovered,
          generatedBy: "ai",
          sourceLocale,
          aiReasoning: gen.aiReasoning,
        },
      });

      results.push(upserted);
    }
  }

  return results;
}

async function generateSingleLocalization(params: {
  appName: string;
  category: string;
  sourceLocale: string;
  targetLocale: string;
  sourceTitle: string;
  sourceSubtitle: string;
  sourceKeywords: string;
  sourceDescription: string;
  topKeywords: string[];
}): Promise<GeneratedLocalization> {
  const targetInfo = getLocaleByCode(params.targetLocale);
  const targetName = targetInfo?.name ?? params.targetLocale;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are an expert App Store Optimization (ASO) localizer. You adapt app metadata for different App Store locales, optimizing for local search behavior and cultural relevance. Always respond with valid JSON.`,
    },
    {
      role: "user",
      content: `Localize the following App Store metadata from ${params.sourceLocale} to ${targetName} (${params.targetLocale}).

App: ${params.appName}
Category: ${params.category}

Source metadata:
- Title (max 30 chars): ${params.sourceTitle}
- Subtitle (max 30 chars): ${params.sourceSubtitle}
- Keywords (max 100 chars, comma-separated): ${params.sourceKeywords}
- Description: ${params.sourceDescription || "(none)"}

Top performing keywords in source: ${params.topKeywords.join(", ")}

Requirements:
1. Title must be ≤30 characters, naturally incorporate high-traffic keywords in ${targetName}
2. Subtitle must be ≤30 characters, complement the title with additional keywords
3. Keyword field must be ≤100 characters, comma-separated, no spaces after commas — use LOCAL search terms people in ${targetName}-speaking markets actually search for
4. If source description is provided, create a culturally adapted version
5. Don't just translate — adapt for local search behavior and cultural norms

Respond ONLY with valid JSON:
{
  "title": "...",
  "subtitle": "...",
  "keywordField": "...",
  "description": "..." or null,
  "keywordsCovered": ["keyword1", "keyword2", ...],
  "reasoning": "Brief explanation of adaptation choices"
}`,
    },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.5,
    maxTokens: 2048,
  });

  const content =
    (response as { choices?: { message?: { content?: string } }[] })?.choices?.[0]
      ?.message?.content ?? "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse AI response for locale ${params.targetLocale}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    title: string;
    subtitle: string;
    keywordField: string;
    description: string | null;
    keywordsCovered: string[];
    reasoning: string;
  };

  return {
    locale: params.targetLocale,
    title: (parsed.title ?? "").slice(0, 30),
    subtitle: (parsed.subtitle ?? "").slice(0, 30),
    keywordField: (parsed.keywordField ?? "").slice(0, 100),
    description: parsed.description ?? null,
    keywordsCovered: parsed.keywordsCovered ?? [],
    aiReasoning: parsed.reasoning ?? "",
  };
}
