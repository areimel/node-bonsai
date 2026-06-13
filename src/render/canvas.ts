/**
 * The 2D canvas model and its serializer.
 *
 * Ink is flexbox-based, not a per-cell grid, so the bonsai is modeled here as a
 * grid of colored cells and serialized to a single multi-line string (with
 * chalk color codes baked in) for rendering inside one <Text>. Every render
 * path (live, static, print) shares this one renderer — do not duplicate it.
 */
import type { ColorPair } from '../config.js';
import type { Colorize } from './colors.js';

/** A single drawable cell: a character plus its color role and weight. */
export interface Cell {
  char: string;
  pair: ColorPair;
  bold: boolean;
}

/** A sparse, bounds-checked 2D grid of cells addressed by (x, y). */
export class Grid {
  readonly width: number;
  readonly height: number;
  private readonly cells: Array<Cell | undefined>;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = new Array<Cell | undefined>(width * height);
  }

  /** Write a cell; out-of-bounds writes are ignored (matches the original's clipping). */
  set(x: number, y: number, cell: Cell): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.cells[y * this.width + x] = cell;
  }

  get(x: number, y: number): Cell | undefined {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return undefined;
    return this.cells[y * this.width + x];
  }
}

/** Serialize a grid into a chalk-colored multi-line string for a single <Text>. */
export function gridToString(grid: Grid, colorize: Colorize): string {
  const lines: string[] = [];
  for (let y = 0; y < grid.height; y++) {
    let line = '';
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.get(x, y);
      line += cell ? colorize(cell.pair, cell.bold, cell.char) : ' ';
    }
    lines.push(line);
  }
  return lines.join('\n');
}
