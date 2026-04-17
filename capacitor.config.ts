import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.personal.morningdashboard',
  appName: 'Morning Dashboard',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/tasks',
      ],
      serverClientId: process.env.VITE_GOOGLE_CLIENT_ID ?? '',
      forceCodeForRefreshToken: true,
    },
  },
}

export default config
