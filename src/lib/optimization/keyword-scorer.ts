export interface KeywordScoreParams {
  trafficScore: number;
  sap: number;
  competition: number;
  totalApps: number;
}

export function calculateKeywordScore(params: KeywordScoreParams): number {
  const { trafficScore, sap, competition, totalApps } = params;
  const sapFactor = 1 - Math.min(sap, 100) / 100;
  const appsFactor = 1 / Math.max(1, totalApps / 10);
  const competitionFactor = 1 - Math.min(competition, 100) / 100;

  const raw = trafficScore * sapFactor * appsFactor;
  const weighted = raw * 0.7 + raw * competitionFactor * 0.3;

  return Math.round(weighted * 100) / 100;
}

export function calculateDifficulty(params: KeywordScoreParams): number {
  const { sap, competition, totalApps } = params;
  const sapWeight = Math.min(sap, 100) / 100;
  const competitionWeight = Math.min(competition, 100) / 100;
  const appsWeight = Math.min(totalApps / 100, 1);

  const difficulty = (sapWeight * 0.5 + competitionWeight * 0.3 + appsWeight * 0.2) * 100;
  return Math.round(difficulty * 100) / 100;
}

export type TrafficLevel = 'low' | 'medium' | 'high';

export function getTrafficLevel(trafficScore: number): TrafficLevel {
  if (trafficScore > 50) return 'high';
  if (trafficScore >= 20) return 'medium';
  return 'low';
}
