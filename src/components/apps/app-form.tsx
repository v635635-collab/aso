'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface Account {
  id: string;
  email: string;
  teamName?: string | null;
}

interface AppFormData {
  id?: string;
  appleId: string;
  bundleId: string;
  name: string;
  subtitle?: string;
  currentTitle?: string;
  currentSubtitle?: string;
  type: string;
  category?: string;
  storeUrl?: string;
  iconUrl?: string;
  status: string;
  locale: string;
  country: string;
  accountId: string;
  tags: string[];
  notes?: string;
}

interface AppFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  initialData?: Partial<AppFormData>;
  mode?: 'create' | 'edit';
}

const defaultForm: AppFormData = {
  appleId: '', bundleId: '', name: '', type: 'NATIVE',
  status: 'DRAFT', locale: 'ru', country: 'RU', accountId: '', tags: [],
};

export function AppForm({ open, onOpenChange, accounts, initialData, mode = 'create' }: AppFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<AppFormData>({ ...defaultForm, ...initialData });

  const set = (key: keyof AppFormData, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = mode === 'edit' ? `/api/apps/${form.id}` : '/api/apps';
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.length > 0 ? form.tags : [],
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || 'Failed to save app');
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit App' : 'Add Application'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accountId">Account *</Label>
              <Select value={form.accountId || undefined} onValueChange={(v) => set('accountId', v)}>
                <SelectTrigger id="accountId"><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.teamName || a.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="appleId">Apple ID *</Label>
              <Input id="appleId" value={form.appleId} onChange={(e) => set('appleId', e.target.value)} required placeholder="e.g. 1234567890" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bundleId">Bundle ID *</Label>
              <Input id="bundleId" value={form.bundleId} onChange={(e) => set('bundleId', e.target.value)} required placeholder="e.g. com.company.app" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIVE">Native</SelectItem>
                  <SelectItem value="WEBVIEW">WebView</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="LIVE">Live</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="REMOVED">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input id="subtitle" value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={form.category || ''} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Games" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storeUrl">Store URL</Label>
              <Input id="storeUrl" value={form.storeUrl || ''} onChange={(e) => set('storeUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="locale">Locale</Label>
              <Input id="locale" value={form.locale} onChange={(e) => set('locale', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={(e) => set('country', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Save Changes' : 'Create App'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
