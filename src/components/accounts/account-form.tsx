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

interface AccountFormData {
  id?: string;
  email: string;
  teamName?: string;
  teamId?: string;
  status: string;
  maxApps: number;
  expiresAt?: string;
  notes?: string;
}

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<AccountFormData>;
  mode?: 'create' | 'edit';
}

const defaultForm: AccountFormData = {
  email: '', status: 'ACTIVE', maxApps: 30,
};

export function AccountForm({ open, onOpenChange, initialData, mode = 'create' }: AccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<AccountFormData>({ ...defaultForm, ...initialData });

  const set = (key: keyof AccountFormData, value: string | number) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = mode === 'edit' ? `/api/accounts/${form.id}` : '/api/accounts';
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxApps: Number(form.maxApps),
          expiresAt: form.expiresAt || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || 'Failed to save account');
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Account' : 'Add Apple Developer Account'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="teamName">Team Name</Label>
              <Input id="teamName" value={form.teamName || ''} onChange={(e) => set('teamName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teamId">Team ID</Label>
              <Input id="teamId" value={form.teamId || ''} onChange={(e) => set('teamId', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acctStatus">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger id="acctStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="BANNED">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxApps">Max Apps</Label>
              <Input id="maxApps" type="number" min={1} value={form.maxApps} onChange={(e) => set('maxApps', Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expiresAt">Expires At</Label>
            <Input id="expiresAt" type="datetime-local" value={form.expiresAt?.slice(0, 16) || ''} onChange={(e) => set('expiresAt', e.target.value ? new Date(e.target.value).toISOString() : '')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acctNotes">Notes</Label>
            <Textarea id="acctNotes" value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
