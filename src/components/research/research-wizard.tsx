'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TagInput } from '@/components/shared/tag-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiMutation } from '@/hooks/use-api';
import { ArrowLeft, ArrowRight, Loader2, Rocket, KeyRound, Settings, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const COUNTRIES = [
  { value: 'RU', label: 'Russia' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'BR', label: 'Brazil' },
  { value: 'IN', label: 'India' },
  { value: 'JP', label: 'Japan' },
];

const LOCALES = [
  { value: 'ru', label: 'Russian' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
];

interface ResearchConfig {
  name: string;
  seedKeywords: string[];
  targetCountry: string;
  targetLocale: string;
  maxKeywords: number;
  minTraffic: number;
}

export function ResearchWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<ResearchConfig>({
    name: '',
    seedKeywords: [],
    targetCountry: 'RU',
    targetLocale: 'ru',
    maxKeywords: 500,
    minTraffic: 5,
  });

  const { trigger: startResearch, loading } = useApiMutation<
    ResearchConfig,
    { id: string }
  >('/api/research');

  const steps = [
    { title: 'Seed Keywords', icon: KeyRound },
    { title: 'Configuration', icon: Settings },
    { title: 'Review & Start', icon: CheckCircle },
  ];

  const canProceed = () => {
    if (step === 0) return config.seedKeywords.length > 0 && config.name.trim().length > 0;
    if (step === 1) return config.maxKeywords > 0 && config.minTraffic >= 0;
    return true;
  };

  const handleStart = async () => {
    try {
      const result = await startResearch(config);
      router.push(`/research/${result.id}`);
    } catch {
      // handled by hook
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center">
              <div
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  i === step
                    ? 'bg-primary text-primary-foreground'
                    : i < step
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-4" />
                {s.title}
              </div>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[step].title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Research Name</Label>
                <Input
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="e.g. VPN Keywords Q1 2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Seed Keywords</Label>
                <p className="text-sm text-muted-foreground">
                  Enter keywords to use as starting points for research.
                </p>
                <TagInput
                  value={config.seedKeywords}
                  onChange={(seeds) => setConfig({ ...config, seedKeywords: seeds })}
                  placeholder="Type a keyword and press Enter…"
                  maxTags={50}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={config.targetCountry}
                    onValueChange={(v) => setConfig({ ...config, targetCountry: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Locale</Label>
                  <Select
                    value={config.targetLocale}
                    onValueChange={(v) => setConfig({ ...config, targetLocale: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LOCALES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Keywords</Label>
                  <Input
                    type="number"
                    value={config.maxKeywords}
                    onChange={(e) => setConfig({ ...config, maxKeywords: Number(e.target.value) })}
                    min={10}
                    max={5000}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Traffic Score</Label>
                  <Input
                    type="number"
                    value={config.minTraffic}
                    onChange={(e) => setConfig({ ...config, minTraffic: Number(e.target.value) })}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{config.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seeds</span>
                  <span className="font-medium">{config.seedKeywords.length} keywords</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Country / Locale</span>
                  <span className="font-medium">{config.targetCountry} / {config.targetLocale}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Keywords</span>
                  <span className="font-medium">{config.maxKeywords}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min Traffic</span>
                  <span className="font-medium">{config.minTraffic}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {config.seedKeywords.map((seed) => (
                  <span key={seed} className="rounded-md bg-muted px-2 py-0.5 text-xs">{seed}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>

        {step < 2 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="size-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleStart} disabled={loading || !canProceed()}>
            {loading ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Rocket className="size-4 mr-1" />}
            Start Research
          </Button>
        )}
      </div>
    </div>
  );
}
