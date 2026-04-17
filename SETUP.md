# Setup

## 1. Create a Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create a new project (e.g., "Morning Dashboard")

## 2. Enable APIs

In the project, go to **APIs & Services > Library** and enable:
- Google Calendar API
- Tasks API

## 3. Configure OAuth Consent Screen

Go to **APIs & Services > OAuth consent screen**:
- User type: External (or Internal if using Workspace)
- Add scopes: `calendar.readonly` and `tasks`
- Add your Google account as a test user

## 4. Create OAuth Client ID

Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**:
- Application type: **Web application**
- Authorized JavaScript origins: `http://localhost:5173`
- Download the JSON — copy the **Client ID**

For Android (when deploying):
- Create a second credential: **Android**
- Package name: `com.personal.morningdashboard`
- SHA-1: run `keytool -keystore ~/.android/debug.keystore -list -v` and copy the SHA-1

## 5. Create .env file

```
cp .env.example .env
```

Edit `.env` and paste your Web client ID:
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## 6. Run

```bash
npm run dev
```

Open http://localhost:5173, click "Sign in with Google".
