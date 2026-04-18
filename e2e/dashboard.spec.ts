// e2e/dashboard.spec.ts
import { test, expect } from './fixtures'

test.describe('Dashboard (authenticated)', () => {
  test('shows three-column layout with clock', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Morning Standup')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Buy groceries')).toBeVisible()
    await expect(page.locator('text=/^\\d{2}:\\d{2}$/').first()).toBeVisible()
  })

  test('shows calendar events', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Morning Standup')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Team Lunch')).toBeVisible()
  })

  test('shows tasks including completed', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Buy groceries')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Read book')).toBeVisible()
  })

  test('shows weather temperature', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('18°')).toBeVisible({ timeout: 8000 })
  })

  test('shows sunrise and sunset', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/06:15/)).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/20:30/)).toBeVisible()
  })

  test('shows location name', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/Milan/)).toBeVisible({ timeout: 8000 })
  })

  test('gear icon is visible and touch-friendly', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Morning Standup')).toBeVisible({ timeout: 8000 })
    const gear = page.getByLabel('Preferences')
    await expect(gear).toBeVisible()
    const box = await gear.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(40)
    expect(box!.height).toBeGreaterThanOrEqual(40)
  })

  test('gear icon opens preferences screen', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Morning Standup')).toBeVisible({ timeout: 8000 })
    await page.getByLabel('Preferences').click()
    await expect(page.getByText('Preferences')).toBeVisible()
    await expect(page.getByText('My Calendar')).toBeVisible()
  })

  test('back button returns to dashboard from preferences', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Morning Standup')).toBeVisible({ timeout: 8000 })
    await page.getByLabel('Preferences').click()
    await expect(page.getByText('Preferences')).toBeVisible()
    await page.getByText('←').click()
    await expect(page.getByText('Morning Standup')).toBeVisible()
  })

  test('clicking event card opens modal', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Team Lunch')).toBeVisible({ timeout: 8000 })
    await page.getByText('Team Lunch').first().click()
    await expect(page.getByText('Canteen')).toBeVisible()
    await expect(page.getByText(/Bring your own lunch/)).toBeVisible()
  })

  test('close button dismisses event modal', async ({ authenticatedPage: page }) => {
    await page.getByText('Team Lunch').first().click()
    await expect(page.getByLabel('Close')).toBeVisible()
    await page.getByLabel('Close').click()
    await expect(page.getByText('Canteen')).not.toBeVisible()
  })

  test('clicking backdrop dismisses event modal', async ({ authenticatedPage: page }) => {
    await page.getByText('Team Lunch').first().click()
    await expect(page.getByText('Canteen')).toBeVisible()
    await page.mouse.click(10, 10)
    await expect(page.getByText('Canteen')).not.toBeVisible()
  })
})
