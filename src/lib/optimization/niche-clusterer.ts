import prisma from '@/lib/prisma';
import { chatCompletion } from '@/lib/ai/openrouter';

export interface ClusterResult {
  name: string;
  displayName: string;
  keywords: string[];
  description: string;
}

export async function clusterKeywords(
  keywordIds: string[],
  options?: {
    minClusterSize?: number;
    maxClusters?: number;
  },
): Promise<ClusterResult[]> {
  const minClusterSize = options?.minClusterSize ?? 3;
  const maxClusters = options?.maxClusters ?? 10;

  const keywords = await prisma.keyword.findMany({
    where: { id: { in: keywordIds } },
    select: { id: true, text: true, trafficScore: true, sap: true },
  });

  if (keywords.length < minClusterSize) return [];

  const keywordList = keywords
    .map((k) => `- "${k.text}" (traffic: ${k.trafficScore ?? 0}, sap: ${k.sap ?? 0})`)
    .join('\n');

  const response = await chatCompletion(
    [
      {
        role: 'system',
        content: `You are an ASO keyword clustering expert. Group the given keywords into semantic niches for App Store Optimization. Return ONLY valid JSON.`,
      },
      {
        role: 'user',
        content: `Group these keywords into semantic niches (max ${maxClusters} clusters, min ${minClusterSize} keywords per cluster).

Keywords:
${keywordList}

Return JSON array:
[{
  "name": "slug-name",
  "displayName": "Human Readable Name",
  "keywords": ["keyword1", "keyword2"],
  "description": "Brief description of this niche"
}]`,
      },
    ],
    { temperature: 0.3, maxTokens: 4096 },
  );

  const content =
    (response as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message
      ?.content ?? '';

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const clusters: ClusterResult[] = JSON.parse(jsonMatch[0]);

    return clusters.filter(
      (c) =>
        c.name &&
        c.displayName &&
        Array.isArray(c.keywords) &&
        c.keywords.length >= minClusterSize,
    );
  } catch {
    return [];
  }
}
