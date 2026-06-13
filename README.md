# node-bonsai

A procedurally-generated **terminal bonsai tree** generator — per-character-colored ASCII art that grows in your terminal. A TypeScript rewrite of [cbonsai](./original-cbonsai/), built with [Ink](https://github.com/vadimdemedes/ink) (React for the terminal).

> **Status: working.** The growth engine is ported from the original cbonsai — `npm run dev` grows a full per-character-colored bonsai above an ASCII pot. Static, `--live` animation, `--print`, `--infinite`/`--screensaver`, `--message`, and `--save`/`--load` are all wired up.

## Quick start

```bash
npm install
npm run dev          # run from source via tsx
# or
npm run build && npm start
```

Press `q` to quit.

## CLI options

Flag parity with the original cbonsai:

| Short | Long | Description | Default |
|-------|------|-------------|---------|
| `-l` | `--live` | Show each step of growth | off |
| `-t` | `--time <secs>` | Seconds between growth steps | 0.03 |
| `-i` | `--infinite` | Keep growing trees | off |
| `-w` | `--wait <secs>` | Seconds between trees (infinite) | 4 |
| `-S` | `--screensaver` | `-li`, quit on any key | off |
| `-m` | `--message <str>` | Message beside the tree | — |
| `-b` | `--base <int>` | Base art (0 none, 1 wide, 2 narrow) | 1 |
| `-c` | `--leaf <list>` | Comma-separated leaf strings | `&` |
| `-k` | `--colors <list>` | leafDark,woodDark,leafBright,woodBright | 2,3,10,11 |
| `-M` | `--multiplier <n>` | Branch multiplier (0–20) | 5 |
| `-L` | `--life <n>` | Life; higher = more growth (0–200) | 32 |
| `-p` | `--print` | Print the tree to stdout when finished | off |
| `-s` | `--seed <int>` | Seed the RNG | clock |
| `-W` | `--save <file>` | Save progress | — |
| `-C` | `--load <file>` | Load progress | — |
| `-v` | `--verbose` | Increase verbosity | off |

## Project layout

- `src/` — the Ink/TypeScript app. See [`CLAUDE.md`](./CLAUDE.md) for the module map.
- [`STYLEGUIDE.md`](./STYLEGUIDE.md) — glyphs, colors, and defaults extracted from the original.
- [`ALGORITHM.md`](./ALGORITHM.md) — the growth algorithm as a language-agnostic spec.
- [`original-cbonsai/`](./original-cbonsai/) — the original C/ncurses project, preserved for reference.

## Architecture in one paragraph

Ink is flexbox-based, not a 2D canvas, so the tree is modeled as a `Grid` of colored cells (`src/render/canvas.ts`) and serialized to a single multi-line string with chalk color codes baked in, rendered inside one `<Text>`. All color decisions go through `src/render/colors.ts`; all defaults live in `src/config.ts`. The growth engine (`src/engine/`) ports the recursive algorithm from the original.

## License

This is a derivative work of **cbonsai** by John Allbritten, which is GPL-3.0. The package is currently marked `GPL-3.0-or-later` to stay compatible; see [`original-cbonsai/LICENSE`](./original-cbonsai/LICENSE). Adjust if you intend a different licensing arrangement.
