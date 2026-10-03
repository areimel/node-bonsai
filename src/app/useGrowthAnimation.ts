/// <reference types="node" />
/**
 * useGrowthAnimation — drives the live reveal of a precomputed bonsai growth tape.
 *
 * The engine runs exactly once and emits a fully deterministic `GrowthResult`
 * (an ordered Step[] tape plus `tickStops` marking frame boundaries). This hook
 * is solely responsible for controlling *how much* of that tape is currently
 * visible — it never touches the engine again. One-shot `setTimeout` calls are
 * re-armed per tick so cleanup is exact: no double-fires, no interval drift,
 * and no leaks when the component unmounts or the result changes mid-animation.
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import type { GrowthResult } from '../engine/types.js';
import { Grid, gridToString } from '../render/canvas.js';
import type { Colorize } from '../render/colors.js';
import { applySteps } from '../render/fold.js';

export interface GrowthAnimationState {
  frame: string;
  done: boolean;
}

export function useGrowthAnimation(
  result: GrowthResult,
  colorize: Colorize,
  opts: { live: boolean; timeStepSec: number },
): GrowthAnimationState {
  // -------------------------------------------------------------------------
  // Helpers to compute the initial state values for a given result.
  // -------------------------------------------------------------------------
  const initialVisibleCount = (r: GrowthResult): number =>
    opts.live ? (r.tickStops[0] ?? 0) : r.steps.length;

  const initialFrameIndex = (r: GrowthResult): number =>
    opts.live ? 0 : r.tickStops.length;

  // -------------------------------------------------------------------------
  // State: how many steps are currently visible and which tickStop index we
  // are at (frame index tracks position in tickStops, not in steps directly).
  // -------------------------------------------------------------------------
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    initialVisibleCount(result),
  );
  const [frameIndex, setFrameIndex] = useState<number>(() =>
    initialFrameIndex(result),
  );

  // -------------------------------------------------------------------------
  // Refs: persistent grid, applied-steps cursor, and the previous result ref
  // for detecting identity change of `result` (infinite-mode tree rotation).
  // -------------------------------------------------------------------------
  const gridRef = useRef<Grid>(new Grid(result.width, result.height));
  const appliedRef = useRef<number>(0);
  const prevResultRef = useRef<GrowthResult>(result);

  // -------------------------------------------------------------------------
  // Detect a change in `result` identity and reset synchronously during render
  // (the standard "adjust state when props change" React pattern).
  // This avoids a flash of stale content that an effect-based reset would cause.
  // -------------------------------------------------------------------------
  if (prevResultRef.current !== result) {
    prevResultRef.current = result;
    gridRef.current = new Grid(result.width, result.height);
    appliedRef.current = 0;
    const newVisible = initialVisibleCount(result);
    const newIndex = initialFrameIndex(result);
    // Calling the setters during render schedules a re-render with new state.
    setVisibleCount(newVisible);
    setFrameIndex(newIndex);
  }

  // -------------------------------------------------------------------------
  // Live timer: one-shot setTimeout re-armed per tick.
  // Depends on frameIndex so it re-runs each time we advance one tickStop.
  // Stops arming once we have revealed the full tape.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!opts.live) return;
    if (visibleCount >= result.steps.length) return;

    const delay = Math.max(1, opts.timeStepSec * 1000);
    const id = setTimeout(() => {
      const nextIndex = frameIndex + 1;
      const nextCount = result.tickStops[nextIndex] ?? result.steps.length;
      setFrameIndex(nextIndex);
      setVisibleCount(nextCount);
    }, delay);

    return () => clearTimeout(id);
    // frameIndex is the tick-gate; visibleCount is derived but included for
    // the guard above. result and opts values complete the dependency set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIndex, visibleCount, result, opts.live, opts.timeStepSec]);

  // -------------------------------------------------------------------------
  // Incremental fold: apply only the *new* steps since the last render.
  // useMemo re-runs when visibleCount, colorize, or result changes.
  // -------------------------------------------------------------------------
  const frame = useMemo(() => {
    const grid = gridRef.current;
    const from = appliedRef.current;
    const to = visibleCount;

    if (to > from) {
      applySteps(grid, result.steps, from, to);
      appliedRef.current = to;
    }

    return gridToString(grid, colorize);
    // gridRef and appliedRef are mutable refs — intentionally omitted from
    // deps (they are implementation details, not reactive values).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCount, colorize, result]);

  return { frame, done: visibleCount >= result.steps.length };
}
