import type { ASOMobileEndpointName } from './types';

export interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST';
  description: string;
  resultPath: string;
}

export const ASOMOBILE_ENDPOINTS: Record<ASOMobileEndpointName, EndpointConfig> = {
  'keyword-check': {
    path: '/keyword-check/',
    method: 'GET',
    description: 'Check keyword metrics (traffic, SAP, competition)',
    resultPath: '/keyword-check/result',
  },
  'keyword-suggest': {
    path: '/keyword-suggest',
    method: 'POST',
    description: 'Get keyword suggestions based on seed keywords',
    resultPath: '/keyword-suggest/result',
  },
  'keyword-rank': {
    path: '/keyword-rank/',
    method: 'GET',
    description: 'Check app position for a keyword',
    resultPath: '/keyword-rank/result',
  },
  'app-profile': {
    path: '/apps/app/profile',
    method: 'GET',
    description: 'Get app profile data from store',
    resultPath: '/apps/app/profile/result',
  },
  'app-keywords': {
    path: '/app-keywords/',
    method: 'GET',
    description: 'Get indexed keywords for an app',
    resultPath: '/app-keywords/result',
  },
  'worldwide-check': {
    path: '/world-wide-check',
    method: 'POST',
    description: 'Check keyword metrics across all countries',
    resultPath: '/world-wide-check/result',
  },
};
