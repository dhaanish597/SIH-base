/**
 * Admin dashboard, schools list, users list, moderation queue.
 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './fixtures/auth';

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shows platform dashboard heading', async ({ page }) => {
    await expect(page.getByText(/platform dashboard/i)).toBeVisible();
  });

  test('shows stat cards', async ({ page }) => {
    // Stat cards render after analytics API responds — give it time
    await expect(page.getByText(/schools/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/students/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/teachers/i)).toBeVisible({ timeout: 10000 });
  });

  test('has links to schools, users, moderation in sidebar', async ({ page }) => {
    // Sidebar nav links are always visible regardless of data loading
    const nav = page.locator('aside nav');
    await expect(nav.getByRole('link', { name: 'Schools', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Users', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Moderation', exact: true })).toBeVisible();
  });
});

test.describe('Admin schools page', () => {
  test('shows schools table with Demo School', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/schools');
    await expect(page.getByRole('heading', { name: /schools/i })).toBeVisible();
    // Wait for data to load (API call needed)
    await expect(page.getByText(/Demo School/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/DEMO/)).toBeVisible();
  });
});

test.describe('Admin users page', () => {
  test('lists users and supports role filter', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    await expect(page.getByText(/Admin User/i)).toBeVisible({ timeout: 10000 });
    // Filter to STUDENT
    await page.locator('select').filter({ hasText: /all roles/i }).selectOption('STUDENT');
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Demo Student/i)).toBeVisible();
  });
});

test.describe('Moderation queue', () => {
  test('shows empty state or pending questions', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/moderation');
    await expect(page.getByText(/moderation queue/i)).toBeVisible();
    await page.waitForTimeout(3000);
    const empty = await page.getByText(/all clear/i).isVisible().catch(() => false);
    const hasQ = await page.getByRole('button', { name: /approve/i }).isVisible().catch(() => false);
    expect(empty || hasQ).toBeTruthy();
  });
});
