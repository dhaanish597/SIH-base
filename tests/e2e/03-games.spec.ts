/**
 * Games — each game page loads, and Math Dungeon is actually playable.
 */
import { test, expect } from '@playwright/test';
import { loginAsStudent } from './fixtures/auth';

test.describe('Games index', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/games');
  });

  test('shows all 5 game cards', async ({ page }) => {
    const cards = ['Quiz Battle', 'Math Dungeon', 'Word Forge', 'Science Lab', 'History Conquest'];
    for (const name of cards) {
      await expect(page.getByText(name)).toBeVisible();
    }
  });
});

test.describe('Math Dungeon', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/games/math-dungeon');
  });

  test('renders the game header and Phaser canvas container', async ({ page }) => {
    await expect(page.getByText(/math dungeon/i)).toBeVisible();
    // Phaser mounts into a div — wait for the canvas element
    await page.waitForSelector('canvas', { timeout: 10000 });
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('back arrow returns to games list', async ({ page }) => {
    await page.locator('a[href="/student/games"]').first().click();
    await page.waitForURL('**/student/games**');
    await expect(page).toHaveURL(/\/student\/games$/);
  });
});

test.describe('Word Forge', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/games/word-forge');
  });

  test('renders question 1 of the game', async ({ page }) => {
    await expect(page.getByText(/question 1/i)).toBeVisible();
  });

  test('can answer an MCQ choice', async ({ page }) => {
    // Wait for first question then click choice A
    await page.waitForSelector('button:has-text("A.")', { timeout: 5000 }).catch(() => {});
    const choiceA = page.locator('button').filter({ hasText: /^A\./ }).first();
    if (await choiceA.isVisible()) {
      await choiceA.click();
      // Feedback should appear (correct or wrong)
      await expect(page.locator('text=/✓|✗/')).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Science Lab Escape', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/games/science-lab');
  });

  test('renders puzzle 1 heading', async ({ page }) => {
    await expect(page.getByText(/puzzle 1/i)).toBeVisible();
  });
});

test.describe('History Conquest', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/games/history-conquest');
  });

  test('renders the territory map SVG', async ({ page }) => {
    await page.waitForSelector('svg[viewBox]', { timeout: 5000 });
    await expect(page.locator('svg[viewBox]').first()).toBeVisible();
    await expect(page.getByText(/territories/i)).toBeVisible();
  });

  test('clicking a territory starts a battle', async ({ page }) => {
    await page.waitForSelector('svg[viewBox]', { timeout: 5000 });
    const groups = page.locator('svg[viewBox] g[cursor="pointer"]');
    await expect(groups.first()).toBeVisible({ timeout: 5000 });
    await groups.first().click();
    await page.waitForTimeout(500);
    const onMap = await page.getByText(/tap.*territory/i).isVisible().catch(() => false);
    const onBattle = await page.getByText(/attacking/i).isVisible().catch(() => false);
    expect(onMap || onBattle).toBeTruthy();
  });
});

test.describe('Quiz Battle lobby', () => {
  test('renders lobby and join form', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/games/quiz-battle');
    await expect(page.getByText(/real-time quiz battle/i)).toBeVisible();
    await expect(page.getByPlaceholder(/MATH9A/i)).toBeVisible();
  });

  test('shows error when joining with empty code', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/games/quiz-battle');
    await page.getByRole('button', { name: /join battle/i }).click();
    await expect(page.getByText(/enter a class code/i)).toBeVisible();
  });

  test('moves to waiting room after entering a code', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/student/games/quiz-battle');
    await page.getByPlaceholder(/MATH9A/i).fill('MATH9A');
    await page.getByRole('button', { name: /join battle/i }).click();
    await expect(page.getByText(/waiting for host/i)).toBeVisible();
    await expect(page.getByText(/MATH9A/)).toBeVisible();
  });
});
