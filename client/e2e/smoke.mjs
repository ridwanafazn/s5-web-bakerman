import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import puppeteer from 'puppeteer-core';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:4173';
const MEMBER_EMAIL =
  process.env.E2E_MEMBER_EMAIL || 'member.bakerman.qa@gmail.com';
const MEMBER_PASSWORD = process.env.E2E_MEMBER_PASSWORD || 'Bakerman123!';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'bakerman@gmail.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'bakermanAdmin';
const ACTIVITY_IMAGE =
  process.env.E2E_ACTIVITY_IMAGE ||
  resolve('src/assets/images/classic-banana-pudding.webp');
const HOST_RESOLVER = process.env.E2E_HOST_RESOLVER || '';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

function findChrome() {
  const executablePath = CHROME_CANDIDATES.find((candidate) =>
    existsSync(candidate)
  );
  if (!executablePath) {
    throw new Error(
      'Chrome tidak ditemukan. Set CHROME_PATH ke executable Chrome/Chromium.'
    );
  }
  return executablePath;
}

function assertNoErrors(errors) {
  assert.equal(
    errors.length,
    0,
    `Console error terdeteksi:\n${errors.join('\n')}`
  );
}

const browserArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
if (HOST_RESOLVER) {
  browserArgs.push(`--host-resolver-rules=${HOST_RESOLVER}`);
}

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
  args: browserArgs,
});

const errors = [];
const results = [];

async function step(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (error) {
    results.push({ name, ok: false, detail: error.message });
    console.error(`FAIL  ${name} — ${error.message}`);
    throw error;
  }
}

async function newPage() {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);
  page.setUserAgent(
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
  );
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));
  return page;
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/signin`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.auth-title');
  await page.type('.auth-field input[type="email"]', email);
  await page.type('.auth-field input[type="password"]', password);
  await page.click('.auth-button');
  await page.waitForFunction(() => location.pathname === '/balance', {
    timeout: 45_000,
  });
  await page.waitForSelector('.balance-big');
}

try {
  const memberPage = await newPage();

  await step('landing mobile render', async () => {
    const response = await memberPage.goto(`${BASE_URL}/`, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(response.status(), 200);
    await memberPage.waitForSelector('.hero-title');
    await memberPage.waitForSelector('.catalog-name');
    const info = await memberPage.evaluate(() => ({
      title: document.title,
      hero: document.querySelector('.hero-title')?.textContent?.trim(),
      cards: document.querySelectorAll('.catalog-card:not(.catalog-skeleton-card)')
        .length,
      skipLink: Boolean(document.querySelector('.skip-link')),
      main: Boolean(document.querySelector('#main-content')),
    }));
    assert.match(info.title, /Bakerman Balance/);
    assert.ok(info.hero.length > 10);
    assert.ok(info.cards >= 3);
    assert.equal(info.skipLink, true);
    assert.equal(info.main, true);
    return `${info.cards} kartu menu`;
  });

  await step('menu katalog', async () => {
    await memberPage.goto(`${BASE_URL}/menu`, { waitUntil: 'domcontentloaded' });
    await memberPage.waitForSelector('.catalog-name');
    await memberPage.waitForFunction(
      () =>
        document.querySelectorAll('.catalog-card:not(.catalog-skeleton-card)')
          .length >= 10
    );
    const count = await memberPage.evaluate(
      () =>
        document.querySelectorAll('.catalog-card:not(.catalog-skeleton-card)')
          .length
    );
    assert.ok(count >= 10, `hanya ${count} produk`);
    return `${count} produk`;
  });

  await step('login member + budget', async () => {
    await login(memberPage, MEMBER_EMAIL, MEMBER_PASSWORD);
    const info = await memberPage.evaluate(() => ({
      budget: document.querySelector('.balance-big')?.textContent?.trim(),
      strava: Boolean(document.querySelector('.balance-strava')),
    }));
    assert.match(info.budget, /\d+\s*g/);
    assert.equal(info.strava, true);
    return `budget ${info.budget}`;
  });

  await step('recap mingguan', async () => {
    await memberPage.waitForSelector('.recap-chart');
    await memberPage.waitForSelector('.recap-week');
    const info = await memberPage.evaluate(() => ({
      bars: document.querySelectorAll('.recap-bar-item').length,
      weeks: document.querySelectorAll('.recap-week').length,
      summary: document.querySelector('.recap-summary')?.textContent?.replace(/\s+/g, ' ').trim(),
    }));
    assert.equal(info.bars, 4);
    assert.equal(info.weeks, 4);
    assert.match(info.summary, /Order/);
    return info.summary;
  });

  await step('aktivitas manual + screenshot', async () => {
    await memberPage.waitForSelector('.manual-activity-section');
    await memberPage.waitForSelector('.manual-activity-form', {
      timeout: 45_000,
    });
    const configured = await memberPage.evaluate(() => {
      const button = document.querySelector('.manual-submit');
      return Boolean(button && !button.disabled);
    });

    if (!configured) {
      return 'Cloudinary belum dikonfigurasi — dilewati';
    }

    const before = await memberPage.evaluate(() => ({
      budget: document.querySelector('.balance-big')?.textContent?.trim(),
      items: document.querySelectorAll('.manual-item').length,
    }));

    const fileInput = await memberPage.$('.manual-file input[type="file"]');
    await fileInput.uploadFile(ACTIVITY_IMAGE);
    await memberPage.waitForSelector('.manual-preview');
    const note = `QA E2E ${Date.now()}`;
    await memberPage.type('.manual-note textarea', note);
    await memberPage.click('.manual-submit');
    await memberPage.waitForFunction(
      () =>
        document
          .querySelector('.manual-success')
          ?.textContent?.includes('dicatat'),
      { timeout: 60_000 }
    );
    await memberPage.waitForFunction(
      (count) => document.querySelectorAll('.manual-item').length === count + 1,
      { timeout: 60_000 },
      before.items
    );

    const after = await memberPage.evaluate((activityNote) => {
      const item = [...document.querySelectorAll('.manual-item')].find((element) =>
        element.textContent.includes(activityNote)
      );

      return {
        budget: document.querySelector('.balance-big')?.textContent?.trim(),
        item: item?.textContent?.replace(/\s+/g, ' ').trim(),
      };
    }, note);

    assert.match(after.item, /45 menit/);

    await memberPage.evaluate((activityNote) => {
      const item = [...document.querySelectorAll('.manual-item')].find((element) =>
        element.textContent.includes(activityNote)
      );
      item?.querySelector('.manual-delete')?.click();
    }, note);
    await memberPage.waitForFunction(
      (activityNote) =>
        ![...document.querySelectorAll('.manual-item')].some((element) =>
          element.textContent.includes(activityNote)
        ),
      { timeout: 60_000 },
      note
    );

    if (after.budget !== before.budget) {
      await memberPage.waitForFunction(
        (budget) =>
          document.querySelector('.balance-big')?.textContent?.trim() === budget,
        { timeout: 60_000 },
        before.budget
      );
    }

    return `${before.budget} → ${after.budget} → ${before.budget}`;
  });

  await step('filter riwayat pesanan', async () => {
    await memberPage.goto(`${BASE_URL}/orders`, { waitUntil: 'domcontentloaded' });
    await memberPage.waitForSelector('.orders-filter');
    const filters = await memberPage.evaluate(
      () => document.querySelectorAll('.orders-filter').length
    );
    assert.equal(filters, 4);

    await memberPage.evaluate(() => {
      const button = [...document.querySelectorAll('.orders-filter')].find(
        (item) => item.textContent.trim() === 'Selesai'
      );
      button?.click();
    });
    await memberPage.waitForFunction(
      () =>
        document.querySelector('.orders-filter.is-active')?.textContent?.trim() ===
        'Selesai'
    );
    await memberPage.waitForSelector('.orders-count');
    await memberPage.waitForFunction(
      () =>
        document.querySelector('.orders-toolbar')?.getAttribute('aria-busy') ===
        'false'
    );
    const info = await memberPage.evaluate(() => ({
      count: document.querySelector('.orders-count')?.textContent?.trim(),
      active: document.querySelector('.orders-filter.is-active')?.textContent?.trim(),
      hasCards: document.querySelectorAll('.order-card').length > 0,
    }));
    assert.equal(info.active, 'Selesai');
    assert.match(info.count, /order/);
    return `${info.count}, kartu=${info.hasCards}`;
  });

  await step('pagination riwayat', async () => {
    await memberPage.evaluate(() => {
      const button = [...document.querySelectorAll('.orders-filter')].find(
        (item) => item.textContent.trim() === 'Semua'
      );
      button?.click();
    });
    await memberPage.waitForFunction(
      () =>
        document.querySelector('.orders-filter.is-active')?.textContent?.trim() ===
        'Semua'
    );
    await memberPage.waitForSelector('.orders-count');
    await memberPage.waitForFunction(
      () =>
        document.querySelector('.orders-toolbar')?.getAttribute('aria-busy') ===
        'false'
    );

    const hasPagination = await memberPage.$('.orders-pagination');
    if (!hasPagination) return 'tidak diperlukan (<= 8 order)';

    await memberPage.waitForFunction(() =>
      document
        .querySelector('.orders-pagination')
        ?.textContent?.includes('Halaman 1 dari 2')
    );
    await memberPage.evaluate(() => {
      const buttons = [...document.querySelectorAll('.orders-page-button')];
      buttons.find((item) => item.textContent.includes('Berikutnya'))?.click();
    });
    await memberPage.waitForFunction(() =>
      document
        .querySelector('.orders-pagination')
        ?.textContent?.includes('Halaman 2 dari 2')
    );
    const info = await memberPage.evaluate(() => ({
      text: document
        .querySelector('.orders-pagination')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim(),
      cards: document.querySelectorAll('.order-card').length,
    }));
    assert.match(info.text, /Halaman 2 dari 2/);
    return `${info.text}, kartu=${info.cards}`;
  });

  await step('alur checkout tanpa membuat order', async () => {
    await memberPage.evaluate(() => localStorage.removeItem('bakerman_cart_v1'));
    await memberPage.goto(`${BASE_URL}/product/roti-susu-pandan`, {
      waitUntil: 'domcontentloaded',
    });
    await memberPage.waitForSelector('.product-detail-add');
    await memberPage.click('.product-detail-add');
    await memberPage.goto(`${BASE_URL}/cart`, { waitUntil: 'domcontentloaded' });
    await memberPage.waitForSelector('.cart-item');
    await memberPage.waitForSelector('a.cart-checkout[href="/checkout"]');
    await memberPage.click('a.cart-checkout');
    await memberPage.waitForFunction(() => location.pathname === '/checkout');
    await memberPage.waitForSelector('.checkout-place');
    await memberPage.waitForFunction(
      () => document.querySelectorAll('.checkout-slot:not(:disabled)').length > 0
    );
    const info = await memberPage.evaluate(() => ({
      slots: document.querySelectorAll('.checkout-slot').length,
      summary: document.querySelector('.checkout-summary')?.textContent?.replace(/\s+/g, ' ').trim(),
    }));
    assert.ok(info.slots > 0);
    assert.match(info.summary, /Total gula/);
    await memberPage.evaluate(() => localStorage.removeItem('bakerman_cart_v1'));
    return `${info.slots} slot tersedia`;
  });

  await step('staff dashboard admin', async () => {
    const staffPage = await newPage();
    await login(staffPage, ADMIN_EMAIL, ADMIN_PASSWORD);
    await staffPage.goto(`${BASE_URL}/staff`, { waitUntil: 'domcontentloaded' });
    await staffPage.waitForSelector('.staff-header');
    await staffPage.waitForSelector('.staff-table tbody tr');
    await staffPage.waitForFunction(
      () => document.querySelectorAll('.staff-table tbody tr').length >= 10
    );
    const info = await staffPage.evaluate(() => ({
      stockRows: document.querySelectorAll('.staff-table tbody tr').length,
      hasOrders: Boolean(document.querySelector('.staff-order')),
      alerts: document.querySelectorAll('[role="alert"]').length,
    }));
    assert.ok(info.stockRows >= 10);
    return `${info.stockRows} baris stok, order=${info.hasOrders}`;
  });

  assertNoErrors(errors);

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl: BASE_URL,
        steps: results.length,
        consoleErrors: errors.length,
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        baseUrl: BASE_URL,
        error: error.message,
        consoleErrors: errors,
      },
      null,
      2
    )
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
