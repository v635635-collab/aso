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
// Request params – matching real ASOMobile API
// ---------------------------------------------------------------------------

export interface KeywordCheckParams {
  keyword: string;
  country: string;
  platform: 'IOS' | 'ANDROID';
  ios_device?: 'IPHONE' | 'IPAD';
}

export interface KeywordSuggestParams {
  keywords: string[];
  country: string;
  platform: 'IOS' | 'ANDROID';
  ios_device?: 'IPHONE' | 'IPAD';
}

export interface KeywordRankParams {
  keyword: string;
  app_id: string;
  country: string;
  platform: 'IOS' | 'ANDROID';
  ios_device?: 'IPHONE' | 'IPAD';
}

export interface AppProfileParams {
  app_id: string;
  country: string;
  platform: 'IOS' | 'ANDROID';
}

export interface AppKeywordsParams {
  app_id: string;
  country: string;
  platform: 'IOS' | 'ANDROID';
}

export interface WorldwideCheckParams {
  keywords: string[];
  platform: 'IOS' | 'ANDROID';
}

// ---------------------------------------------------------------------------
// Response types – matching real ASOMobile API
// ---------------------------------------------------------------------------

export interface ASOMobileAPIResponse<T = unknown> {
  code: number;
  data: T;
  message?: string;
}

export interface ASOMobileTicketResponse {
  ticket_id: number;
}

export type ASOMobileResultStatus = 'done' | 'pending' | 'error';

export interface ASOMobileResultResponse<T = unknown> {
  status: ASOMobileResultStatus;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Result data types – matching real ASOMobile API
// ---------------------------------------------------------------------------

export interface KeywordCheckResult {
  ci: { value: number };
  apps_count: number;
  suggestions: string[];
  kei: { value: number };
  asa: number;
  traffic: { value: number };
  top_apps: Array<{ type: string; app_id: string }>;
}

export interface KeywordSuggestResultItem {
  suggestions: Array<{
    suggestKeyword: string;
    traffic: { value: number };
  }>;
  keyword: string;
}

export type KeywordSuggestResult = KeywordSuggestResultItem[];

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
