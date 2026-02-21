"use client";

import { useEffect } from "react";

interface ShortcutOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {}
): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { ctrl = false, shift = false, alt = false } = options;

      if (ctrl !== (e.ctrlKey || e.metaKey)) return;
      if (shift !== e.shiftKey) return;
      if (alt !== e.altKey) return;
      if (e.key.toLowerCase() !== key.toLowerCase()) return;

      e.preventDefault();
      callback();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback, options]);
}
