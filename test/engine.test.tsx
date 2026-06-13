/**
 * Engine tests — pure, no Ink. Exercise the deterministic growth tape:
 * reproducibility by seed, the base/tree composition, the tickStop/branchStop
 * bookkeeping, and prefix folding. Runs via: npm test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { runEngine } from '../src/engine/index.js';
import { drawBase } from '../src/engine/base.js';
import { flagsToConfig } from '../src/config.js';
import { foldSteps } from '../src/render/fold.js';
import { makeColorizer } from '../src/render/colors.js';
import { gridToString } from '../src/render/canvas.js';

const SIZE = { width: 60, height: 24 };
const colorize = makeColorizer([2, 3, 10, 11]);

test('engine is deterministic for a given seed', () => {
  const a = runEngine(flagsToConfig({ seed: 42 }), SIZE);
  const b = runEngine(flagsToConfig({ seed: 42 }), SIZE);
  assert.deepEqual(a.steps, b.steps);
  assert.equal(a.branchCount, b.branchCount);
  assert.equal(a.seed, 42);
});

test('different seeds produce different trees', () => {
  const a = runEngine(flagsToConfig({ seed: 42 }), SIZE);
  const c = runEngine(flagsToConfig({ seed: 99 }), SIZE);
  assert.notDeepEqual(a.steps, c.steps);
});

test('grows a non-trivial tree with leaves', () => {
  const r = runEngine(flagsToConfig({ seed: 42 }), SIZE);
  assert.ok(r.steps.length > 50, 'expected a substantial tape');
  assert.ok(r.branchCount > 0);
  assert.ok(
    r.steps.some((s) => s.char === '&' && s.pair.startsWith('leaf')),
    'expected at least one leaf glyph',
  );
});

test('tickStops are ascending and end at the full tape length', () => {
  const r = runEngine(flagsToConfig({ seed: 42 }), SIZE);
  for (let i = 1; i < r.tickStops.length; i++) {
    assert.ok(r.tickStops[i] >= r.tickStops[i - 1], 'tickStops must be non-decreasing');
  }
  assert.equal(r.tickStops[r.tickStops.length - 1], r.steps.length);
  assert.ok(r.branchStops.every((b) => b >= 0 && b <= r.steps.length));
});

test('frame 0 is exactly the pot, composited into the bottom rows', () => {
  const r = runEngine(flagsToConfig({ seed: 42, base: 1 }), SIZE);
  const base = drawBase(1, SIZE.width, SIZE.height);
  const baseSteps = r.steps.slice(0, r.tickStops[0]);
  assert.equal(baseSteps.length, base.steps.length, 'tickStops[0] should be the pot');
  assert.ok(baseSteps.some((s) => s.char === '~'), 'pot rim present');
  const minBaseY = Math.min(...baseSteps.map((s) => s.y));
  assert.ok(minBaseY >= SIZE.height - 4, 'base occupies the bottom 4 rows');
});

test('base 0 leaves no pot', () => {
  const r0 = runEngine(flagsToConfig({ seed: 42, base: 0 }), SIZE);
  assert.equal(r0.tickStops[0], 0);
});

test('folding a prefix reveals less than the full tape', () => {
  const r = runEngine(flagsToConfig({ seed: 42 }), SIZE);
  const potOnly = gridToString(foldSteps(r.steps, r.width, r.height, r.tickStops[0]), colorize);
  const full = gridToString(foldSteps(r.steps, r.width, r.height), colorize);
  assert.ok(!potOnly.includes('&'), 'pot-only frame has no leaves');
  assert.ok(full.includes('&'), 'full frame has leaves');
});
