import { expect, type Locator, type Page } from '@playwright/test';

export const BASE = '/node-bonsai/';
export const PAGES = ['', 'examples/', 'docs/', 'contact/'].map((p) => BASE + p);
const DOCS = ['install', 'quick-start', 'options', 'themes', 'differences'];
export const DOC_PAGES = DOCS.map((d) => `${BASE}docs/${d}/`);

/** Fast, looping tree: frames change every ~10 ms. */
export const FAST = '?time=0.01&wait=0&seed=7';

export const terminal = (page: Page) => page.getByTestId('terminal');
export const command = (page: Page) => page.getByTestId('command');

/** The visible text of the xterm screen (DOM renderer). */
export async function screenText(page: Page): Promise<string> {
  return page.locator('.xterm-rows').first().innerText().catch(() => '');
}

/** Count of non-space characters on the xterm screen. */
export async function inkCount(page: Page): Promise<number> {
  return (await screenText(page)).replace(/\s/g, '').length;
}

/** Largest ink count seen while sampling for `ms`. */
export async function maxInk(page: Page, ms: number): Promise<number> {
  let max = 0;
  const end = Date.now() + ms;
  while (Date.now() < end) {
    max = Math.max(max, await inkCount(page));
    await page.waitForTimeout(100);
  }
  return max;
}

/** Open Home and wait for the terminal to be ready and drawing. */
export async function openHome(page: Page, query = '') {
  await page.goto(BASE + query);
  await expect(terminal(page)).toHaveAttribute('data-ready', 'true');
  await expect.poll(() => inkCount(page)).toBeGreaterThan(0);
}

/** Collect console errors and uncaught page errors. */
export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

/** Distinct `xterm-fg-N` colour numbers in use on the screen. */
export function fgColours(page: Page): Promise<number[]> {
  return page.locator('.xterm-rows [class*="xterm-fg-"]').evaluateAll((els) => {
    const set = new Set<number>();
    for (const el of els) for (const c of el.classList) {
      const m = /^xterm-fg-(\d+)$/.exec(c);
      if (m) set.add(Number(m[1]));
    }
    return [...set].sort((a, b) => a - b);
  });
}

/** Wait until the screen text differs from `before` (it keeps changing as frames draw). */
export async function expectTextToChange(page: Page, before: string) {
  await expect.poll(() => screenText(page), { timeout: 20_000 }).not.toBe(before);
}

/** Pull out the flags of a command, as a sorted list, e.g. `-T cherry`. */
export function flagSet(cmd: string): string[] {
  const parts = cmd.trim().split(/\s+/).slice(1);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('-') && parts[i + 1] && !parts[i + 1].startsWith('-')) out.push(`${parts[i]} ${parts[++i]}`);
    else out.push(parts[i]);
  }
  return out.sort();
}

export const text = (l: Locator) => l.innerText();
