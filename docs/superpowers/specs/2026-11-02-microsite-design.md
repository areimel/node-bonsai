# node-bonsai microsite (`site/`)

## Context

Trying node-bonsai currently means installing a Node CLI. The microsite lets non-developers grow a tree in the browser, using the real app through `ink-web`, with no install. It also gives the developer a contact point for freelance, contract and full-time work.

**Goals:** Home with a live terminal and controls; Examples with each tree's command; Docs for install and usage; Contact with public details and a form.

**Non-goals:** a backend or database, analytics, accounts, exposing `--save`/`--load`/`--print`/`--verbose` as controls, changing tree generation.

**Failure, even if it technically works:** a demo that freezes on a keypress, wrong colours, an example whose command doesn't produce the tree shown, or a form that looks live but delivers nothing.

### Decided by the user
- Contact form: hosted form service, no backend.
- Hosting: GitHub Pages, deployed by GitHub Actions, at `areimel.github.io/node-bonsai`.
- Visual direction: herbarium sheet.
- Public contact details: email, GitHub, LinkedIn, portfolio/résumé. Only GitHub's value is known so far.

### Claude's calls (object to any of these at approval)
- Astro for pages, plus a separate Vite build for the terminal bundle.
- Formspree as the default form service. The endpoint is a single config value, so switching is cheap.
- Examples fixed at 80×24.
- Fonts self-hosted through `@fontsource`, so there are no third-party font requests.
- Commits stay local. **Pushing, opening a PR, and enabling or deploying Pages each wait for an explicit go-ahead.**

## Technical findings that shape the build

| Finding | Consequence |
|---|---|
| `ink-web` 0.2.0 needs Ink 6 and Vite ≥7; the CLI uses Ink 7 | `site/` has its own `package.json` with `ink@^6.8`. No npm workspaces, because they could hoist one Ink version for both sides. |
| `src/app.tsx` would resolve `ink` and `react` from root `node_modules` (Ink 7) | The playground's Vite config aliases and dedupes `ink`, `react`, `react-reconciler` and `scheduler` to `site/node_modules`. |
| `ink-web`'s chalk shim reportedly has no `ansi256`, which `render/colors.ts` calls | Alias `chalk` to the real package and set `chalk.level = 2` in the entry. Fallback: a site-local shim that adds `ansi256`. Don't change `colors.ts` behaviour. |
| `q`, or any key in screensaver mode, calls `exit()` and would freeze the demo | New optional `interactive` prop on `App` (default `true`). |
| `ink-web` recreates the terminal if `termOptions`, `focus` or `onReady` change, but a new child just rerenders | Keep those props constant; pass config changes as new children, debounced ~150 ms. |
| `ink-web`'s plugin aliases Node builtins globally, which could break Astro's build step (inferred, not tested) | Keep it out of `astro.config`; the terminal bundle builds separately into `site/public/playground/`. |
| Tree shape depends on terminal size as well as seed | Examples are generated at 80×24 and labelled so. Piped CLI output falls back to 80×24, so the command can be checked honestly. |

The `ink-web` details come from a source review, some of it summarised, and none has been run. Phase 0 tests them before anything else depends on them.

## Architecture

```
src/                         (shared with the CLI)
  flags.ts      NEW  meow flag table moved here from cli.tsx; browser-safe
  command.ts    NEW  flagsToCommand(CliFlags): only non-default flags
  app.tsx            + interactive?: boolean
  render/colors.ts   + export the role-to-index mapping for reuse
site/
  package.json, astro.config.mjs, vite.playground.config.ts, tsconfig.json
  src/layouts/Sheet.astro    the one shared page layout and nav
  src/styles/tokens.css      all design tokens
  src/lib/url.ts             the one base-path helper for every internal link
  src/lib/htmlColorizer.ts   Colorize returning escaped <span>s
  src/data/contact.ts        all contact values + form endpoint; empties don't render
  src/data/examples.ts       {id, title, flags, note}; no stored art
  src/components/            Specimen, CommandLabel (copy button), ContactForm
  src/playground/            main.tsx, Controls.tsx, control primitives (React)
  src/content/docs/*.md      docs content
  src/pages/                 index, examples, docs/, contact, 404
.github/workflows/pages.yml
```

### Reuse, not duplication
- `App`, `runEngine`, `foldSteps` and `gridToString` are used as they are. `gridToString` already accepts any `Colorize`, so the HTML colorizer needs no ANSI parser.
- Controls hold a `CliFlags` object. `flagsToConfig` produces the app config, and `flagsToCommand` produces the printed command. Ranges and theme options come from `DEFAULTS` and `THEMES`.
- `cli.tsx` imports the meow table from `flags.ts`. Its help text stays where it is, to limit CLI churn.

### `interactive` prop
With `interactive={false}`: `useInput(..., { isActive: false })`, no hint row, and that row is removed from the height budget (`reserved`). CLI behaviour is unchanged.

### Home
The Astro page ships a static example tree and its command inside `#playground`, so it is indexable and useful without JS. The bundle then replaces that content.

- **Runs as:** `live` and `infinite` on, `screensaver` off.
- **Controls:** theme (select), base (radios), life and multiplier (sliders), speed and wait (sliders), leaf and message (text), seed (number + shuffle), and an advanced colours field.
- **Label plate:** shows the current command, with a copy button. A "screensaver" checkbox changes only the printed command.
- **Links:** `?flags` in the URL presets the controls, so Examples can link "Try it".
- **Failure state:** if the terminal can't load, keep the static tree and say so plainly.

### Examples
Built from `examples.ts` with the real engine at 80×24. Each specimen shows the tree, its command, a copy button, and a "Try it" link. An automated test compares each one with `tsx src/cli.tsx -p <flags>` output after stripping ANSI codes.

### Docs
Markdown drawn from both READMEs: install, quick start, full flag reference, themes, and differences from cbonsai.

### Contact
A plain `<form method="POST">` with a honeypot field, so it works without JS. Each public detail renders only if it has a value in `contact.ts`. **With no endpoint set, the form is not rendered** and the page points to the listed contact details instead.

## Design: herbarium sheet

**Colour**

| Token | Hex | Use |
|---|---|---|
| `--sheet` | `#DCE3DA` | cool grey-green page |
| `--mount` | `#EDF0E8` | label plates, raised surfaces |
| `--pine` | `#1E2B26` | text, and the terminal background |
| `--moss` | `#566B57` | secondary text, control tracks |
| `--stamp` | `#2F4A6D` | the only accent: links, focus, active controls; like a museum's blue-ink stamp |

Terminal ANSI colours 2, 3, 10 and 11 are tuned through xterm's `theme` to stay legible on `--pine`.

**Type:** Alegreya for headings and body (humanist, with a natural-history book feel, set large for headings). IBM Plex Mono for the terminal and commands only, never for decorative labels.

**Layout:** left-aligned and asymmetric, like a mounted sheet. The terminal is the specimen, taking about two-thirds of the width and held by small paper-tape strips. Field-note controls run down the right, then stack below on mobile. Body text stays under 80 characters per line.

```
node-bonsai           Examples  Docs  Contact
+-----------------------------+   Life     32
|=tape=                       |   ---o-------
|           &&&&              |   Branches  5
|         &&&&&&&&            |   ----o------
|           \\||/             |   Theme  green
|        [=======]            |   Base (o) wide
+-----------------------------+
             +------------------------------+
             | bonsai -l -s 42 -T cherry  [copy] |
             +------------------------------+
```

**The one memorable thing:** the typed label plate, overlapping the sheet's lower right corner, rewriting itself as controls change. Everything else stays quiet.

**Motion:** the growing tree is the only ambient motion. Under `prefers-reduced-motion`, the terminal starts paused on a finished tree, with a control to play it.

**Check against generic defaults:** a warm cream page became cool grey-green; the expected terracotta or acid-green accent became stamp blue; identical rounded cards became mounted sheets, tape and plates; all-caps eyebrows and decorative mono labels are dropped; specimen numbers appear only where they're real (the seed). Copy stays plain: nav reads Examples, Docs, Contact, and "Specimen" is a visual motif, not a term users must learn.

## Build order

**Phase 0: go/no-go spike** (Opus, lead; throwaway, uncommitted). Prove in Chromium, Firefox and WebKit: the tree grows and loops; colours are correct; resize refits; a config change regrows; keys and Ctrl-C don't kill it; the bundle has one Ink and one React; `astro build` succeeds with the bundle in `public/`. Record the bundle size.
**If it fails:** tell the user before continuing, and propose a fallback that runs the real engine through an HTML renderer, labelled as such, with no terminal. Everything else in the plan still applies.

**Phase 1: foundation** (1 Sonnet, sequential). Save this document as `docs/superpowers/specs/2026-11-02-microsite-design.md`. Add `flags.ts`, `command.ts`, the `interactive` prop, and tests. Then the `site/` scaffold, layout, tokens, `url.ts`, `contact.ts`, and gitignore entries.

**Phase 2: parallel** (separate files, so no conflicts). Tracked in a task list with one owner per stream.

| Stream | Owns | Agent |
|---|---|---|
| A. Home | `site/src/playground/**`, `pages/index.astro` | Sonnet |
| B. Examples | `data/examples.ts`, `lib/htmlColorizer.ts`, Specimen, `pages/examples.astro`, CLI comparison test | Sonnet |
| C. Docs | `content/docs/**`, `pages/docs/**` | Haiku drafts; Sonnet checks accuracy against `cli.tsx` |
| D. Contact | `pages/contact.astro`, ContactForm | Haiku |
| E. Deploy and tests | `.github/workflows/pages.yml`, `site/e2e/**` | Sonnet |

Shared layout and token changes go through the lead. CommandLabel is built in Phase 1, since A and B both use it.

**Phase 3: integration** (lead + 1 Sonnet). 404 page, metadata, accessibility pass, screenshot critique on desktop and mobile, both READMEs, `CLAUDE.md`/`AGENTS.md` notes for `site/`, then an independent code review (`/code-review`).

About 7 agents in total, well under the limit of 26. More wouldn't help because the streams are small.

### Commit checkpoints
1. Design doc
2. Shared flag table and `flagsToCommand`, with tests
3. `interactive` prop for embedding
4. `site/` scaffold, layout, tokens, contact data
5. Terminal bundle running the real app
6. Home controls and label plate
7. Example generation and Examples page
8. Docs
9. Contact page and form
10. Pages workflow and browser tests
11. READMEs, project notes, review fixes

## Verification

- Root: `npm run typecheck` and `npm test` pass; `npm pack --dry-run` excludes `site/`; seeded trees are unchanged.
- Site: `npm run typecheck` and `npm run build` in `site/`.
- Browser tests (Playwright, in all three engines): tree changes over time; a control changes both tree and command; surviving a keypress and resize; no console errors; example commands match CLI output; absent contact details and an unset form endpoint don't render.
- Base path: serve the build under `/node-bonsai/`, crawl every link and asset for 404s, and grep HTML for root-relative URLs.
- Without JS: Home, Examples, Docs and Contact all still show useful content.
- Design: screenshots at 375, 768 and 1440 px; keyboard-only pass; reduced motion; colour contrast.
- Form: a real test submission once the endpoint exists.

## Needed from the user (none of this blocks the build)

1. The exact public **email address**, **LinkedIn URL**, and **portfolio/résumé** link or file. Git account details won't be published on assumption.
2. A **Formspree endpoint** (create a free account and form). Until then the form stays hidden.
3. The go-ahead to **push and enable Pages** (repo Settings → Pages → Source: GitHub Actions).
4. Type `/rc` to enable remote control; it can only be run by the user.

## Existing issue noticed, not in scope

`package.json` says Node `>=20`, but Ink 7 requires Node `>=22`. The new Docs will say 22+. The `engines` field stays as it is unless the user wants it fixed.

## Spike results (2026-11-02)

**Go.** Tested in Chromium and Firefox: the tree grows and loops, colours are correct, keys don't stop it, resizing works, and there are no console errors. The bundle is 267 KB gzipped. **WebKit is untested**: the browser can't launch on the dev machine without system libraries installed through `sudo`.

Corrections to the findings above:

- `ink` aliases to `ink-web`'s `dist/index.js`, not to a separate Ink 6. That bundle includes its own Ink, and a second copy wouldn't share React context.
- `src/app.tsx` keeps its reserved row when embedded. Output that fills the terminal takes Ink's full-redraw path, and `ink-web` strips the clear from it, leaving old trees on screen.
- The browser wrapper starts `App` only after `InkXterm`'s `onReady`, and remounts the terminal (debounced) when its container changes size. Changing size under a running app garbled the output in Firefox.
- `disableStdin: true` is set on the terminal, since the demo takes no keyboard input.
