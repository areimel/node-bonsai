/**
 * The engine's output contract — frozen before the parallel render/CLI work so
 * every consumer (static, --live, --print, --save/--load) builds against it.
 *
 * The engine runs ONCE and emits an ordered "growth tape" (`Step[]`) in draw
 * order. Every render mode is just a different consumer of that one tape:
 *   - static  : fold the whole tape onto a Grid
 *   - --live  : reveal a growing prefix over time (tickStops give the cadence)
 *   - --print : fold the whole tape, serialize, console.log
 *   - --load  : jump to the prefix length recorded in branchStops
 *
 * See ALGORITHM.md and the plan for the rationale (the recursion order in
 * branch() *is* the animation order).
 */
import type { ColorPair } from '../config.js';

/** A single cell write, already expanded to one character (see grow.ts). */
export interface Step {
  x: number;
  y: number;
  char: string;
  pair: ColorPair;
  bold: boolean;
}

/** The full deterministic result of one tree grow. */
export interface GrowthResult {
  /** Draw tape: base/pot steps first, then the tree, in draw order. */
  steps: Step[];
  width: number;
  height: number;
  /** counters.branches at the end — persisted by --save. */
  branchCount: number;
  /** The RESOLVED seed (clock-derived when config.seed === 0) — persisted by --save. */
  seed: number;
  /**
   * Step-prefix length at each branch-loop iteration boundary. Live mode reveals
   * the tape one tickStop at a time to match cbonsai's "one nanosleep per step".
   */
  tickStops: number[];
  /**
   * Step-prefix length at each `branches++`. --load maps a saved targetBranchCount
   * to the step index to fast-forward to.
   */
  branchStops: number[];
}
