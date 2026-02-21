export const TOKEN_BUDGET = 4000;
export const MAX_TITLE_LENGTH = 200;
export const MAX_SUBTITLE_LENGTH = 30;
export const MAX_KEYWORD_FIELD_LENGTH = 100;
export const DEFAULT_LOCALE = 'ru';
export const DEFAULT_COUNTRY = 'RU';
export const MAX_ROWS_PER_PAGE = 100;
export const DEFAULT_ROWS_PER_PAGE = 20;
export const ASOMOBILE_RPM = parseInt(process.env.ASOMOBILE_RPM || '60');
export const ASOMOBILE_DAILY_LIMIT = parseInt(process.env.ASOMOBILE_DAILY_LIMIT || '5000');
export const POSITION_CHECK_INTERVAL_HOURS = 6;
export const PESSIMIZATION_THRESHOLDS = {
  MINOR: { min: 5, max: 15 },
  MODERATE: { min: 15, max: 30 },
  SEVERE: { min: 30, max: Infinity },
};
