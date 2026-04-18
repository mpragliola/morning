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
    // Target the large current-temp element (48px) not the hourly strip temps
    await expect(page.locator('text=18°').first()).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Clear')).toBeVisible()
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
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()
    await expect(page.getByText('My Calendar')).toBeVisible()
  })

  test('back button returns to dashboard from preferences', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Morning Standup')).toBeVisible({ timeout: 8000 })
    await page.getByLabel('Preferences').click()
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()
    await page.getByText('←').click()
    await expect(page.getByText('Morning Standup')).toBeVisible()
  })

  test('clicking event card opens modal with full details', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Team Lunch')).toBeVisible({ timeout: 8000 })
    // Click the card title specifically (not the card preview text)
    await page.getByText('Team Lunch').click()
    // Modal should show the full description (not just first line)
    await expect(page.getByText(/See you there/)).toBeVisible()
    // Modal shows the close button
    await expect(page.getByLabel('Close')).toBeVisible()
  })

  test('close button dismisses event modal', async ({ authenticatedPage: page }) => {
    await page.getByText('Team Lunch').click()
    await expect(page.getByLabel('Close')).toBeVisible()
    await page.getByLabel('Close').click()
    await expect(page.getByLabel('Close')).not.toBeVisible()
  })

  test('clicking backdrop dismisses event modal', async ({ authenticatedPage: page }) => {
    await page.getByText('Team Lunch').click()
    await expect(page.getByLabel('Close')).toBeVisible()
    await page.mouse.click(10, 10)
    await expect(page.getByLabel('Close')).not.toBeVisible()
  })

  test('shows tomorrow preview with label and events', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Morning Standup')).toBeVisible({ timeout: 8000 })
    await expect(page.getByTestId('tomorrow-label')).toBeVisible()
    await expect(page.getByText('Saturday Gym')).toBeVisible()
  })
})
