export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
  requestId: string;
  timestamp: string;
}

export interface ApiRequestInit extends RequestInit {
  params?: Record<string, string>;
}
