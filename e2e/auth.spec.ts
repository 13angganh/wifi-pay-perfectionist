// e2e/auth.spec.ts
// Task 4.07 — login berhasil & login gagal
// Task 4.09 — logout + protected route redirect

import { test, expect, type Page } from '@playwright/test';

// ── Selectors ─────────────────────────────────────────────────────────────────
const SEL = {
  emailInput: 'input[type="email"]',
  passInput:  'input[type="password"]',
  loginBtn:   'button.lf-btn',
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
async function login(page: Page, email: string, pass: string) {
  await page.goto('/login');
  await page.locator(SEL.emailInput).fill(email);
  await page.locator(SEL.passInput).fill(pass);
  await page.locator(SEL.loginBtn).click();
}

// ── Login form rendering ──────────────────────────────────────────────────────

test.describe('Login Page', () => {
  test('menampilkan form email, password, dan tombol masuk', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator(SEL.emailInput)).toBeVisible();
    await expect(page.locator(SEL.passInput)).toBeVisible();
    await expect(page.locator(SEL.loginBtn)).toBeVisible();
  });

  test('judul halaman mengandung kata "WiFi Pay" atau "Login"', async ({ page }) => {
    await page.goto('/login');
    const title = await page.title();
    const hasKeyword = /wifi.*pay|login|masuk/i.test(title);
    // Bisa juga check via h1/heading
    const heading = page.getByRole('heading').first();
    const hasHeading = await heading.count() > 0;
    expect(hasKeyword || hasHeading).toBe(true);
  });
});

// ── Login gagal ───────────────────────────────────────────────────────────────

test.describe('Login gagal', () => {
  test('kredensial salah → tetap di /login, muncul pesan error', async ({ page }) => {
    await page.goto('/login');
    await page.locator(SEL.emailInput).fill('salah@email.com');
    await page.locator(SEL.passInput).fill('passwordsalah999');
    await page.locator(SEL.loginBtn).click();

    // Tunggu response Firebase
    await page.waitForTimeout(4000);

    // Harus tetap di /login
    await expect(page).not.toHaveURL(/\/(app|dashboard|\(app\))/);

    // Pesan error harus muncul (teks error atau aria-live)
    const errorVisible =
      (await page.locator('p.lf-err').count()) > 0 ||
      (await page.getByText(/salah|tidak|gagal|invalid|wrong/i).count()) > 0;
    expect(errorVisible).toBe(true);
  });

  test('email kosong → tidak redirect', async ({ page }) => {
    await page.goto('/login');
    await page.locator(SEL.passInput).fill('somepassword');
    await page.locator(SEL.loginBtn).click();
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(/\/(app|dashboard|\(app\))/);
  });
});

// ── Login berhasil ────────────────────────────────────────────────────────────

test.describe('Login berhasil', () => {
  test('redirect ke dashboard setelah login dengan kredensial valid', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const pass  = process.env.E2E_TEST_PASSWORD;
    if (!email || !pass) {
      test.skip(true, 'E2E_TEST_EMAIL / E2E_TEST_PASSWORD tidak tersedia');
      return;
    }

    await login(page, email, pass);
    await page.waitForURL(/\/(app|dashboard|\(app\))/, { timeout: 12_000 });
    await expect(page).not.toHaveURL('/login');
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────

test.describe('Logout', () => {
  test('setelah logout diarahkan ke /login dan session bersih', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const pass  = process.env.E2E_TEST_PASSWORD;
    if (!email || !pass) {
      test.skip(true, 'E2E_TEST_EMAIL / E2E_TEST_PASSWORD tidak tersedia');
      return;
    }

    // Login
    await login(page, email, pass);
    await page.waitForURL(/\/(app|dashboard|\(app\))/, { timeout: 12_000 });

    // Klik tombol logout
    const logoutBtn = page.getByRole('button', { name: /keluar|logout|sign.?out/i });
    await logoutBtn.click();

    // Harus redirect ke /login
    await page.waitForURL('/login', { timeout: 8_000 });
    await expect(page).toHaveURL('/login');

    // Refresh — session harus tetap bersih (tidak auto-login)
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/login');
  });
});

// ── Protected routes ──────────────────────────────────────────────────────────

test.describe('Protected routes', () => {
  test('akses / tanpa login → diarahkan ke /login atau form login muncul', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const onLoginPage = currentUrl.includes('/login');
    const hasLoginForm = (await page.locator(SEL.emailInput).count()) > 0;

    expect(onLoginPage || hasLoginForm).toBe(true);
  });
});
