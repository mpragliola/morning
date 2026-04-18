export interface HourlySlot {
  time: string        // ISO string
  temp: number        // celsius
  weatherCode: number // WMO code
}

export interface WeatherData {
  current: {
    temp: number
    weatherCode: number
    condition: string
  }
  today: {
    min: number
    max: number
    sunrise: string  // HH:MM
    sunset: string   // HH:MM
  }
  hourly: HourlySlot[]  // next 5 hours
}
