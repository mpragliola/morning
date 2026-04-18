/**
 * Standalone script to capture a dashboard screenshot with fake data.
 * Run: npx ts-node --esm e2e/screenshot.ts
 * Or:  node --loader ts-node/esm e2e/screenshot.ts
 *
 * Saves to: docs/screenshot.png
 */
import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(__dirname, '../docs/screenshot.png')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

// Inject fake auth
await page.addInitScript(() => {
  localStorage.setItem('CapacitorStorage.google_access_token', 'fake-access-token')
  localStorage.setItem('CapacitorStorage.google_token_expiry', String(Date.now() + 55 * 60 * 1000))
  localStorage.setItem('CapacitorStorage.location_lat', '45.4642')
  localStorage.setItem('CapacitorStorage.location_lon', '9.1900')
})

// Mock APIs
await page.route('**/calendar/v3/users/me/calendarList**', route =>
  route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      items: [
        { id: 'primary', summary: 'Personal', backgroundColor: '#A4BDFC', foregroundColor: '#fff' },
      ],
    }),
  })
)

await page.route('**/calendar/v3/calendars/**', route =>
  route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      items: [
        {
          id: 'evt1', summary: 'Morning Standup',
          start: { dateTime: new Date().toISOString().slice(0, 11) + '09:00:00' },
          end:   { dateTime: new Date().toISOString().slice(0, 11) + '09:30:00' },
          colorId: '1',
        },
        {
          id: 'evt2', summary: 'Team Lunch',
          start: { dateTime: new Date().toISOString().slice(0, 11) + '12:00:00' },
          end:   { dateTime: new Date().toISOString().slice(0, 11) + '13:00:00' },
          location: 'Canteen',
          colorId: '2',
        },
        {
          id: 'evt3', summary: '1:1 with Manager',
          start: { dateTime: new Date().toISOString().slice(0, 11) + '15:00:00' },
          end:   { dateTime: new Date().toISOString().slice(0, 11) + '15:30:00' },
          colorId: '3',
        },
      ],
    }),
  })
)

await page.route('**/tasks/v1/users/@me/lists**', route =>
  route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ items: [{ id: 'list1', title: 'My Tasks' }] }),
  })
)

await page.route('**/tasks/v1/lists/**', route =>
  route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      items: [
        { id: 't1', title: 'Review pull request', status: 'needsAction' },
        { id: 't2', title: 'Book dentist', status: 'needsAction' },
        { id: 't3', title: 'Buy groceries', status: 'completed' },
      ],
    }),
  })
)

await page.route('**/api.open-meteo.com/**', route =>
  route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({
      current: { temperature_2m: 18, weather_code: 1 },
      daily: {
        temperature_2m_min: [12],
        temperature_2m_max: [24],
        sunrise: [new Date().toISOString().slice(0, 11) + '06:15'],
        sunset:  [new Date().toISOString().slice(0, 11) + '20:30'],
      },
      hourly: {
        time: Array.from({ length: 5 }, (_, i) =>
          new Date().toISOString().slice(0, 11) + `${String(10 + i).padStart(2, '0')}:00`
        ),
        temperature_2m: [18, 19, 21, 22, 20],
        weather_code:   [1, 1, 2, 2, 3],
      },
    }),
  })
)

await page.route('**/nominatim.openstreetmap.org/**', route =>
  route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ address: { city: 'Milan' }, display_name: 'Milan, Italy' }),
  })
)

await page.goto('http://localhost:5173')

// Wait for dashboard to fully render
await page.waitForSelector('text=Morning Standup', { timeout: 10000 })
await page.waitForTimeout(500) // let fonts/animations settle

await page.screenshot({ path: OUT, fullPage: false })
await browser.close()

console.log(`Screenshot saved to ${OUT}`)
