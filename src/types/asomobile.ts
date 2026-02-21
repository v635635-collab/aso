export interface ASOMobileTicketResponse {
  ticket_id: string;
  status: string;
}

export interface ASOMobileKeywordCheckResult {
  keyword: string;
  traffic_score: number;
  sap: number;
  competition: number;
  total_apps: number;
}

export interface ASOMobileSuggestResult {
  keywords: Array<{
    keyword: string;
    traffic_score: number;
    sap: number;
    competition: number;
  }>;
}

export interface ASOMobilePositionResult {
  app_id: string;
  keyword: string;
  position: number | null;
  country: string;
}

export interface ASOMobileAppProfile {
  app_id: string;
  name: string;
  bundle_id: string;
  category: string;
  rating: number;
  review_count: number;
  icon_url: string;
}
