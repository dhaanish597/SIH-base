7 test('sidebar has all student nav links', async ({ page }) => {
    -    const nav = page.locator('aside nav');
    +    const nav = page.getByRole('navigation');
