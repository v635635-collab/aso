import type { ASOMobileEndpointName } from './types';

export interface EndpointConfig {
  path: string;
  method: 'POST';
  description: string;
  resultPath: string;
}

export const ASOMOBILE_ENDPOINTS: Record<ASOMobileEndpointName, EndpointConfig> = {
  'keyword-check': {
    path: '/keyword-check',
    method: 'POST',
    description: 'Check keyword metrics (traffic, SAP, competition)',
    resultPath: '/keyword-check/result',
  },
  'keyword-suggest': {
    path: '/keyword-suggest',
    method: 'POST',
    description: 'Get keyword suggestions based on a seed keyword',
    resultPath: '/keyword-suggest/result',
  },
  'keyword-rank': {
    path: '/keyword-rank',
    method: 'POST',
    description: 'Check app position for a keyword',
    resultPath: '/keyword-rank/result',
  },
  'app-profile': {
    path: '/app-profile',
    method: 'POST',
    description: 'Get app profile data from store',
    resultPath: '/app-profile/result',
  },
  'app-keywords': {
    path: '/app-keywords',
    method: 'POST',
    description: 'Get indexed keywords for an app',
    resultPath: '/app-keywords/result',
  },
  'worldwide-check': {
    path: '/worldwide-check',
    method: 'POST',
    description: 'Check keyword metrics across all countries',
    resultPath: '/worldwide-check/result',
  },
};
