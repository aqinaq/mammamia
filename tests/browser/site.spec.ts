import { test, expect } from '@playwright/test';

test('Kazakh default, Russian switch, filters, deep links, gallery, FAQ', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'kk');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Алматыдағы фотостудия');
  await expect(page.locator('.service-card')).toHaveCount(3);
  await page.locator('.filters').getByRole('button', { name: 'Фотостудия', exact: true }).click();
  await expect(page.locator('.service-card')).toHaveCount(1);
  await page.locator('.filters').getByRole('button', { name: 'Шеберлік сабақтары' }).click();
  await expect(page.locator('.service-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'RU', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Фотостудия в Алматы');
  await page.locator('.filters').getByRole('button', { name: 'Все', exact: true }).click();
  await page.getByRole('link', { name: 'Подробнее: CLAY DATE', exact: true }).click();
  await expect(page).toHaveURL(/\/offers\/clay-date$/);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('CLAY DATE');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await page.locator('.detail-gallery button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.lightbox-top>span')).toHaveText('2 / 3');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.locator('.faq-items summary').first().click();
  await expect(page.locator('.faq-items details').first()).toHaveAttribute('open', '');
  await page.getByRole('link', { name: 'Выбрать время', exact: false }).first().click();
  await expect(page.locator('#service')).toHaveValue('clay-date');
  await expect(page.locator('#people')).toBeDisabled();
  await expect(page.getByTestId('total')).toHaveText('24 000 ₸');
  await page.getByRole('button', { name: 'KZ', exact: true }).click();
  await page.goto('/'); await page.evaluate(() => window.scrollTo(0, 0));
  for (const img of await page.locator('main img:visible').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-home.png`, fullPage: true, animations: 'disabled' });
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-first-screen.png`, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('small screen layout and keyboard navigation', async ({ page }, testInfo) => {
  await page.goto('/');
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.goto('/offers/light-room');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('.detail-gallery button').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.detail-gallery button').first()).toBeFocused();
});

test('complete booking, price changes, disabled slots, bilingual preview and copy', async ({ page, context }, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#booking');
  await page.locator('#hours').selectOption('3');
  await page.locator('#people').selectOption('4');
  await expect(page.getByTestId('total')).toHaveText('36 000 ₸');
  await expect(page.locator('.time-choices button').filter({ hasText: '13:00' })).toBeDisabled();
  await page.locator('.time-choices button').filter({ hasText: '10:00' }).click();
  await page.locator('#phone').fill('+7 (701) 234-56-78');
  await page.getByRole('button', { name: 'Өтініш жіберу' }).click();
  await expect(page.getByRole('heading', { name: 'Өтінішіңіз қабылданды!' })).toBeVisible();
  await page.locator('.message-details summary').click();
  await expect(page.locator('#message')).toContainText('4 адам / 3 сағат');
  await expect(page.locator('#message')).toContainText('36 000 ₸');
  await expect(page.getByRole('button', { name: 'WhatsApp нөмірі бапталмаған' })).toBeDisabled();
  await page.getByRole('button', { name: 'Хабарламаны көшіру' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Сәлеметсіз бе!');
  await page.getByRole('button', { name: 'RU', exact: true }).click();
  await expect(page.locator('#message')).toContainText('Здравствуйте!');
  await expect(page.getByRole('status')).toHaveText('Запись подтверждает администратор.');
  await page.locator('.message-details summary').click();
  await page.locator('.request-result').screenshot({ path: `artifacts/${testInfo.project.name}-request.png`, animations: 'disabled', style: '.header,.mobile-booking{visibility:hidden!important}' });
  await page.getByRole('button', { name: 'Новая заявка', exact: false }).click();
  await page.locator('#service').selectOption('paint-evening');
  await page.locator('#people').selectOption('3');
  await expect(page.getByTestId('total')).toHaveText('30 000 ₸');
  await page.locator('.time-choices button:not([disabled])').first().click();
  await page.getByRole('button', { name: 'Отправить заявку' }).click();
  await page.locator('.message-details summary').click();
  await expect(page.locator('#message')).toContainText('PAINT EVENING');
  await expect(page.locator('#message')).toContainText('3 чел.');
  await page.getByRole('button', { name: 'Новая заявка', exact: false }).click();
  await page.locator('#date').fill('2020-01-01');
  await expect(page.locator('#date')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('.time-choices button:not([disabled])')).toHaveCount(0);
  await page.getByRole('button', { name: 'Отправить заявку' }).click();
  await expect(page.locator('#message')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('mobile menu and direct service pages retain accessible navigation', async ({ page }, testInfo) => {
  await page.goto('/offers/paint-evening');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('PAINT EVENING');
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Мәзір', exact: true }).click();
    await page.locator('#mobile-menu').getByRole('link', { name: 'Байланыс' }).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator('#mobile-menu')).toHaveCount(0);
    await expect(page.locator('.mobile-booking')).toBeVisible();
  }
  await page.goto('/offers/light-room');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('LIGHT ROOM');
  await page.goto('/does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Бұл бет табылмады');
});


test('phone validation, durable automatic receipt and deletion', async ({ page }, testInfo) => {
  await page.goto('/#booking');
  await page.locator('.time-choices button:not([disabled])').first().click();
  await page.getByRole('button', { name: 'Өтініш жіберу', exact: true }).click();
  await expect(page.locator('#phone')).toBeFocused();
  await expect(page.locator('#phone-error')).toBeVisible();
  await expect(page.locator('.request-result')).toHaveCount(0);
  await page.locator('#phone').fill('abc123');
  await page.getByRole('button', { name: 'Өтініш жіберу', exact: true }).click();
  await expect(page.locator('#phone')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#phone').fill('+7 (701) 234-56-78');
  await page.locator('.booking-panel').screenshot({ path: `artifacts/${testInfo.project.name}-booking-form.png`, animations: 'disabled', style: '.header,.mobile-booking{visibility:hidden!important}' });
  await page.getByRole('button', { name: 'Өтініш жіберу', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Өтінішіңіз қабылданды!' })).toBeVisible();
  const receipt = await page.getByTestId('request-id').innerText();
  await expect(page.locator('.receipt-phone')).toContainText('+77012345678');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mammamia-requests-v1') || '[]').length)).toBe(1);
  await page.locator('.request-result').screenshot({ path: `artifacts/${testInfo.project.name}-accepted-kz.png`, animations: 'disabled', style: '.header,.mobile-booking{visibility:hidden!important}' });
  await page.reload();
  await expect(page.getByTestId('request-id')).toHaveText(receipt);
  await page.getByRole('button', { name: 'RU', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ваша заявка принята!' })).toBeVisible();
  await page.locator('.request-result').screenshot({ path: `artifacts/${testInfo.project.name}-accepted-request.png`, animations: 'disabled', style: '.header,.mobile-booking{visibility:hidden!important}' });
  await page.getByRole('button', { name: 'Удалить эту демо-заявку' }).click();
  await expect(page.locator('#phone')).toHaveValue('+7');
  expect(await page.evaluate(() => localStorage.getItem('mammamia-requests-v1'))).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('blocked storage does not show false acceptance', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; });
  await page.goto('/#booking');
  await page.locator('.time-choices button:not([disabled])').first().click();
  await page.locator('#phone').fill('+7 (701) 234-56-78');
  await page.getByRole('button', { name: 'Өтініш жіберу', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Өтініш сақталмады');
  await expect(page.locator('.request-result')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Өтініш жіберу', exact: true })).toBeEnabled();
});

test('configured WhatsApp booking prepares a complete draft without claiming delivery', async ({ page }) => {
  await page.route('**/src/config.ts*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/whatsappNumber:\s*(['"]).*?\1/, 'whatsappNumber: "70000000000"');
    await route.fulfill({ response, body });
  });
  await page.goto('/?service=clay-date#booking');
  await page.locator('.time-choices button:not([disabled])').first().click();
  await page.locator('#phone').fill('+7 701 234 56 78');
  await page.getByRole('button', { name: 'Хабарлама дайындау', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Хабарлама дайын', exact: true })).toBeFocused();
  const link = page.getByRole('link', { name: 'WhatsApp арқылы жіберу' });
  const url = new URL((await link.getAttribute('href'))!);
  expect(url.origin + url.pathname).toBe('https://wa.me/70000000000');
  expect(url.searchParams.get('text')).toContain('CLAY DATE');
  expect(url.searchParams.get('text')).toContain('24 000 ₸');
  expect(url.searchParams.get('text')).toContain('+77012345678');
  expect(await page.evaluate(() => localStorage.getItem('mammamia-requests-v1'))).toBeNull();
  await expect(page.getByTestId('request-id')).toHaveCount(0);
  await page.getByRole('button', { name: 'RU', exact: true }).click();
  const russianUrl = new URL((await page.getByRole('link', { name: 'Отправить в WhatsApp' }).getAttribute('href'))!);
  expect(russianUrl.searchParams.get('text')).toContain('Здравствуйте!');
  await page.getByRole('button', { name: 'Изменить выбор', exact: true }).click();
  await expect(page.locator('#service')).toHaveValue('clay-date');
});
