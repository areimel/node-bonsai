/**
 * Bridge from the engine's growth tape (Step[]) to the central Grid renderer.
 *
 * Pure and Ink-free so it can be unit-tested directly. `foldSteps` builds a fresh
 * Grid (static / --print); `applySteps` mutates an existing Grid in place so live
 * mode can reveal new steps incrementally (O(Δ) per tick instead of O(n)).
 */
import { Grid, type Cell } from './canvas.js';
import type { Step } from '../engine/types.js';

/** Apply `steps[0..count)` onto a fresh Grid. */
export function foldSteps(
  steps: Step[],
  width: number,
  height: number,
  count: number = steps.length,
): Grid {
  const grid = new Grid(width, height);
  applySteps(grid, steps, 0, count);
  return grid;
}

/** Apply `steps[from..to)` onto an existing Grid in place. */
export function applySteps(grid: Grid, steps: Step[], from: number, to: number): void {
  const end = Math.min(to, steps.length);
  for (let i = Math.max(0, from); i < end; i++) {
    const s = steps[i]!;
    const cell: Cell = { char: s.char, pair: s.pair, bold: s.bold };
    grid.set(s.x, s.y, cell);
  }
}
