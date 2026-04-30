/**
 * Teacher dashboard, student list, question bank.
 */
import { test, expect } from '@playwright/test';
import { loginAsTeacher } from './fixtures/auth';

test.describe('Teacher dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test('shows class overview heading', async ({ page }) => {
    await expect(page.getByText(/class overview/i)).toBeVisible();
  });

  test('shows stat cards', async ({ page }) => {
    await expect(page.getByText(/total students/i)).toBeVisible();
    await expect(page.getByText(/active today/i)).toBeVisible();
    await expect(page.getByText(/avg score/i)).toBeVisible();
    await expect(page.getByText(/at risk/i)).toBeVisible();
  });

  test('sidebar has students and question bank links', async ({ page }) => {
    const nav = page.locator('aside nav');
    await expect(nav.getByRole('link', { name: 'Students', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Question Bank', exact: true })).toBeVisible();
  });
});

test.describe('Teacher students page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/teacher/students');
  });

  test('renders students heading with search', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /students/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search by name/i)).toBeVisible();
  });
});

test.describe('Question bank', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/teacher/questions');
  });

  test('renders question bank with filters', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /question bank/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add question/i })).toBeVisible();
  });

  test('opens add question form', async ({ page }) => {
    await page.getByRole('button', { name: /add question/i }).click();
    await expect(page.getByRole('heading', { name: /new question/i })).toBeVisible();
    await expect(page.getByPlaceholder(/question text/i)).toBeVisible();
  });

  test('shows validation error when submitting empty question', async ({ page }) => {
    await page.getByRole('button', { name: /add question/i }).click();
    await page.getByRole('button', { name: /submit question/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });
});
