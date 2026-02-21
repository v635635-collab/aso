import { queryKeywordsTool } from './query-keywords';
import { queryAppsTool } from './query-apps';
import { queryNichesTool } from './query-niches';
import { queryCampaignsTool } from './query-campaigns';
import { queryPositionsTool } from './query-positions';
import { queryPessimizationsTool } from './query-pessimizations';
import { getSystemStatsTool } from './get-system-stats';
import type { AITool } from './types';

export const AI_TOOLS: AITool[] = [
  queryKeywordsTool,
  queryAppsTool,
  queryNichesTool,
  queryCampaignsTool,
  queryPositionsTool,
  queryPessimizationsTool,
  getSystemStatsTool,
];

export const AI_TOOLS_MAP = new Map(AI_TOOLS.map(t => [t.name, t]));
