const { test, expect } = require('@playwright/test');

test.describe('ZENHOME static site', () => {
  test('main page has no browser errors and core sections render', async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('http://127.0.0.1:8080/');
    await expect(page.locator('h1')).toContainText('Architektura bez zbytečností');
    await expect(page.locator('.preview-grid img')).toHaveCount(16);
    await expect(page.locator('[data-review-slide]')).toHaveCount(6);
    await expect(page.locator('[data-concepts-grid] img')).toHaveCount(10);
    expect(errors).toEqual([]);
  });

  test('mobile menu opens and closes by backdrop and Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:8080/');
    const button = page.locator('[data-menu-toggle]');
    const menu = page.locator('[data-menu]');

    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toHaveClass(/open/);
    await page.locator('[data-menu-backdrop]').click({ position: { x: 5, y: 400 } });
    await expect(button).toHaveAttribute('aria-expanded', 'false');

    await button.click();
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('reviews can be changed and paused', async ({ page }) => {
    await page.goto('http://127.0.0.1:8080/');
    await page.locator('[data-reviews-slider]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-review-slide].active')).toContainText('Kamil');
    await page.locator('[data-review-next]').click();
    await expect(page.locator('[data-review-slide].active')).toContainText('Jiří');
    await page.locator('[data-review-pause]').click();
    await expect(page.locator('[data-review-pause]')).toHaveAttribute('aria-label', 'Spustit automatické přehrávání');
  });

  test('gallery category and lightbox work', async ({ page }) => {
    await page.goto('http://127.0.0.1:8080/galerie.html#zenhome-u-rican');
    await expect(page.locator('[data-gallery-count]')).toContainText('26 fotografií');
    await expect(page.locator('.gallery-item')).toHaveCount(26);
    await page.locator('.gallery-item').first().click();
    await expect(page.locator('[data-lightbox]')).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-lightbox]')).not.toHaveClass(/open/);
  });
});
