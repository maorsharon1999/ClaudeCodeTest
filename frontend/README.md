# Bubble Frontend

React Native + Expo app for the Bubble MVP (Slice 1).

## Prerequisites

- Node.js >= 18
- npm or yarn
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- For iOS: Xcode + iOS Simulator
- For Android: Android Studio + Emulator, or physical device with Expo Go

## Setup

```bash
cd frontend
npm install
npm start
```

Then press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

## Backend

Make sure the backend is running at `http://localhost:3000` before using the app.

## Architecture

```
frontend/
  App.js                        # Root: AuthProvider + RootNavigator
  src/
    api/
      client.js                 # Axios instance, token interceptor, 401 retry
      auth.js                   # OTP request/verify, token refresh, session delete
      profile.js                # GET/PUT profile, GET/PUT visibility
    context/
      AuthContext.js            # Auth state, token management, SecureStore
    navigation/
      RootNavigator.js          # AuthStack vs AppStack routing
    screens/
      PhoneEntryScreen.js       # E.164 input, OTP request
      OtpVerifyScreen.js        # 6-digit OTP, auto-submit, resend countdown
      ProfileSetupScreen.js     # First-time profile form (shared ProfileForm)
      HomeScreen.js             # Visibility toggle, optimistic update, toast
      ProfileEditScreen.js      # Pre-populated profile edit (reuses ProfileForm)
```

## Token Strategy

- Access token: held in memory only (React ref + state)
- Refresh token: persisted in expo-secure-store under key `bubble_refresh_token`
- On launch: silent refresh attempted; failure sends user to AuthStack
- On any 401: one refresh attempt, then AuthStack if that also fails

## QA Notes

- PhoneEntry validates E.164 client-side before calling API; maps `rate_limited` and `invalid_format` error codes to messages
- OtpVerify auto-submits on 6th digit; shows 60s countdown; maps `max_attempts`, `expired`, `invalid_code` codes
- ProfileSetup blocks under-18 via client-side date comparison; Save button disabled until display_name + birth_date filled
- HomeScreen visibility is always OFF on launch regardless of server state (per spec)
- Optimistic toggle reverts on API error and shows a non-blocking toast
- ProfileEdit fetches current profile via GET /profile/me and shows loading/error states
