import { test as base, expect, Page } from '@playwright/test'

async function injectFakeAuth(page: Page) {
  await page.addInitScript(() => {
    // Capacitor Preferences in browser uses 'CapacitorStorage.' prefix per key
    localStorage.setItem('CapacitorStorage.google_access_token', 'fake-access-token')
    localStorage.setItem('CapacitorStorage.google_token_expiry', String(Date.now() + 55 * 60 * 1000))
    // Inject saved location so useLocation skips geolocation (Milan)
    localStorage.setItem('CapacitorStorage.location_lat', '45.4642')
    localStorage.setItem('CapacitorStorage.location_lon', '9.1900')
  })
}

async function mockAPIs(page: Page) {
  await page.route('**/calendar/v3/users/me/calendarList**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: 'primary', summary: 'My Calendar', backgroundColor: '#4285F4', foregroundColor: '#fff' },
        ],
      }),
    })
  )

  await page.route('**/calendar/v3/calendars/**', route => {
    const url = new URL(route.request().url())
    const timeMin = url.searchParams.get('timeMin') ?? ''

    // Compute tomorrow's timeMin using the same logic as useTomorrowCalendar (local midnight → ISO)
    const now = new Date()
    const tomorrowLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const tomorrowTimeMin = tomorrowLocalMidnight.toISOString()

    // Compute the day after tomorrow's timeMin to bound the range
    const dayAfterLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)
    const dayAfterTimeMin = dayAfterLocalMidnight.toISOString()

    // If timeMin matches tomorrow's range, serve tomorrow's events
    if (timeMin >= tomorrowTimeMin && timeMin < dayAfterTimeMin) {
      // Build tomorrow's event datetimes using the same local midnight base
      const tomorrowDateStr = tomorrowLocalMidnight.toISOString().slice(0, 11)
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'tmr1',
              summary: 'Saturday Gym',
              start: { dateTime: tomorrowDateStr + '10:00:00' },
              end: { dateTime: tomorrowDateStr + '11:00:00' },
            },
          ],
        }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'evt1',
            summary: 'Morning Standup',
            start: { dateTime: new Date().toISOString().slice(0, 11) + '09:00:00' },
            end: { dateTime: new Date().toISOString().slice(0, 11) + '09:30:00' },
            colorId: '1',
          },
          {
            id: 'evt2',
            summary: 'Team Lunch',
            start: { dateTime: new Date().toISOString().slice(0, 11) + '12:00:00' },
            end: { dateTime: new Date().toISOString().slice(0, 11) + '13:00:00' },
            location: 'Canteen',
            description: 'Bring your own lunch.\nSee you there.',
          },
        ],
      }),
    })
  })

  await page.route('**/tasks/v1/users/@me/lists**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [{ id: 'list1', title: 'My Tasks' }] }),
    })
  )

  await page.route('**/tasks/v1/lists/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          { id: 't1', title: 'Buy groceries', status: 'needsAction' },
          { id: 't2', title: 'Read book', status: 'completed' },
        ],
      }),
    })
  )

  await page.route('**/api.open-meteo.com/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: { temperature_2m: 18, weather_code: 0 },
        daily: {
          temperature_2m_min: [12],
          temperature_2m_max: [24],
          sunrise: [new Date().toISOString().slice(0, 11) + '06:15'],
          sunset: [new Date().toISOString().slice(0, 11) + '20:30'],
        },
        hourly: {
          time: Array.from({ length: 5 }, (_, i) => new Date().toISOString().slice(0, 11) + `${String(9 + i).padStart(2, '0')}:00`),
          temperature_2m: [18, 19, 20, 21, 20],
          weather_code: [0, 0, 1, 1, 2],
        },
      }),
    })
  )

  await page.route('**/nominatim.openstreetmap.org/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ address: { city: 'Milan' }, display_name: 'Milan, Italy' }),
    })
  )
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await injectFakeAuth(page)
    await mockAPIs(page)
    await page.goto('/')
    await use(page)
  },
})

export { expect }
