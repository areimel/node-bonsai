/**
 * Config tests — focus on color/theme resolution in flagsToConfig.
 * Runs via: npm test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { flagsToConfig, DEFAULTS, THEMES, type ThemeName } from '../src/config.js';

test('no color flags falls back to the default green palette', () => {
  assert.deepEqual(flagsToConfig().colors, DEFAULTS.colors);
  assert.deepEqual(flagsToConfig({ theme: 'green' }).colors, DEFAULTS.colors);
});

test('each named theme resolves to its palette', () => {
  for (const name of Object.keys(THEMES) as ThemeName[]) {
    assert.deepEqual(flagsToConfig({ theme: name }).colors, THEMES[name]);
  }
});

test('theme names are case-insensitive and trimmed', () => {
  assert.deepEqual(flagsToConfig({ theme: '  Cherry ' }).colors, THEMES.cherry);
});

test('explicit --colors overrides a theme', () => {
  const cfg = flagsToConfig({ theme: 'maple', colors: '1,2,3,4' });
  assert.deepEqual(cfg.colors, [1, 2, 3, 4]);
});

test('unknown theme throws a helpful error', () => {
  assert.throws(() => flagsToConfig({ theme: 'bogus' }), /Invalid --theme.*green, cherry, maple, wisteria/);
});

test('resolved colors are a fresh copy, not the shared THEMES tuple', () => {
  const cfg = flagsToConfig({ theme: 'wisteria' });
  assert.notEqual(cfg.colors, THEMES.wisteria, 'should not alias the module-level array');
  assert.deepEqual(cfg.colors, THEMES.wisteria);
});
