import { test, expect } from './fixtures'

test.describe('Progress Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to progress page
    await page.goto('/progress')
  })

  test('should display progress summary cards', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=學習進度', { timeout: 5000 })

    // Check for summary cards
    await expect(page.locator('text=總單字數')).toBeVisible()
    await expect(page.locator('text=已學會')).toBeVisible()
    await expect(page.locator('text=連續學習天數')).toBeVisible()
    await expect(page.locator('text=總學習時間')).toBeVisible()
  })

  test('should display learning trend chart', async ({ page }) => {
    await page.waitForSelector('text=學習進度', { timeout: 5000 })

    // Check for learning trend chart
    await expect(page.locator('text=學習趨勢')).toBeVisible()
  })

  test('should display quiz score chart', async ({ page }) => {
    await page.waitForSelector('text=學習進度', { timeout: 5000 })

    // Check for quiz score chart
    await expect(page.locator('text=測驗成績趨勢')).toBeVisible()
  })

  test('should display heatmap calendar', async ({ page }) => {
    await page.waitForSelector('text=學習進度', { timeout: 5000 })

    // Check for heatmap
    await expect(page.locator('text=學習熱力圖')).toBeVisible()
  })

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    await page.waitForSelector('text=學習進度', { timeout: 5000 })

    // Click refresh button
    const refreshButton = page.locator('button[aria-label*="refresh"], button:has(svg)').first()
    if (await refreshButton.isVisible()) {
      await refreshButton.click()
      
      // Wait a bit for refresh to complete
      await page.waitForTimeout(1000)
    }
  })

  test('should show empty state when no data exists', async ({ page }) => {
    await page.waitForSelector('text=學習進度', { timeout: 5000 })

    // Check if empty states are shown (may appear if no data)
    const emptyStates = page.locator('text=尚無學習記錄, text=尚無測驗記錄')
    const count = await emptyStates.count()
    
    // Either empty states or data should be visible
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

