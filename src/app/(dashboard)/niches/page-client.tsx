'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { NicheCard } from '@/components/niches/niche-card';
import { EmptyState } from '@/components/shared/empty-state';
import { useApiMutation } from '@/hooks/use-api';
import { Layers, Plus, Search, Loader2 } from 'lucide-react';

interface Niche {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  totalTraffic: number;
  avgSAP: number;
  avgCompetition: number;
  keywordCount: number;
  riskLevel: string;
  _count: { keywords: number; apps: number };
}

interface Props {
  niches: Niche[];
  search: string;
  riskLevel: string;
}

export function NichesPageClient({ niches, search: initialSearch, riskLevel: initialRisk }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [showCreate, setShowCreate] = useState(false);
  const [newNiche, setNewNiche] = useState({ name: '', displayName: '', description: '', riskLevel: 'MEDIUM' });

  const { trigger: createNiche, loading: creating } = useApiMutation<
    typeof newNiche,
    Niche
  >('/api/niches');

  const updateParams = (updates: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    router.push(`/niches?${sp.toString()}`);
  };

  const handleCreate = async () => {
    try {
      await createNiche(newNiche);
      setShowCreate(false);
      setNewNiche({ name: '', displayName: '', description: '', riskLevel: 'MEDIUM' });
      router.refresh();
    } catch {
      // handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="size-6" />
            Niches
          </h1>
          <p className="text-muted-foreground mt-1">
            Group keywords into semantic niches for targeted ASO strategies.
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4 mr-1" />
              Create Niche
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Niche</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Slug (unique name)</Label>
                <Input
                  value={newNiche.name}
                  onChange={(e) => setNewNiche({ ...newNiche, name: e.target.value })}
                  placeholder="e.g. vpn-tools"
                />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={newNiche.displayName}
                  onChange={(e) => setNewNiche({ ...newNiche, displayName: e.target.value })}
                  placeholder="e.g. VPN Tools"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newNiche.description}
                  onChange={(e) => setNewNiche({ ...newNiche, description: e.target.value })}
                  placeholder="Brief description…"
                />
              </div>
              <div className="space-y-2">
                <Label>Risk Level</Label>
                <Select
                  value={newNiche.riskLevel}
                  onValueChange={(v) => setNewNiche({ ...newNiche, riskLevel: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={creating || !newNiche.name || !newNiche.displayName} className="w-full">
                {creating ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Plus className="size-4 mr-1" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setTimeout(() => updateParams({ search: e.target.value || undefined }), 400);
            }}
            placeholder="Search niches…"
            className="pl-9"
          />
        </div>
        <Select
          value={initialRisk || 'all'}
          onValueChange={(v) => updateParams({ riskLevel: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Risk Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {niches.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {niches.map((niche) => (
            <NicheCard key={niche.id} niche={niche} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No niches found"
          description="Create your first niche to start grouping keywords."
          action={{ label: 'Create Niche', onClick: () => setShowCreate(true) }}
        />
      )}
    </div>
  );
}
