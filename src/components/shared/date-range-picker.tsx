"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onChange: (range: { from: Date; to: Date }) => void;
  presets?: { label: string; from: Date; to: Date }[];
  className?: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

function formatDisplay(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const defaultPresets: DateRangePickerProps["presets"] = [
  {
    label: "Last 7 days",
    from: new Date(Date.now() - 7 * 86400000),
    to: new Date(),
  },
  {
    label: "Last 30 days",
    from: new Date(Date.now() - 30 * 86400000),
    to: new Date(),
  },
  {
    label: "Last 90 days",
    from: new Date(Date.now() - 90 * 86400000),
    to: new Date(),
  },
  {
    label: "This month",
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  },
  {
    label: "This year",
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  },
];

export function DateRangePicker({
  from,
  to,
  onChange,
  presets = defaultPresets,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [localFrom, setLocalFrom] = React.useState(from ? formatDate(from) : "");
  const [localTo, setLocalTo] = React.useState(to ? formatDate(to) : "");

  React.useEffect(() => {
    if (from) setLocalFrom(formatDate(from));
    if (to) setLocalTo(formatDate(to));
  }, [from, to]);

  const handleApply = () => {
    if (localFrom && localTo) {
      onChange({ from: new Date(localFrom), to: new Date(localTo) });
      setOpen(false);
    }
  };

  const handlePreset = (preset: { from: Date; to: Date }) => {
    setLocalFrom(formatDate(preset.from));
    setLocalTo(formatDate(preset.to));
    onChange({ from: preset.from, to: preset.to });
    setOpen(false);
  };

  const displayText =
    from && to
      ? `${formatDisplay(from)} – ${formatDisplay(to)}`
      : "Select date range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !from && "text-muted-foreground",
            className
          )}
        >
          <CalendarDays className="mr-2 size-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {presets && presets.length > 0 && (
            <div className="border-r p-3 space-y-1">
              {presets?.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="block w-full rounded-sm px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
                  onClick={() => handlePreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
          <div className="p-3 space-y-3">
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                From
              </label>
              <Input
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                To
              </label>
              <Input
                type="date"
                value={localTo}
                onChange={(e) => setLocalTo(e.target.value)}
                className="h-8"
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={handleApply}
              disabled={!localFrom || !localTo}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
