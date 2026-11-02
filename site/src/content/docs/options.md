---
title: All options
description: Every option, with its short and long form, default and meaning.
order: 3
---

Add options after `npm run dev`, `npm run live` or `bonsai`. Each option has a
short form with one dash and a long form with two dashes. Both do the same
thing.

## Options

| Short | Long | Default | Meaning |
| --- | --- | --- | --- |
| `-l` | `--live` | off | Show each step of growth |
| `-t` | `--time <secs>` | 0.03 | Seconds between growth steps |
| `-i` | `--infinite` | off | Keep growing trees |
| `-w` | `--wait <secs>` | 4 | Seconds between trees in infinite mode |
| `-S` | `--screensaver` | off | Same as `-li`, and quit on any key |
| `-m` | `--message <str>` | none | Attach a message beside the tree |
| `-b` | `--base <int>` | 1 | Base art: 0 none, 1 wide, 2 narrow |
| `-c` | `--leaf <list>` | `&` | Comma-separated leaf strings |
| `-k` | `--colors <list>` | 2,3,10,11 | Four colour indices, see Themes |
| `-T` | `--theme <name>` | green | Theme: green, cherry, maple, wisteria |
| `-M` | `--multiplier <n>` | 5 | Branch multiplier, 0 to 20 |
| `-L` | `--life <n>` | 32 | Life; more means more growth, 0 to 200, but above about 80 it can run out of memory |
| `-p` | `--print` | off | Print the tree to stdout when finished |
| `-s` | `--seed <int>` | clock | Seed the random generator |
| `-W` | `--save <file>` | none | Save progress to a file |
| `-C` | `--load <file>` | none | Load progress from a file |
| `-v` | `--verbose` | off | Increase verbosity |
| `-h` | `--help` | | Show the help text |

`--live`, `--infinite` and `--screensaver` use the terminal's alternate screen.
Your shell comes back on quit, and the tree disappears. Use `--print` to keep
the tree in your scrollback.

## The double dash

Put `--` before your options when you use npm:

```bash
npm run dev -- --live --life 40
```

Without `--`, npm reads `--live` itself and draws a still tree. node-bonsai
shows a notice for `--live`, `-l`, `--infinite` and `--screensaver`. It cannot
detect `-S` or `-i`.

## Save and load

`--save` writes the seed and the branch count to a file. `--load` reads the seed back. Only the seed
is restored (the branch count is ignored), so pass the same other options again to get the same tree. With
`--save`, the tree still draws unless you also add `--print`.

## Seeds

The same seed makes the same tree. Without `--seed`, node-bonsai uses
the clock, so each run gives a new tree.
