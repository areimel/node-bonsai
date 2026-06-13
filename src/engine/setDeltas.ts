/**
 * Per-step movement (dx/dy) for a branch. Port of cbonsai `setDeltas()`.
 *
 * The dice tables for each branch type are specified in ALGORITHM.md §3.
 *
 * TODO(next session): implement the dice tables. Kept as a typed stub so the
 * surrounding modules type-check against the intended signature.
 */
import type { BranchType } from '../config.js';

export interface Deltas {
  dx: number;
  dy: number;
}

export function setDeltas(
  _type: BranchType,
  _life: number,
  _age: number,
  _multiplier: number,
  /** Returns a float in [0, 1); inject a seeded RNG for deterministic trees. */
  _rng: () => number,
): Deltas {
  throw new Error('setDeltas: not yet implemented — see ALGORITHM.md §3');
}
