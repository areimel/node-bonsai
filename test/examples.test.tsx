import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { flagsToCommand } from '../src/command.js';
import { examples } from '../site/src/data/examples.js';
import { renderTreeHtml } from '../site/src/lib/renderTree.js';

const run = promisify(execFile);
const CLI = 'node --import tsx src/cli.tsx';

const stripAnsi = (text: string) => text.replace(/\x1b\[[0-9;]*m/g, '');
const htmlToText = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

test('every example has a fixed non-zero seed', () => {
  assert.ok(examples.length >= 6 && examples.length <= 9);
  for (const { flags, id } of examples) assert.ok(flags.seed && flags.seed !== 0, id);
  assert.equal(new Set(examples.map((e) => e.id)).size, examples.length);
});

for (const { id, flags } of examples) {
  test(`example "${id}": its printed command makes the tree shown`, async () => {
    // The command as shown on the site, with -p added and `bonsai` pointed at the source CLI.
    const shown = flagsToCommand(flags);
    assert.ok(shown.startsWith('bonsai '), shown);
    const command = shown.replace(/^bonsai/, `${CLI} -p`);
    // stdout is a pipe here, so the CLI uses its 80x24 fallback.
    const { stdout } = await run('sh', ['-c', command], { cwd: new URL('..', import.meta.url).pathname });
    const actual = stripAnsi(stdout).replace(/\n$/, '');
    assert.equal(actual, htmlToText(renderTreeHtml(flags)));
  });
}
