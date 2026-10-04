import { test, expect } from '@playwright/test';

test('hero artwork is visible on arrival and links to booking in both languages', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const artwork = page.getByRole('link', { name: 'Шығармашылық сабаққа жазылу' });
  await expect(artwork).toBeInViewport({ ratio: 1 });
  await expect(artwork).toHaveAttribute('href', '/#booking');
  await expect(page.locator('.hero-artwork')).toHaveAttribute('data-progress', '0.000');
  await expect(page.locator('.creative-leaves')).toHaveCSS('opacity', '0');
  await expect(page.locator('.creative-pattern')).toHaveCSS('opacity', '0');
  await page.screenshot({ path: `artifacts/hero-${testInfo.project.name}-initial.png`, animations: 'disabled' });
  await artwork.click();
  await expect(page).toHaveURL(/#booking$/);
  await expect(page.locator('#service')).toBeInViewport();
  await page.goto('/');
  await page.getByRole('button', { name: 'RU', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Записаться на творческое занятие' })).toHaveAttribute('href', '/#booking');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('scroll automatically draws the ornament, grows flowers and reverses', async ({ page }, testInfo) => {
  await page.goto('/');
  const art = page.locator('.hero-artwork');
  await expect(art).toHaveAttribute('data-progress', '0.000');
  await page.evaluate(() => window.scrollTo({ top: 220, behavior: 'instant' }));
  await expect.poll(async () => Number(await art.getAttribute('data-progress'))).toBeGreaterThan(.3);
  await expect.poll(async () => Number(await page.locator('.creative-pattern').evaluate(el => getComputedStyle(el).opacity))).toBeGreaterThan(.5);
  await page.evaluate(() => window.scrollTo({ top: 540, behavior: 'instant' }));
  await expect.poll(async () => Number(await art.getAttribute('data-progress'))).toBeGreaterThan(.9);
  await expect(page.locator('.creative-blooms')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-art-link')).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: `artifacts/hero-${testInfo.project.name}-bloom.png`, animations: 'disabled' });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(art).toHaveAttribute('data-progress', '0.000');
  await expect(page.locator('.creative-blooms')).toHaveCSS('opacity', '0');
  await page.locator('.hero-art-link').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#booking$/);
});

test('reduced motion keeps a complete clickable scene on a narrow screen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await expect(page.locator('.hero-artwork')).toHaveAttribute('data-progress', '1.000');
  await expect(page.locator('.creative-blooms')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-art-link')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('.hero-sticky')).toHaveCSS('position', 'relative');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.hero-art-link').click();
  await expect(page).toHaveURL(/#booking$/);
});

test('a configured manager number switches the artwork to a localized WhatsApp link', async ({ page }) => {
  // Supply a test-only configuration; never open WhatsApp or send a message.
  await page.route('**/src/config.ts*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/whatsappNumber:\s*(['"]).*?\1/, 'whatsappNumber: "70000000000"');
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  const link = page.getByRole('link', { name: 'WhatsApp-та менеджерге жазу' });
  await expect(link).toHaveAttribute('target', '_blank');
  const url = new URL((await link.getAttribute('href'))!);
  expect(url.origin + url.pathname).toBe('https://wa.me/70000000000');
  expect(url.searchParams.get('text')).toContain('Сәлеметсіз бе!');
  await page.getByRole('button', { name: 'RU', exact: true }).click();
  const ruUrl = new URL((await page.getByRole('link', { name: 'Написать менеджеру в WhatsApp' }).getAttribute('href'))!);
  expect(ruUrl.searchParams.get('text')).toContain('Здравствуйте!');
});
