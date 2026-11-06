import type { CliFlags } from '../../../src/config.js';

export interface Example {
  id: string;
  title: string;
  /** Fixed non-zero seed, so the tree is the same on every build. */
  flags: CliFlags;
  note: string;
}

/** Every tree on the Examples page. The art is never stored: it is grown at build time. */
export const examples: Example[] = [
  {
    id: 'plain-green',
    title: 'The default tree in its wide pot',
    flags: { seed: 2 },
    note: 'No options at all except the seed. Green leaves, a brown trunk, and the default pot.',
  },
  {
    id: 'cherry',
    title: 'Pink leaves on a lopsided tree',
    flags: { seed: 3, theme: 'cherry' },
    note: '-T cherry only swaps the colours. The shape comes from the seed.',
  },
  {
    id: 'dense-maple',
    title: 'A crowded red tree',
    flags: { seed: 12, theme: 'maple', life: 50, multiplier: 6 },
    note: 'A higher life (-L) lets branches grow longer, and a higher multiplier (-M) makes more of them split. Together they fill the whole frame.',
  },
  {
    id: 'small-wisteria',
    title: 'A small purple tree in a narrow pot',
    flags: { seed: 11, theme: 'wisteria', base: 2, life: 15, multiplier: 2 },
    note: 'Low life and a low multiplier give a short tree with few branches. -b 2 is the narrow pot.',
  },
  {
    id: 'no-pot',
    title: 'A young green tree with no pot',
    flags: { seed: 11, base: 0, life: 20, multiplier: 3 },
    note: '-b 0 leaves the pot out, so the tree gets the whole picture to itself.',
  },
  {
    id: 'star-leaves',
    title: 'Cherry tree with stars and dots for leaves',
    flags: { seed: 10, theme: 'cherry', life: 40, leaf: '*,o,.' },
    note: '-c takes a comma-separated list of characters, and each leaf picks one of them at random.',
  },
  {
    id: 'blue-leaves',
    title: 'Blue leaves on a brown trunk',
    flags: { seed: 5, colors: '4,94,12,130' },
    note: '-k sets the four colours by number (0 to 255): dark leaves, dark trunk, light leaves, light trunk. Here it is blue leaves with a brown trunk.',
  },
];
