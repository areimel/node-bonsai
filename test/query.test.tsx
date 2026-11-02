import test from 'node:test';
import assert from 'node:assert/strict';
import { flagsToConfig } from '../src/config.js';
import { runEngine } from '../src/engine/index.js';
import { flagsFromQuery, flagsToQuery, RANGES } from '../site/src/playground/query.js';

test('a bare URL starts on the page tree; a query means CLI defaults', () => {
  assert.equal(flagsFromQuery('').flags.theme, 'cherry');
  assert.equal(flagsFromQuery('?seed=2').flags.theme, undefined);
});

test('inherited object keys are not themes', () => {
  assert.equal(flagsFromQuery('?theme=constructor').flags.theme, undefined);
  assert.throws(() => flagsFromQuery('') && flagsToConfig({ theme: 'constructor' }), /Invalid --theme/);
});

test('control and bidi characters are removed from linked text', () => {
  const { flags } = flagsFromQuery(`?message=${encodeURIComponent('hi\x1b[2J\nthere‮')}&leaf=${encodeURIComponent('a\x07')}`);
  assert.equal(flags.message, 'hi[2Jthere');
  assert.equal(flags.leaf, 'a');
});

test('life is clamped to the safe range', () => {
  assert.equal(flagsFromQuery('?life=999').flags.life, RANGES.life.max);
});

test('flags survive a query round trip', () => {
  const flags = { seed: 3, theme: 'maple', life: 50, leaf: '*,o' };
  assert.deepEqual(flagsFromQuery(flagsToQuery(flags)).flags, flags);
});

test('maxSteps stops a runaway tree that would otherwise exhaust memory', () => {
  const budget = 5000;
  const config = { ...flagsToConfig({ seed: 1 }), life: 200, maxSteps: budget };
  const { steps } = runEngine(config, { width: 100, height: 40 });
  assert.ok(steps.length < budget * 2, `${steps.length} steps`);
});

test('maxSteps does not change a tree under budget', () => {
  const plain = flagsToConfig({ seed: 42 });
  const a = runEngine(plain, { width: 80, height: 24 });
  const b = runEngine({ ...plain, maxSteps: 200_000 }, { width: 80, height: 24 });
  assert.deepEqual(a.steps, b.steps);
});

test('unknown params still start on the page tree', () => {
  assert.equal(flagsFromQuery('?utm_source=x').flags.theme, 'cherry');
});

test('colours from a link must be four plain numbers', () => {
  assert.equal(flagsFromQuery('?colors=1,2,3,4').flags.colors, '1,2,3,4');
  assert.equal(flagsFromQuery(`?colors=${encodeURIComponent('1\x1b[2J\u202E,2,3,4')}`).flags.colors, undefined);
  assert.equal(flagsFromQuery('?colors=1,2,3,999').flags.colors, undefined);
});
