/// <reference types="node" />
/**
 * useGrowthAnimation — drives the live reveal of a precomputed bonsai growth tape.
 *
 * The engine runs once per tree; this hook only controls how much of the tape
 * is visible. Position is stored with the `result` it belongs to, so a new
 * result implicitly restarts at frame 0 with no render-phase state updates.
 * One-shot `setTimeout`s are re-armed per tick and cleared on cleanup.
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
  const [pos, setPos] = useState({ result, frame: 0 });
  const frameIndex = pos.result === result ? pos.frame : 0;
  const visible = opts.live ? (result.tickStops[frameIndex] ?? result.steps.length) : result.steps.length;

  useEffect(() => {
    if (!opts.live || visible >= result.steps.length) return;
    const id = setTimeout(
      () => setPos({ result, frame: frameIndex + 1 }),
      Math.max(1, opts.timeStepSec * 1000),
    );
    return () => clearTimeout(id);
  }, [frameIndex, visible, result, opts.live, opts.timeStepSec]);

  // Persistent grid for the current result; only steps [applied, visible) are folded in.
  const fold = useRef({ result, grid: new Grid(result.width, result.height), applied: 0 });

  const frame = useMemo(() => {
    if (fold.current.result !== result) {
      fold.current = { result, grid: new Grid(result.width, result.height), applied: 0 };
    }
    const f = fold.current;
    if (visible > f.applied) {
      applySteps(f.grid, result.steps, f.applied, visible);
      f.applied = visible;
    }
    return gridToString(f.grid, colorize);
  }, [visible, colorize, result]);

  return { frame, done: visible >= result.steps.length };
}
