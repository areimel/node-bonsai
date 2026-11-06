import { expect, test } from '@playwright/test';
import { BASE } from './helpers';

/** Crawl every internal page from Home; every resource must be 200 and stay under the base. */
test('base path: every link and asset resolves under /node-bonsai/', async ({ page, request }) => {
  const bad: string[] = [];
  const checked = new Set<string>();
  page.on('response', (r) => {
    const u = new URL(r.url());
    if (u.hostname === '127.0.0.1' && ![200, 304].includes(r.status())) bad.push(`${r.status()} ${u.pathname}`);
    if (u.hostname === '127.0.0.1' && !u.pathname.startsWith(BASE)) bad.push(`escapes base: ${u.pathname}`);
  });
  const queue = [BASE];
  const seen = new Set<string>();
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const res = await page.goto(path, { waitUntil: 'load' });
    expect(res?.status(), path).toBe(200);
    const refs = await page.evaluate(() => {
      const attrs: [string, string][] = [['a', 'href'], ['link', 'href'], ['script', 'src'], ['img', 'src'], ['source', 'src']];
      const out: { tag: string; raw: string }[] = [];
      for (const [tag, attr] of attrs)
        document.querySelectorAll(`${tag}[${attr}]`).forEach((e) => out.push({ tag, raw: e.getAttribute(attr)! }));
      return out;
    });
    for (const { tag, raw } of refs) {
      if (/^(mailto:|tel:|#)/.test(raw)) continue;
      const u = new URL(raw, page.url());
      if (u.origin !== new URL(page.url()).origin) {
        expect(raw, 'external links must be absolute').toMatch(/^https?:\/\//);
        continue; // external: never fetched
      }
      expect(u.pathname.startsWith(BASE), `${tag} ${raw} on ${path}`).toBe(true);
      const key = u.pathname + (tag === 'a' ? '' : u.search);
      if (tag === 'a') {
        if (/\.[a-z0-9]+$/i.test(u.pathname)) {
          if (!checked.has(key)) { checked.add(key); expect((await request.get(u.pathname)).status(), key).toBe(200); }
        } else queue.push(u.pathname);
      } else if (!checked.has(key)) {
        checked.add(key);
        expect((await request.get(u.pathname + u.search)).status(), key).toBe(200);
      }
    }
    // Fonts and images pulled in by CSS arrive as page responses (collected above).
    const css = await page.evaluate(() => [...document.styleSheets].flatMap((s) => {
      try { return [...s.cssRules].map((r) => r.cssText); } catch { return []; }
    }).join('\n'));
    for (const m of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      if (m[1].startsWith('data:')) continue;
      const u = new URL(m[1], page.url());
      if (u.origin === new URL(page.url()).origin) {
        expect(u.pathname.startsWith(BASE), `css url ${m[1]}`).toBe(true);
        if (!checked.has(u.pathname)) { checked.add(u.pathname); expect((await request.get(u.pathname)).status(), u.pathname).toBe(200); }
      }
    }
  }
  expect(seen.size).toBeGreaterThanOrEqual(9);
  expect(bad).toEqual([]);
});

test('built HTML has no root-relative URLs outside the base', async ({ request }) => {
  for (const path of [BASE, BASE + 'examples/', BASE + 'docs/', BASE + 'contact/']) {
    const html = await (await request.get(path)).text();
    const escapes = [...html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]).filter((u) => !u.startsWith(BASE) && !u.startsWith('//'));
    expect(escapes, path).toEqual([]);
  }
});
