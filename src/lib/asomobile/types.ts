export enum QueuePriority {
  HIGH = 0,
  NORMAL = 1,
  LOW = 2,
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

// ---------------------------------------------------------------------------
// Request params
// ---------------------------------------------------------------------------

export interface KeywordCheckParams {
  query: string;
  country: string;
  lang: string;
}

export interface KeywordSuggestParams {
  query: string;
  country: string;
  lang: string;
}

export interface KeywordRankParams {
  query: string;
  app_id: string;
  country: string;
}

export interface AppProfileParams {
  app_id: string;
  country: string;
}

export interface AppKeywordsParams {
  app_id: string;
  country: string;
}

export interface WorldwideCheckParams {
  query: string;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface ASOMobileTicketResponse {
  ticket_id: string;
  status: string;
}

export interface ASOMobileResultResponse<T = unknown> {
  status: 'pending' | 'done' | 'error';
  result?: T;
  error?: string;
}

export interface KeywordCheckResult {
  keyword: string;
  traffic_score: number;
  sap: number;
  competition: number;
  total_apps: number;
}

export interface KeywordSuggestResult {
  keywords: Array<{
    keyword: string;
    traffic_score: number;
    sap: number;
    competition: number;
  }>;
}

export interface KeywordRankResult {
  app_id: string;
  keyword: string;
  position: number | null;
  country: string;
}

export interface AppProfileResult {
  app_id: string;
  name: string;
  bundle_id: string;
  category: string;
  rating: number;
  review_count: number;
  icon_url: string;
}

export interface AppKeywordsResult {
  app_id: string;
  keywords: Array<{
    keyword: string;
    traffic_score: number;
    position: number | null;
  }>;
}

export interface WorldwideCheckResult {
  keyword: string;
  countries: Array<{
    country: string;
    traffic_score: number;
    sap: number;
    competition: number;
  }>;
}

// ---------------------------------------------------------------------------
// Endpoint / queue helpers
// ---------------------------------------------------------------------------

export type ASOMobileEndpointName =
  | 'keyword-check'
  | 'keyword-suggest'
  | 'keyword-rank'
  | 'app-profile'
  | 'app-keywords'
  | 'worldwide-check';

export type ASOMobileParams =
  | KeywordCheckParams
  | KeywordSuggestParams
  | KeywordRankParams
  | AppProfileParams
  | AppKeywordsParams
  | WorldwideCheckParams;

export interface QueueStats {
  queued: number;
  circuitState: string;
  tokensRemaining: number;
}
