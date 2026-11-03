"use client";

import { useEffect } from "react";

/**
 * Runs an async dashboard loader after mount (and whenever `load` changes).
 *
 * Data lives behind authenticated JSON APIs rather than server components, so
 * these screens intentionally fetch on mount and toggle loading/error state.
 * Centralizing the pattern here keeps `react-hooks/set-state-in-effect` active
 * for effect bodies that really do set state directly.
 */
export function useAsyncEffect(load: () => void | Promise<void>) {
  useEffect(() => {
    void load();
  }, [load]);
}
