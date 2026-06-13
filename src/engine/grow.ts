/**
 * Tree growth — the recursive core. Port of cbonsai `growTree()` / `branch()`.
 *
 * Seeds a trunk at the bottom-center and recursively grows branches, shoots,
 * and leaf bursts into a Grid. The full recursion and spawn rules are specified
 * in ALGORITHM.md §6; it should consume `setDeltas` and `chooseString` and a
 * seeded RNG so output is deterministic for a given seed.
 *
 * TODO(next session): implement the recursive growth. Typed stub for now.
 */
import type { Config } from '../config.js';
import { Grid } from '../render/canvas.js';

export function growTree(_config: Config, _width: number, _height: number): Grid {
  throw new Error('growTree: not yet implemented — see ALGORITHM.md §6');
}
