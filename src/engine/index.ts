/**
 * Engine composition root — the one entry point every render mode calls.
 *
 * Resolves the canvas size, draws the pot, grows the tree in the rows above it,
 * and concatenates the two into a single ordered growth tape. Pure given
 * (config, size, seed): the same inputs always yield the same `GrowthResult`, so
 * static / --live / --print / --save all share one deterministic run.
 */
import type { Config } from '../config.js';
import type { GrowthResult } from './types.js';
import { drawBase } from './base.js';
import { growTree } from './grow.js';

export interface TermSize {
  width: number;
  height: number;
}

/** Fallback canvas size when stdout dimensions are unavailable (e.g. piped). */
const FALLBACK_SIZE: TermSize = { width: 80, height: 24 };

export function runEngine(
  config: Config,
  size: TermSize = FALLBACK_SIZE,
  seedOverride?: number,
): GrowthResult {
  const width = Math.max(1, size.width || FALLBACK_SIZE.width);
  const totalHeight = Math.max(1, size.height || FALLBACK_SIZE.height);

  // pot first: it occupies the bottom rows and is shown immediately
  const { steps: baseSteps, baseHeight } = drawBase(config.base, width, totalHeight);
  const treeHeight = Math.max(1, totalHeight - baseHeight);

  const effective = seedOverride != null ? { ...config, seed: seedOverride } : config;
  const tree = growTree(effective, width, treeHeight);

  const offset = baseSteps.length;
  const steps = baseSteps.concat(tree.steps);

  // frame 0 reveals the pot; subsequent frames are the tree's iterations
  const tickStops = [offset, ...tree.tickStops.map((t) => t + offset)];
  const branchStops = tree.branchStops.map((b) => b + offset);

  return {
    steps,
    width,
    height: totalHeight,
    branchCount: tree.branchCount,
    seed: tree.seed,
    tickStops,
    branchStops,
  };
}
