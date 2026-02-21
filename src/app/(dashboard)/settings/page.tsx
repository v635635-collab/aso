"use client";

import * as React from "react";
import { Loader2, Eye, EyeOff, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { FormSkeleton } from "@/components/shared/loading-skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi, useApiMutation } from "@/hooks/use-api";

interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  type: "STRING" | "NUMBER" | "BOOLEAN" | "SELECT" | "SECRET" | "JSON";
  category: string;
  label: string;
  description: string | null;
  options: string[] | null;
  isSecret: boolean;
}

const categoryLabels: Record<string, string> = {
  push: "Push Campaigns",
  monitoring: "Monitoring",
  ai: "AI / GPT",
  telegram: "Telegram",
  data: "Data Sources",
  notifications: "Notifications",
  trends: "Trends",
  general: "General",
};

function groupByCategory(settings: SystemSetting[]) {
  const groups: Record<string, SystemSetting[]> = {};
  for (const s of settings) {
    const cat = s.category || "general";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(s);
  }
  return groups;
}

export default function SettingsPage() {
  const { data: settings, loading, mutate } = useApi<SystemSetting[]>("/api/settings");

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Configure system-wide settings for the ASO Engine."
        />

        {loading ? (
          <FormSkeleton />
        ) : !settings?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No settings configured yet.
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupByCategory(settings)).map(([category, items]) => (
            <SettingsSection
              key={category}
              category={category}
              settings={items}
              onSaved={mutate}
            />
          ))
        )}
      </div>
    </ErrorBoundary>
  );
}

function SettingsSection({
  category,
  settings,
  onSaved,
}: {
  category: string;
  settings: SystemSetting[];
  onSaved: () => Promise<void>;
}) {
  const [values, setValues] = React.useState<Record<string, unknown>>(() => {
    const v: Record<string, unknown> = {};
    for (const s of settings) v[s.key] = s.value;
    return v;
  });
  const [revealedSecrets, setRevealedSecrets] = React.useState<Set<string>>(new Set());

  const { trigger, loading } = useApiMutation<
    { settings: Array<{ key: string; value: unknown }> },
    void
  >("/api/settings", "PATCH");

  const handleSave = async () => {
    const changed = settings
      .filter((s) => values[s.key] !== s.value)
      .map((s) => ({ key: s.key, value: values[s.key] }));
    if (!changed.length) return;
    await trigger({ settings: changed });
    await onSaved();
  };

  const toggleSecret = (key: string) => {
    setRevealedSecrets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {categoryLabels[category] ?? category}
        </CardTitle>
        <CardDescription>
          Manage {(categoryLabels[category] ?? category).toLowerCase()} settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.map((setting) => (
          <div key={setting.key} className="grid gap-2">
            <Label htmlFor={setting.key}>{setting.label}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground">
                {setting.description}
              </p>
            )}

            {setting.type === "BOOLEAN" ? (
              <Switch
                id={setting.key}
                checked={!!values[setting.key]}
                onCheckedChange={(checked) =>
                  setValues((v) => ({ ...v, [setting.key]: checked }))
                }
              />
            ) : setting.type === "SELECT" && setting.options ? (
              <Select
                value={String(values[setting.key] ?? "")}
                onValueChange={(val) =>
                  setValues((v) => ({ ...v, [setting.key]: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(setting.options as string[]).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : setting.type === "SECRET" ? (
              <div className="flex gap-2">
                <Input
                  id={setting.key}
                  type={revealedSecrets.has(setting.key) ? "text" : "password"}
                  value={String(values[setting.key] ?? "")}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [setting.key]: e.target.value }))
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => toggleSecret(setting.key)}
                >
                  {revealedSecrets.has(setting.key) ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            ) : setting.type === "NUMBER" ? (
              <Input
                id={setting.key}
                type="number"
                value={String(values[setting.key] ?? "")}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    [setting.key]: e.target.value ? Number(e.target.value) : "",
                  }))
                }
              />
            ) : (
              <Input
                id={setting.key}
                type="text"
                value={String(values[setting.key] ?? "")}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [setting.key]: e.target.value }))
                }
              />
            )}
          </div>
        ))}

        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Save className="mr-2 size-4" />
          )}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
