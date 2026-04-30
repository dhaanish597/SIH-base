/**
 * Shared login helpers — call these at the top of each test that needs auth.
 * Each helper logs in, lands on the correct dashboard, and returns.
 */
import { Page } from '@playwright/test';

export async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /student/i }).click();
  await page.getByPlaceholder(/student id/i).fill('STU001');
  await page.getByPlaceholder(/pin/i).fill('1234');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/student**');
}

export async function loginAsTeacher(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /teacher/i }).click();
  await page.getByPlaceholder(/email/i).fill('teacher@demo.school');
  await page.getByPlaceholder(/password/i).fill('teacher123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/teacher**');
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: /admin/i }).click();
  await page.getByPlaceholder(/email/i).fill('admin@demo.school');
  await page.getByPlaceholder(/password/i).fill('admin123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/admin**');
}
