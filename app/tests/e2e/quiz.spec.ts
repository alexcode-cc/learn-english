import { test, expect } from '@playwright/test'

test.describe('Quiz E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to review/quiz page
    await page.goto('/review')
    // Wait for Vue app to be ready
    await page.waitForLoadState('domcontentloaded')
  })

  test('should complete a multiple-choice quiz', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // TODO: After implementation, verify quiz can be started
    // Click "開始測驗" button
    // const startButton = page.getByRole('button', { name: /開始測驗|Start Quiz/i })
    // await startButton.waitFor({ state: 'visible', timeout: 5000 })
    // await startButton.click()

    // Wait for quiz questions to appear
    // await page.waitForSelector('[data-testid="quiz-question"]', { timeout: 5000 })

    // Select an answer
    // const firstOption = page.locator('[data-testid="quiz-option"]').first()
    // await firstOption.click()

    // Submit answer or move to next question
    // const nextButton = page.getByRole('button', { name: /下一題|Next/i })
    // await nextButton.click()

    // Complete quiz and verify results
    // await page.waitForSelector('[data-testid="quiz-result"]', { timeout: 5000 })
    // const score = await page.locator('[data-testid="quiz-score"]').textContent()
    // expect(score).toBeDefined()
  })

  test('should complete a fill-in quiz', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // TODO: After implementation
    // Select fill-in mode
    // Start quiz
    // Fill in answer
    // Submit and verify result
  })

  test('should complete a spelling quiz', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // TODO: After implementation
    // Select spelling mode
    // Start quiz
    // Type spelling
    // Submit and verify result
  })

  test('should display quiz results with score', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // TODO: After implementation
    // Complete a quiz
    // Verify result page shows:
    // - Score percentage
    // - Number of correct/incorrect answers
    // - Review incorrect answers option
  })

  test('should track quiz completion in learning session', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // TODO: After implementation
    // Complete a quiz
    // Verify learning session is created/updated
    // Verify session includes quiz completion action
  })

  test('should allow retaking quiz', async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // TODO: After implementation
    // Complete a quiz
    // Click "再測一次" or similar button
    // Verify new quiz is generated
  })
})

