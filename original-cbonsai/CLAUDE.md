# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Despite the directory name `node-bonsai`, this is **cbonsai** — a terminal bonsai tree generator written in C using `ncursesw`. There is no Node.js here. The entire program lives in a single file, `cbonsai.c` (~1100 lines).

## Build & install

```bash
make                  # builds the `cbonsai` binary (also tries to build the man page via scdoc)
make clean            # removes cbonsai and cbonsai.6
make install          # installs to /usr/local (binary, man page, bash completion)
make install PREFIX=~/.local   # user-local install
```

Build dependencies: `ncursesw`/`panelw` (resolved via `pkg-config`; falls back to `-lncursesw -ltinfo -lpanelw`). `scdoc` is optional — without it the man page is skipped with a warning, but the binary still builds. The compiler is invoked with strict warnings (`-Wall -Wextra -Wshadow -Wpointer-arith -Wcast-qual -pedantic`); keep new code warning-clean.

Note: this is a POSIX/ncurses program. It does not build natively on Windows (the working directory is Windows, but the toolchain assumes a Unix-like environment — WSL, Linux, or macOS).

There is no test suite. Verify changes by running the binary, e.g. `./cbonsai -l` (live growth) or `./cbonsai -p -s 42` (deterministic static output via fixed seed).

## Source layout

- `cbonsai.c` — all program logic
- `cbonsai.scd` — scdoc source for the man page (`cbonsai.6`); keep in sync with `printHelp()` and the option parser when adding/changing flags
- `completions/bash/cbonsai.bash` — bash completion; update when adding/changing flags
- `Makefile`, `LICENSE`, `README.md`

When you add or rename a CLI option, **four places must stay consistent**: `getopt_long` parsing in `main()`, the `long_options[]` table, `printHelp()`, `cbonsai.scd`, and the bash completion file.

## Architecture

The program is organized around three structs threaded through nearly every function (see top of `cbonsai.c`):

- `struct config` — all user options plus runtime state (seed, `targetBranchCount` for save/load).
- `struct ncursesObjects` — the four ncurses `WINDOW`s and their `PANEL`s: base, tree, message border, message. Panels are layered; `update_panels()` + `doupdate()` composites them.
- `struct counters` — live branch/shoot counts during a single tree's growth.

**Tree generation is recursive.** `growTree()` seeds one `branch()` call for the trunk. `branch()` walks a life counter down to 0; at each step it calls `setDeltas()` (dice-roll-based dx/dy per `branchType`) and `chooseString()` (which characters to draw), then recursively spawns child `branch()` calls for shoots, dying branches (leaves), and occasional new trunks. The `enum branchType {trunk, shootLeft, shootRight, dying, dead}` drives both movement and rendering. Growth tuning constants (life, multiplier, the dice thresholds in `setDeltas`) are hand-tuned to look best at the **default size** — large trees look less bonsai-like by design.

**Two render paths:**
- ncurses live/interactive: draws into `treeWin`, composites panels. `--live` calls `updateScreen()` (with `nanosleep`) after each step.
- `--print` (`printstdscr()`): after growth, overlays all windows onto `stdscr`, then walks every cell reading `cchar_t`, converting ncurses color pairs to raw ANSI escape codes printed to stdout — so the finished tree survives in scrollback after the program exits.

**Save/load** (`-W`/`-C`, and `-S` screensaver mode): only the seed and branch count are persisted (`saveToFile`/`loadFromFile`), not the full tree. Loading replays growth deterministically from the seed up to the saved branch count, skipping screen updates until `targetBranchCount` is reached. Default cache path follows XDG (`createDefaultCachePath()`): `$XDG_CACHE_HOME/cbonsai` → `$HOME/.cache/cbonsai` → `./cbonsai`.

**Lifecycle:** `main()` parses args → optionally loads from file → seeds `srand` → `do/while` loop of `init()` (ncurses setup, color pairs, windows, message) + `growTree()`, repeating while `--infinite`. Exit goes through `finish()` (tears down ncurses, optionally saves) and `quit()` (frees windows/panels/allocated paths, `exit`).

## Conventions

- Indentation is **tabs**.
- Memory: `chooseString()` mallocs a per-branch string the caller frees each step; `saveFile`/`loadFile` are heap-allocated and freed in `quit()`. Match this manual-free discipline.
- Color pairs 1–4 are dark-leaf / dark-wood / light-leaf / light-wood (configurable via `-k`), pair 5 is text. Terminals with `<256` colors fall back to 8-color mode (`init()`).
