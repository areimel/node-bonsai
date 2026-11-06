import { expect, test } from '@playwright/test';
import { BASE, DOC_PAGES, PAGES, command, flagSet } from './helpers';

test('Examples: Try it links stay under the base and reproduce the example command', async ({ page }) => {
  await page.goto(BASE + 'examples/');
  const specimens = page.locator('article.specimen[data-example]');
  const n = await specimens.count();
  expect(n).toBeGreaterThanOrEqual(5);
  const items: { id: string; href: string; cmd: string }[] = [];
  for (let i = 0; i < n; i++) {
    const s = specimens.nth(i);
    items.push({
      id: (await s.getAttribute('data-example'))!,
      href: (await s.locator('.try a').getAttribute('href'))!,
      cmd: (await s.locator('.plate-cmd').first().innerText()).trim(),
    });
  }
  for (const it of items) expect(it.href, it.id).toMatch(/^\/node-bonsai\//);
  for (const it of items) {
    await page.goto(it.href);
    await expect(command(page)).toBeVisible();
    const got = (await command(page).innerText()).trim();
    expect(flagSet(got), it.id).toEqual(flagSet(it.cmd + ' -l -i'));
  }
});

test('Contact: no form, GitHub present, no empty links', async ({ page }) => {
  await page.goto(BASE + 'contact/');
  await expect(page.locator('main form')).toHaveCount(0);
  await expect(page.locator('main a[href^="https://github.com/"]')).toHaveCount(1);
  const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.filter((h) => h === '' || h === 'mailto:' || h === '#')).toEqual([]);
  expect(await page.locator('a[href=""]').count()).toBe(0);
});

test('Docs: every page loads and the nav marks the current page', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Docs pages' });
  await page.goto(BASE + 'docs/');
  await expect(page.locator('h1')).toBeVisible();
  const links = await nav.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(links.sort()).toEqual([...DOC_PAGES].sort());
  for (const href of DOC_PAGES) {
    const res = await page.goto(href);
    expect(res?.status(), href).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(nav.locator('[aria-current="page"]')).toHaveAttribute('href', href);
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Docs' }))
      .toHaveAttribute('aria-current', 'page');
  }
});

test('main nav marks the current section', async ({ page }) => {
  for (const [path, name] of [['examples/', 'Examples'], ['contact/', 'Contact']] as const) {
    await page.goto(BASE + path);
    const current = page.getByRole('navigation', { name: 'Main' }).locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(name);
  }
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 375, height: 800 } });
  for (const path of [...PAGES, ...DOC_PAGES]) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);
      const { sw, cw } = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
      }));
      expect(sw).toBeLessThanOrEqual(cw);
    });
  }
});
