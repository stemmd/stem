import { useCallback, useEffect, useState } from "react";

export type Density = "airy" | "medium" | "dense";

const AIRY_MAX = 12;
const MEDIUM_MAX = 40;

function autoDensity(itemCount: number): Density {
  if (itemCount <= AIRY_MAX) return "airy";
  if (itemCount <= MEDIUM_MAX) return "medium";
  return "dense";
}

function storageKey(stemId: string): string {
  return `stem-density:${stemId}`;
}

function readOverride(stemId: string): Density | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(storageKey(stemId));
    if (v === "airy" || v === "medium" || v === "dense") return v;
  } catch {
    // noop — private mode / disabled storage
  }
  return null;
}

/**
 * useDensity — derives a density mode for a stem.
 *
 * Auto mode is computed from the total item count on the stem.
 * The owner (or anyone, really) can override and the choice is
 * persisted per-stem in localStorage.
 */
export function useDensity(stemId: string, itemCount: number): {
  density: Density;
  override: Density | null;
  setOverride: (value: Density | null) => void;
} {
  const auto = autoDensity(itemCount);
  const [override, setOverrideState] = useState<Density | null>(null);

  // Read override from localStorage once on mount / stem change
  useEffect(() => {
    setOverrideState(readOverride(stemId));
  }, [stemId]);

  const setOverride = useCallback(
    (value: Density | null) => {
      setOverrideState(value);
      if (typeof window === "undefined") return;
      try {
        if (value === null) {
          window.localStorage.removeItem(storageKey(stemId));
        } else {
          window.localStorage.setItem(storageKey(stemId), value);
        }
      } catch {
        // noop
      }
    },
    [stemId]
  );

  return {
    density: override ?? auto,
    override,
    setOverride,
  };
}
