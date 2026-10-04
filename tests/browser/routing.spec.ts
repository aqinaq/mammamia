import { test, expect, type Page } from '@playwright/test';
import { services } from '../../src/config';

async function checkService(page: Page, name: string) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
  for (const img of await page.locator('main img:visible').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((element: HTMLImageElement) =>
      element.complete && element.naturalWidth > 0)).toBe(true);
  }
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px Manrope', 'Алматы'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('32px Lora', 'Алматы'))).toBe(true);
}

for (const service of services) {
  test(`${service.id}: home link, new tab, reload and assets`, async ({ page, context }) => {
    const path = `/offers/${service.id}`;
    const errors: string[] = [];
    function monitor(tab: Page) {
      tab.on('pageerror', error => errors.push(error.message));
      tab.on('response', response => {
        if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      });
      tab.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    }
    context.on('page', monitor);
    monitor(page);
    await page.goto('/');
    await page.locator(`.card-heading a[href="${path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await checkService(page, service.name);

    const direct = await context.newPage();
    const response = await direct.goto(path);
    expect(response?.status()).toBe(200);
    await checkService(direct, service.name);
    const reloaded = await direct.reload();
    expect(reloaded?.status()).toBe(200);
    await checkService(direct, service.name);

    for (const [url, type] of [
      [service.image, 'image/'],
      ['/fonts/manrope-normal-cyrillic.woff2', 'font/'],
      ['/favicon.svg', 'image/svg+xml'],
    ]) {
      const asset = await direct.request.get(url);
      expect(asset.status()).toBe(200);
      expect(asset.headers()['content-type']).toContain(type);
    }
    expect(errors).toEqual([]);
  });
}
