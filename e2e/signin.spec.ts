// e2e/signin.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Sign-in screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('CAPPreferences')
    })
    await page.goto('/')
  })

  test('shows Morning Dashboard title', async ({ page }) => {
    await expect(page.getByText('Morning Dashboard')).toBeVisible()
  })

  test('shows Sign in with Google button', async ({ page }) => {
    await expect(page.getByText('Sign in with Google')).toBeVisible()
  })

  test('sign-in button is touch-friendly (min 44px)', async ({ page }) => {
    const button = page.getByText('Sign in with Google')
    const box = await button.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)
  })

  test('does not show dashboard panels before auth', async ({ page }) => {
    await expect(page.getByText('Morning Standup')).not.toBeVisible()
    await expect(page.getByText('Buy groceries')).not.toBeVisible()
  })
})
