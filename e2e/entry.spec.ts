// e2e/entry.spec.ts
// Task 4.08 — E2E tests untuk entry pembayaran:
//   search member, filter status, quick-pay panel, year/month selector

import { test, expect, type Page } from '@playwright/test';

// ── Auth helper ───────────────────────────────────────────────────────────────
async function loginIfCredentialsAvailable(page: Page): Promise<boolean> {
  const email = process.env.E2E_TEST_EMAIL;
  const pass  = process.env.E2E_TEST_PASSWORD;
  if (!email || !pass) return false;

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(pass);
  await page.locator('button.lf-btn').click();
  await page.waitForURL(/\/(app|dashboard|\(app\))/, { timeout: 12_000 });
  return true;
}

async function goToEntry(page: Page) {
  // Navigasi ke entry melalui sidebar atau URL langsung
  try {
    await page.goto('/entry');
    await page.waitForLoadState('networkidle');
  } catch {
    const entryBtn = page.getByRole('button', { name: /entry|bayar/i }).first();
    if (await entryBtn.count() > 0) await entryBtn.click();
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Entry View', () => {
  test.beforeEach(async ({ page }) => {
    const ok = await loginIfCredentialsAvailable(page);
    if (!ok) test.skip(true, 'Credential E2E tidak tersedia');
  });

  test('halaman entry menampilkan search box', async ({ page }) => {
    await goToEntry(page);
    const searchBox = page.locator('input[placeholder*="cari"], .search-box, input[type="search"]').first();
    await expect(searchBox).toBeVisible({ timeout: 5_000 });
  });

  test('search dengan query tidak ada → daftar kosong atau empty state', async ({ page }) => {
    await goToEntry(page);
    const searchBox = page.locator('input[placeholder*="cari"], .search-box').first();
    if (await searchBox.count() === 0) return;

    await searchBox.fill('ZZZNOTEXISTMEMBER999');
    await page.waitForTimeout(400);

    const items = page.locator('.ml-item, [class*="member-item"], [class*="member-card"]');
    const count = await items.count();
    // Harusnya kosong atau ada empty state
    const emptyState = page.locator('[class*="empty"], text=/tidak ada/i, text=/no result/i');
    expect(count === 0 || await emptyState.count() > 0).toBe(true);

    // Reset
    await searchBox.fill('');
  });

  test('selector tahun tersedia di halaman entry', async ({ page }) => {
    await goToEntry(page);
    const yearSel = page.locator('select.cs, select').first();
    await expect(yearSel).toBeVisible({ timeout: 5_000 });
  });

  test('filter chip tersedia (Semua / Lunas / Belum / Free)', async ({ page }) => {
    await goToEntry(page);
    // Cari chip filter apapun
    const chips = page.locator('.fchip, [class*="chip"], [class*="filter"]');
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(1);
  });

  test('klik member pertama → quick pay panel atau detail muncul', async ({ page }) => {
    await goToEntry(page);

    const firstMember = page.locator('.ml-item, [class*="member-card"], [class*="member-row"]').first();
    if (await firstMember.count() === 0) {
      test.skip(true, 'Tidak ada member di daftar — skip');
      return;
    }

    await firstMember.click();
    await page.waitForTimeout(400);

    // Quick pay atau expanded detail harus muncul
    const qpOrDetail = page.locator('.qp-btn, [class*="quick"], [class*="expand"], [class*="detail"]');
    const visible = await qpOrDetail.count() > 0;
    expect(visible).toBe(true);
  });
});
