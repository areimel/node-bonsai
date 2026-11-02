# node-bonsai: technical reference

A procedurally-generated **terminal bonsai tree** generator — per-character-colored ASCII art that grows in your terminal. A TypeScript rewrite of [cbonsai](./original-cbonsai/), built with [Ink](https://github.com/vadimdemedes/ink) (React for the terminal). For a shorter introduction, see [README.md](./README.md).

> **Status: working.** The growth engine is ported from the original cbonsai — `npm run dev` grows a full per-character-colored bonsai above an ASCII pot. Static, `--live` animation, `--print`, `--infinite`/`--screensaver`, `--message`, and `--save`/`--load` are all wired up.

## Commands

Requires Node.js 20 or newer.

```bash
npm install
npm run dev          # run from source via tsx
npm run live         # dev with --live: animated growth
npm run screensaver  # dev with --screensaver: loops new trees, quits on any key
npm run build        # compile to dist/ with tsc
npm start            # run the compiled CLI
npm test             # run the test suite
npm run typecheck    # type-check src/ without emitting
```

Press `q` to quit (any key in `--screensaver`).

### Passing flags through npm

Flags passed through npm need a `--` separator, e.g. `npm run dev -- --live --life 40`. Without it, npm consumes the flag itself, so `npm run dev --live` quietly draws a static tree. The app shows a notice when it detects this for `--live`, `-l`, `--infinite` or `--screensaver`, but `-S` and `-i` can't be detected.

### The `bonsai` command

The `bonsai` command in the examples below comes from the `bin` entry in `package.json`. It isn't on your `PATH` after a plain `npm install` of a clone; run `npm run build && npm link` first, or use `npm run dev -- <flags>` instead.

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
| `-T` | `--theme <name>` | Named color theme (see below) † | green |
| `-M` | `--multiplier <n>` | Branch multiplier (0–20) | 5 |
| `-L` | `--life <n>` | Life; higher = more growth (0–200) | 32 |
| `-p` | `--print` | Print the tree to stdout when finished | off |
| `-s` | `--seed <int>` | Seed the RNG | clock |
| `-W` | `--save <file>` | Save progress | — |
| `-C` | `--load <file>` | Load progress | — |
| `-v` | `--verbose` | Increase verbosity | off |

`--live`, `--infinite` and `--screensaver` draw on the terminal's alternate screen, so your shell is restored on quit and the tree disappears; use `--print` to keep a tree in your scrollback. The original cbonsai also clears its tree on quit.

### Color themes

> † `--theme` is an intentional divergence from the original cbonsai, which has
> no named themes (only the raw `--colors` indices). It is a convenience layer
> over the same four color roles.

Pick a ready-made palette with `--theme <name>`. Each theme maps to the same
four ANSI-256 indices as `--colors` (`leafDark,woodDark,leafBright,woodBright`);
the new themes keep a natural brown trunk and only re-color the foliage. An
explicit `--colors` always overrides `--theme`.

| Theme | Look | Equivalent `--colors` |
|-------|------|-----------------------|
| `green` | Classic green/yellow (cbonsai default) | `2,3,10,11` |
| `cherry` | Cherry Blossom Pink — rose + light pink, brown trunk | `175,94,218,130` |
| `maple` | Maple Red — dark red + orange-red, brown trunk | `124,94,202,130` |
| `wisteria` | Wisteria Purple — muted purple + lavender, brown trunk | `97,94,183,130` |

```bash
bonsai --theme cherry
bonsai -T wisteria --live
```

## Website

`site/` is a separate package and isn't published with the CLI. It needs Node.js 22.23.4 or newer (Astro's minimum) and an `npm install` in both the repo root and `site/`, because the build imports `src/`.

```bash
cd site
npm run dev          # terminal bundle (watch) + astro dev
npm run build        # terminal bundle, then the static site in dist/
npm run preview      # serve dist/ under /node-bonsai/
npm run typecheck    # astro check
npm run test:e2e     # Playwright; E2E_WEBKIT=1 adds WebKit
```

Pages are static Astro. The terminal on Home is a separate bundle built by `vite.playground.config.ts` into `public/playground/`, because `ink-web`'s plugin aliases Node builtins globally. That config maps the app's `ink` imports to `ink-web` (Ink 6, bundled) while the CLI stays on Ink 7, and maps `chalk` to the real package because `ink-web`'s shim has no `ansi256`. `App` takes `interactive={false}` when embedded, so keys don't quit it.

Examples are generated at build time with the real engine at 80x24 (`site/src/data/examples.ts`, `site/src/lib/renderTree.ts`), and `test/examples.test.tsx` checks each printed command against the real CLI. The shared flag table is `src/flags.ts`, and `src/command.ts` builds the printed commands.

To publish: set the contact values and form endpoint in `site/src/data/contact.ts`, then set the repo's Pages source to GitHub Actions. `.github/workflows/pages.yml` deploys on pushes to `main`. The contact form stays hidden until `formEndpoint` is set.

## Known limitations

Tree size grows exponentially with `--life`, and nothing limits it in the CLI. `--life 200` ran out of memory at the default multiplier, as did `--life 100` at some low multipliers. Trees up to about 80 finished within a few seconds in testing. The website caps Life at 80 and sets a step budget (`Config.maxSteps`).

When the `CI` environment variable is set, Ink runs non-interactively, so the screen stays blank until the app exits. Unset `CI` to see the tree.

## Project layout

- `src/` — the Ink/TypeScript app. See [`CLAUDE.md`](./CLAUDE.md) for the module map.
- [`STYLEGUIDE.md`](./STYLEGUIDE.md) — glyphs, colors, and defaults extracted from the original.
- [`ALGORITHM.md`](./ALGORITHM.md) — the growth algorithm as a language-agnostic spec.
- [`original-cbonsai/`](./original-cbonsai/) — the original C/ncurses project, preserved for reference.

## Architecture in one paragraph

Ink is flexbox-based, not a 2D canvas, so the tree is modeled as a `Grid` of colored cells (`src/render/canvas.ts`) and serialized to a single multi-line string with chalk color codes baked in, rendered inside one `<Text>`. All color decisions go through `src/render/colors.ts`; all defaults live in `src/config.ts`. The growth engine (`src/engine/`) ports the recursive algorithm from the original.

## License

This is a derivative work of **cbonsai** by John Allbritten, which is GPL-3.0. The package is currently marked `GPL-3.0-or-later` to stay compatible; see [`original-cbonsai/LICENSE`](./original-cbonsai/LICENSE). Adjust if you intend a different licensing arrangement.
