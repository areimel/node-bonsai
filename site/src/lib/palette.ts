/**
 * The one terminal palette, shared by the live terminal (xterm's theme) and the
 * static trees (renderTree.ts), so both show the same colours.
 */

/** ANSI 0-15, tuned so the default tree stays legible on the terminal background. */
const ANSI_16 = [
  '#1E2B26', '#C4695A', '#7FA650', '#A5793F', '#6C8FB5', '#A97FA8', '#6FA8A0', '#C9D1C6',
  '#8A9A8E', '#E08A78', '#B4D66A', '#D9A95A', '#94B4D6', '#C9A0C8', '#93C9C0', '#EDF0E8',
];

const CUBE_STEPS = [0, 95, 135, 175, 215, 255];
const hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('').toUpperCase();

/** Hex for a colour index 0-255, using the standard xterm 256-colour layout. */
export function colorToHex(index: number): string {
  if (index < 16) return ANSI_16[index];
  if (index >= 232) {
    const level = 8 + (index - 232) * 10;
    return hex(level, level, level);
  }
  const n = index - 16;
  return hex(CUBE_STEPS[Math.floor(n / 36)], CUBE_STEPS[Math.floor(n / 6) % 6], CUBE_STEPS[n % 6]);
}

const [black, red, green, yellow, blue, magenta, cyan, white] = ANSI_16;
const [brightBlack, brightRed, brightGreen, brightYellow, brightBlue, brightMagenta, brightCyan, brightWhite] =
  ANSI_16.slice(8);

/** xterm `theme` option. */
export const terminalTheme = {
  background: black,
  foreground: white,
  black, red, green, yellow, blue, magenta, cyan, white,
  brightBlack, brightRed, brightGreen, brightYellow, brightBlue, brightMagenta, brightCyan, brightWhite,
};
