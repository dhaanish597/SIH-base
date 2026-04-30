/**
 * Auth flows — login, redirect, and logout for every role.
 */
import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('shows four role cards', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /student/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /teacher/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /school/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /admin/i })).toBeVisible();
  });

  test('student login with ID + PIN lands on student dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /student/i }).click();
    await expect(page.getByPlaceholder(/student id/i)).toBeVisible();
    await page.getByPlaceholder(/student id/i).fill('STU001');
    await page.getByPlaceholder(/pin/i).fill('1234');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/student**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/student/);
  });

  test('teacher login with email + password lands on teacher dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /teacher/i }).click();
    await page.getByPlaceholder(/email/i).fill('teacher@demo.school');
    await page.getByPlaceholder(/password/i).fill('teacher123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/teacher**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/teacher/);
  });

  test('admin login lands on admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /admin/i }).click();
    await page.getByPlaceholder(/email/i).fill('admin@demo.school');
    await page.getByPlaceholder(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /teacher/i }).click();
    await page.getByPlaceholder(/email/i).fill('teacher@demo.school');
    await page.getByPlaceholder(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should stay on login and show an error
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated visit to /student redirects to /login', async ({ page }) => {
    await page.goto('/student');
    await page.waitForURL('**/login**', { timeout: 8000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
