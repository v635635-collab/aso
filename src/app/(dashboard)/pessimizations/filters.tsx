'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface PessimizationsFiltersProps {
  severity: string;
  status: string;
  appId: string;
  apps: Array<{ id: string; name: string }>;
}

export function PessimizationsFilters({ severity, status, appId, apps }: PessimizationsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/pessimizations?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={severity || 'all'} onValueChange={(v) => updateParam('severity', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All severities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All severities</SelectItem>
          <SelectItem value="MINOR">Minor</SelectItem>
          <SelectItem value="MODERATE">Moderate</SelectItem>
          <SelectItem value="SEVERE">Severe</SelectItem>
          <SelectItem value="CRITICAL">Critical</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status || 'all'} onValueChange={(v) => updateParam('status', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="DETECTED">Detected</SelectItem>
          <SelectItem value="ANALYZING">Analyzing</SelectItem>
          <SelectItem value="MITIGATING">Mitigating</SelectItem>
          <SelectItem value="RESOLVED">Resolved</SelectItem>
          <SelectItem value="ACCEPTED">Accepted</SelectItem>
        </SelectContent>
      </Select>

      <Select value={appId || 'all'} onValueChange={(v) => updateParam('appId', v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All apps" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All apps</SelectItem>
          {apps.map((app) => (
            <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
