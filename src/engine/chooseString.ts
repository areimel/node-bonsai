/**
 * Glyph selection for a branch step. Port of cbonsai `chooseString()`.
 *
 * The full glyph lookup table is in STYLEGUIDE.md §2 (and ALGORITHM.md §4),
 * including the `life < 4` -> leaf override.
 *
 * TODO(next session): implement the glyph table. Typed stub for now.
 */
import type { BranchType } from '../config.js';

export function chooseString(
  _type: BranchType,
  _life: number,
  _dx: number,
  _dy: number,
  _leaves: string[],
  _rng: () => number,
): string {
  throw new Error('chooseString: not yet implemented — see STYLEGUIDE.md §2');
}
