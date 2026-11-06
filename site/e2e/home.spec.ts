import { expect, test, type Page } from '@playwright/test';
import {
  BASE, FAST, command, expectTextToChange, fgColours, inkCount, maxInk, openHome, screenText, terminal, trackErrors,
} from './helpers';

test.describe('Home', () => {
  test('starts with the documented command and a growing tree', async ({ page }) => {
    const errors = trackErrors(page);
    await openHome(page);
    await expect(command(page)).toHaveText('bonsai -l -i -T cherry -s 42');
    const first = await inkCount(page);
    await expect.poll(() => inkCount(page), { timeout: 20_000 }).toBeGreaterThan(first);
    expect(errors).toEqual([]);
  });

  test('tree survives q, a letter and Ctrl-C', async ({ page }) => {
    await openHome(page, FAST);
    await expect(terminal(page)).toBeVisible();
    await terminal(page).click();
    await page.keyboard.press('q');
    await page.keyboard.press('x');
    await page.keyboard.press('Control+c');
    const after = await screenText(page);
    // Fast frames: the text must keep changing after the keys.
    await expectTextToChange(page, after);
    const again = await screenText(page);
    await expectTextToChange(page, again);
    await expect(terminal(page)).toHaveAttribute('data-ready', 'true');
    expect(await inkCount(page)).toBeGreaterThan(0);
  });

  test('a control changes both the command and the tree', async ({ page }) => {
    await openHome(page, FAST);
    const big = await maxInk(page, 2500);
    await page.getByLabel('Life').fill('3');
    await expect(command(page)).toContainText('-L 3');
    await expect(terminal(page)).toHaveAttribute('data-ready', 'true');
    // Regrown with tiny life: far less ink than before.
    await expect.poll(() => maxInk(page, 1500), { timeout: 20_000 }).toBeLessThan(big / 2);
  });

  test('New tree changes the seed in the command', async ({ page }) => {
    await openHome(page);
    await page.getByRole('button', { name: 'New tree' }).click();
    await expect(command(page)).not.toContainText('-s 42');
  });

  test('theme change leaves no old-theme colours', async ({ page }) => {
    await openHome(page, '?seed=7&theme=maple&time=0.01&wait=0');
    // maple leaves: 124 / 202. wisteria leaves: 97 / 183.
    await expect.poll(() => fgColours(page)).toEqual(expect.arrayContaining([124]));
    await page.getByLabel('Theme').selectOption('wisteria');
    await expect(command(page)).toContainText('-T wisteria');
    await expect.poll(async () => {
      const now = await fgColours(page);
      return !now.includes(124) && !now.includes(202) && (now.includes(97) || now.includes(183));
    }, { timeout: 30_000 }).toBe(true);
    await expect(terminal(page)).toHaveAttribute('data-ready', 'true');
  });

  test('window resize keeps a growing tree of sane size', async ({ page }) => {
    await openHome(page, FAST);
    await page.setViewportSize({ width: 700, height: 800 });
    // The terminal remounts ~200 ms after the resize, so everything is polled.
    const rows = () => page.locator('.xterm-rows > div').count();
    await expect.poll(rows).toBeGreaterThan(5);
    expect(await rows()).toBeLessThan(200);
    await expect(terminal(page)).toHaveAttribute('data-ready', 'true');
    await expect.poll(() => inkCount(page)).toBeGreaterThan(0);
    await expect.poll(async () => (await terminal(page).boundingBox())?.width ?? 0).toBeGreaterThan(200);
    expect((await terminal(page).boundingBox())!.width).toBeLessThanOrEqual(700);
    const t = await screenText(page);
    await expectTextToChange(page, t);
  });

  test('?seed=7&theme=maple preset, and absent theme means green', async ({ page }) => {
    await openHome(page, '?seed=7&theme=maple');
    await expect(command(page)).toHaveText('bonsai -l -i -T maple -s 7');
    await expect(page.getByLabel('Theme')).toHaveValue('maple');
    await page.goto(BASE + '?seed=7');
    await expect(command(page)).toHaveText('bonsai -l -i -s 7');
    await expect(page.getByLabel('Theme')).toHaveValue('green');
  });

  test('invalid colours show a message and keep the tree', async ({ page }) => {
    await openHome(page, FAST);
    await page.getByText('Custom colours').click();
    await page.getByLabel('Colour numbers').fill('1,2');
    await expect(page.getByRole('alert')).toContainText("colour numbers don't work");
    await expect(terminal(page)).toBeVisible();
    await expect.poll(() => inkCount(page)).toBeGreaterThan(0);
    const t = await screenText(page);
    await expectTextToChange(page, t);
  });

  test('Screensaver only changes the command', async ({ page }) => {
    await openHome(page);
    await page.getByLabel('Screensaver').check();
    await expect(command(page)).toContainText('-S');
    await expect(command(page)).not.toContainText('-l -i');
  });

  test('Copy button says Copied', async ({ page, context, browserName }) => {
    if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(BASE);
    const btn = page.locator('#playground [data-copy]');
    await btn.click();
    // Firefox allows writeText from a user gesture without permissions.
    await expect(btn).toHaveText('Copied');
    if (browserName === 'chromium') {
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('bonsai -l -i -T cherry -s 42');
    }
  });
});

test.describe('Home fallbacks', () => {
  test.use({ javaScriptEnabled: false });
  test('without JavaScript the still tree shows', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('.home-tree')).toBeVisible();
    expect(await page.locator('.home-tree').innerText()).toMatch(/\S/);
    await expect(page.locator('.home-fail')).toBeHidden();
  });
});

test.describe('Reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  const rows = (page: Page) => page.locator('.xterm-rows').innerText();

  test('shows a still tree that follows the settings, and Play starts growth', async ({ page }) => {
    await page.goto(`${BASE}?seed=7&time=0.01&wait=0`);
    await expect(terminal(page)).toHaveAttribute('data-ready', 'true');
    await expect.poll(() => inkCount(page)).toBeGreaterThan(0);
    const still = await rows(page);
    await page.waitForTimeout(600);
    expect(await rows(page)).toBe(still);

    await page.getByLabel('Seed').fill('8');
    await expect.poll(() => rows(page)).not.toBe(still);

    await page.locator('.home-play-btn').click();
    await expect(page.locator('.home-play-btn')).toHaveCount(0);
    const first = await rows(page);
    await expect.poll(() => rows(page)).not.toBe(first);
  });
});

test('a blocked playground.js shows the failure note', async ({ page }) => {
  await page.route('**/playground/playground.js', (r) => r.abort());
  await page.goto(BASE);
  await expect(page.locator('.home-fail')).toBeVisible();
  await expect(page.locator('.home-tree')).toBeVisible();
});

test('tabbing through Home never enters xterm and reaches every control', async ({ page }) => {
  await openHome(page);
  const wanted = ['Theme', 'Pot', 'Life', 'Branches', 'Speed', 'Pause between trees', 'Leaves', 'Message', 'Seed',
    'New tree', 'Custom colours', 'Screensaver', 'Copy'];
  const seen = new Set<string>();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const legend = (el as HTMLInputElement).type === 'radio' ? el.closest('fieldset')?.querySelector('legend')?.textContent : null;
      const label = legend ?? (el as HTMLInputElement).labels?.[0]?.textContent ?? el.textContent ?? '';
      return { inXterm: !!el.closest('.xterm') || el.tagName === 'TEXTAREA', label: label.trim() };
    });
    expect(info.inXterm).toBe(false);
    seen.add(info.label);
  }
  for (const w of wanted) expect([...seen].some((s) => s.startsWith(w)), `reached ${w}`).toBe(true);
});
