/**
 * The ASCII pot/base art. Faithful port of cbonsai `drawBase()` (cbonsai.c:168-205)
 * and the placement math from `drawWins()` (cbonsai.c:207-240). STYLEGUIDE.md §4.
 *
 * Emits the pot as ordered `Step`s (one per character) so it composites into the
 * same growth tape as the tree: the base is prepended (drawn first / shown
 * immediately), and the tree grows in the rows above it. The pot is anchored
 * bottom-center; the tree region height is `totalHeight - baseHeight`.
 */
import type { ColorPair } from '../config.js';
import type { Step } from './types.js';

interface Segment {
  text: string;
  pair: ColorPair;
}

/** Per-base layout: bold flag, dimensions, and each row's colored segments. */
interface BaseArt {
  width: number;
  height: number;
  bold: boolean;
  rows: Segment[][];
}

const BASE_ART: Record<number, BaseArt> = {
  // base 1: wide pot, 31x4, all bold (cbonsai.c:171-188)
  1: {
    width: 31,
    height: 4,
    bold: true,
    rows: [
      [
        { text: ':', pair: 'text' },
        { text: '___________', pair: 'leafBright' },
        { text: './~~~\\.', pair: 'woodBright' },
        { text: '___________', pair: 'leafBright' },
        { text: ':', pair: 'text' },
      ],
      [{ text: ' \\                           / ', pair: 'text' }],
      [{ text: '  \\_________________________/ ', pair: 'text' }],
      [{ text: '  (_)                     (_)', pair: 'text' }],
    ],
  },
  // base 2: narrow pot, 15x3, not bold (cbonsai.c:189-203)
  2: {
    width: 15,
    height: 3,
    bold: false,
    rows: [
      [
        { text: '(', pair: 'text' },
        { text: '---', pair: 'leafBright' },
        { text: './~~~\\.', pair: 'woodBright' },
        { text: '---', pair: 'leafBright' },
        { text: ')', pair: 'text' },
      ],
      [{ text: ' (           ) ', pair: 'text' }],
      [{ text: '  (_________)  ', pair: 'text' }],
    ],
  },
};

/**
 * Build the pot steps for `baseType` (0/unknown = none), centered horizontally
 * and anchored to the bottom of a `totalWidth x totalHeight` canvas. Returns the
 * steps plus the pot's height so the caller knows how much room the tree gets.
 */
export function drawBase(
  baseType: number,
  totalWidth: number,
  totalHeight: number,
): { steps: Step[]; baseHeight: number } {
  const art = BASE_ART[baseType];
  if (!art) return { steps: [], baseHeight: 0 };

  const originX = Math.floor(totalWidth / 2) - Math.floor(art.width / 2);
  const originY = totalHeight - art.height;
  const steps: Step[] = [];

  art.rows.forEach((segments, row) => {
    let col = originX;
    for (const seg of segments) {
      for (const ch of seg.text) {
        steps.push({ x: col, y: originY + row, char: ch, pair: seg.pair, bold: art.bold });
        col += 1;
      }
    }
  });

  return { steps, baseHeight: art.height };
}
