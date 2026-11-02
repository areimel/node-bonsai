/**
 * flagsToCommand tests, including a round trip through meow and flagsToConfig.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import meow from 'meow';
import { flagsToCommand } from '../src/command.js';
import { flagsToConfig, type CliFlags } from '../src/config.js';
import { FLAGS } from '../src/flags.js';

/** Minimal POSIX shell word splitter (single quotes, double quotes, backslash). */
function shellSplit(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let has = false;
  let q: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (q === "'") {
      if (c === "'") q = null;
      else cur += c;
    } else if (q === '"') {
      if (c === '"') q = null;
      else if (c === '\\') cur += line[++i];
      else cur += c;
    } else if (c === "'" || c === '"') {
      q = c;
      has = true;
    } else if (c === '\\') {
      cur += line[++i];
      has = true;
    } else if (/\s/.test(c)) {
      if (cur || has) out.push(cur);
      cur = '';
      has = false;
    } else {
      cur += c;
      has = true;
    }
  }
  if (cur || has) out.push(cur);
  return out;
}

function parse(command: string): CliFlags {
  const [bin, ...argv] = shellSplit(command);
  assert.equal(bin, 'bonsai');
  return meow('', { importMeta: import.meta, argv, flags: FLAGS }).flags as CliFlags;
}

test('defaults produce a bare command', () => {
  assert.equal(flagsToCommand({}), 'bonsai');
  assert.equal(
    flagsToCommand({ seed: 0, theme: 'green', life: 32, leaf: '&', live: false }),
    'bonsai',
  );
});

test('only non-default flags appear, using short flags', () => {
  assert.equal(
    flagsToCommand({ live: true, life: 40, seed: 42, theme: 'cherry' }),
    'bonsai -l -T cherry -L 40 -s 42',
  );
});

test('values with spaces or shell characters are quoted', () => {
  const cmd = flagsToCommand({ leaf: '&', message: 'hello world', colors: '1,2,3,4' });
  assert.equal(cmd, "bonsai -m 'hello world' -k 1,2,3,4");
  assert.equal(flagsToCommand({ leaf: '&,*' }), "bonsai -c '&,*'");
  assert.equal(flagsToCommand({ leaf: '&;x' }), "bonsai -c '&;x'");
  assert.equal(flagsToCommand({ message: "it's" }), `bonsai -m 'it'\\''s'`);
});

test('round trip: command parses back to the same config', () => {
  const cases: CliFlags[] = [
    {},
    { live: true, infinite: true, theme: 'maple', seed: 7 },
    { leaf: '&,*', message: 'hello world', life: 70, multiplier: 12, base: 2 },
    { leaf: '&', message: `it's "quoted" & $HOME`, time: 0.1, wait: 2 },
    { screensaver: true, colors: '10,11,12,13' },
    { leaf: '$,`,\\,!' },
  ];
  for (const flags of cases) {
    const back = parse(flagsToCommand(flags));
    assert.deepEqual(flagsToConfig(back), flagsToConfig(flags), flagsToCommand(flags));
  }
});

test('a value that looks like a flag stays a value and cannot set --save', () => {
  for (const flags of [{ message: '--save=/tmp/evil' }, { leaf: '-p' }, { message: '-W evil' }]) {
    const argv = shellSplit(flagsToCommand(flags)).slice(1);
    const parsed = meow('', { importMeta: import.meta, argv, flags: FLAGS }).flags;
    assert.equal(parsed.save, undefined);
    assert.equal(parsed.print, false);
    assert.equal(parsed.message ?? parsed.leaf, flags.message ?? flags.leaf);
  }
});

test('default colours are kept when a theme would otherwise override them', () => {
  assert.equal(flagsToCommand({ theme: 'cherry', colors: '2,3,10,11' }), "bonsai -k 2,3,10,11 -T cherry");
  assert.equal(flagsToCommand({ colors: '2,3,10,11' }), 'bonsai');
});
