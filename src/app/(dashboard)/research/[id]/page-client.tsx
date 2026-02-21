'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResearchProgress } from '@/components/research/research-progress';
import { ResearchResults } from '@/components/research/research-results';
import { useApiMutation } from '@/hooks/use-api';
import { ArrowLeft, Pause, Play, Loader2, AlertCircle } from 'lucide-react';

interface ResearchSession {
  id: string;
  name: string;
  status: string;
  seedKeywords: string[];
  targetCountry: string;
  targetLocale: string;
  foundKeywords: number;
  processedSeeds: number;
  totalSeeds: number;
  maxKeywords: number;
  minTraffic: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  niche: { id: string; displayName: string } | null;
  keywords: Array<{
    id: string;
    discoveryMethod: string;
    depth: number;
    keyword: {
      id: string;
      text: string;
      trafficScore: number | null;
      sap: number | null;
      competition: number | null;
      difficulty: number | null;
    };
  }>;
}

interface Props {
  session: ResearchSession;
}

export function ResearchDetailClient({ session }: Props) {
  const router = useRouter();

  const { trigger: pauseSession, loading: pausing } = useApiMutation<void, unknown>(
    `/api/research/${session.id}/pause`,
  );

  const { trigger: resumeSession, loading: resuming } = useApiMutation<void, unknown>(
    `/api/research/${session.id}/resume`,
  );

  const handlePause = async () => {
    await pauseSession();
    router.refresh();
  };

  const handleResume = async () => {
    await resumeSession();
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/research">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Badge variant="outline">{session.targetCountry} / {session.targetLocale}</Badge>
            {session.niche && (
              <Link href={`/niches/${session.niche.id}`} className="text-primary hover:underline">
                {session.niche.displayName}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.status === 'RUNNING' && (
            <Button variant="outline" onClick={handlePause} disabled={pausing}>
              {pausing ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Pause className="size-4 mr-1" />}
              Pause
            </Button>
          )}
          {session.status === 'PAUSED' && (
            <Button onClick={handleResume} disabled={resuming}>
              {resuming ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Play className="size-4 mr-1" />}
              Resume
            </Button>
          )}
        </div>
      </div>

      {session.errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 p-4">
          <AlertCircle className="size-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{session.errorMessage}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Session Info</CardTitle>
          </CardHeader>
          <CardContent>
            <ResearchProgress
              status={session.status}
              processedSeeds={session.processedSeeds}
              totalSeeds={session.totalSeeds}
              foundKeywords={session.foundKeywords}
              maxKeywords={session.maxKeywords}
            />
            <div className="mt-4 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Min Traffic</span>
                <span>{session.minTraffic}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Keywords</span>
                <span>{session.maxKeywords}</span>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Seed Keywords</p>
              <div className="flex flex-wrap gap-1">
                {session.seedKeywords.map((seed) => (
                  <Badge key={seed} variant="secondary" className="text-[10px]">
                    {seed}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <ResearchResults keywords={session.keywords} />
        </div>
      </div>
    </div>
  );
}
