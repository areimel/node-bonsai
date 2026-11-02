# node-bonsai

Grow a colorful bonsai tree in your terminal. Every tree is randomly generated, so each one is different. This is a rewrite of [cbonsai](./original-cbonsai/).

## Get started

You'll need [Node.js](https://nodejs.org/) 20 or newer. Then run:

```bash
git clone https://github.com/areimel/node-bonsai.git
cd node-bonsai
npm install
```

## Run it

| What you want | What to type |
|---------------|--------------|
| Draw one tree | `npm run dev` |
| Watch a tree grow | `npm run live` |
| Run a screensaver of new trees | `npm run screensaver` |

Press `q` to quit, or any key in the screensaver.

## Customize it

```bash
npm run live -- --theme cherry        # pink blossoms
npm run dev -- --message "Hello"      # add a message beside the tree
npm run live -- --life 60             # grow a bigger tree
npm run dev -- --print                # print the tree and return to your prompt
```

The themes are `green`, `cherry`, `maple` and `wisteria`.

The extra `--` is required: it passes your options on to the app. Without it, npm keeps them for itself and you may just get a still tree.

## See it in your browser

The website in [`site/`](./site/) runs the same app in a web page, with controls for every setting and nothing to set up in your terminal. To open it on your own computer (this needs Node.js 22.23.4 or newer):

```bash
npm install
cd site
npm install
npm run dev
```

Then open the address it prints, usually http://localhost:4321/node-bonsai/.

## Good to know

Trees from `npm run live` and `npm run screensaver` disappear when you quit. To keep a tree on screen, use `--print`.

## Learn more

See [README-TECHNICAL.md](./README-TECHNICAL.md) for every option and how the project works.

node-bonsai is based on cbonsai by John Allbritten and is licensed under the GPL.
