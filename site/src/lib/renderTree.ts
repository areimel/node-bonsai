/**
 * Renders a tree to HTML at build time with the real engine and the shared
 * gridToString, for static trees on Home and Examples.
 */
import { flagsToConfig, type CliFlags } from '../../../src/config.js';
import { runEngine } from '../../../src/engine/index.js';
import { gridToString } from '../../../src/render/canvas.js';
import { colorIndexes, type Colorize } from '../../../src/render/colors.js';
import { foldSteps } from '../../../src/render/fold.js';
import { colorToHex } from './palette';

/** Static trees use the size the CLI falls back to when its output is piped. */
export const TREE_SIZE = { width: 80, height: 24 };

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ESCAPES[c]);

function htmlColorizer(colors: [number, number, number, number]): Colorize {
  const index = colorIndexes(colors);
  return (pair, bold, char) =>
    `<span style="color:${colorToHex(index[pair])}${bold ? ';font-weight:700' : ''}">${escapeHtml(char)}</span>`;
}

/** HTML for a <pre>. Pass a non-zero `seed`, or the tree changes with every build. */
export function renderTreeHtml(flags: CliFlags): string {
  const config = flagsToConfig(flags);
  const result = runEngine(config, TREE_SIZE);
  return gridToString(foldSteps(result.steps, result.width, result.height), htmlColorizer(config.colors));
}
