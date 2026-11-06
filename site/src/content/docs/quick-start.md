---
title: Quick start
description: The common commands, and how to quit.
order: 2
---

Run these commands from the `node-bonsai` folder.

## Run a tree

| What you want | What to type |
| --- | --- |
| Draw one tree | `npm run dev` |
| Watch a tree grow | `npm run live` |
| Run a screensaver of new trees | `npm run screensaver` |

Press `q` to quit. In the screensaver, press any key to quit.

## Change the tree

| Command | What it does |
| --- | --- |
| `npm run live -- --theme cherry` | Grows pink blossoms |
| `npm run dev -- --message "Hello"` | Adds a message beside the tree |
| `npm run live -- --life 60` | Grows a bigger tree |
| `npm run dev -- --print` | Prints the tree and returns to your prompt |

The `--` before your options is required. It passes the options on to
node-bonsai. Without it, npm keeps the options for itself, and you may get a
still tree. The All options page lists every option.

## Keep a tree

Trees from `npm run live` and `npm run screensaver` disappear when you quit.
To keep a tree in your terminal, use `--print`.

## Use the bonsai command

You can also run node-bonsai as `bonsai`. Build the project and link it once:

```bash
npm run build
npm link
```

Then type `bonsai` with any options, for example `bonsai --theme cherry`.

## Known limitation

When the `CI` environment variable is set, the screen stays blank until the
app exits. Unset `CI` to see the tree.
