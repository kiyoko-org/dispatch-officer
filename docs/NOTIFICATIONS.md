# Notifications — Dispatch Officer App

This guide explains how notifications work in the Dispatch Officer app, and how to set up, test, and ship both local notifications and background (remote) push notifications on Android using Firebase Cloud Messaging (FCM).

- Audience: Mobile devs working on this app, backend devs who need to send pushes
- Platforms covered: Android (iOS can be added later)

---

## Overview

There are two ways the app shows notifications:

1) Local notifications
   - Triggered by the app itself while it is running (foreground or background)
   - Used when the app detects in-JS events, e.g., new assignment while app is active
   - Do not show if the app is fully closed

2) Remote push notifications (FCM)
   - Delivered by Firebase Cloud Messaging even if the app is closed
   - Require Firebase setup (google-services.json), Gradle plugin, and a device token
   - Sent by the backend when an assignment changes

The app includes both. We use local notifications for immediate in-app events, and FCM for closed/background delivery.

---

## Prerequisites

- Android device with Google Play Services (recommended over emulator)
- Node.js LTS installed locally
- Firebase project access with Editor or Owner role

---

## App-side setup (already wired in the repo)

These are already implemented in code, but listed here for reference.

- Library: `expo-notifications`
- Android channel: `default` with MAX importance
- Local notifications API wrapper: `services/notification-service.ts`
- App integration:
  - Registers for notification permission on startup
  - Retrieves FCM device token on Android
  - Schedules a local notification when a new assignment is detected while app is running
  - Handles notification taps and deep-links to the report details screen

Related files:
- `services/notification-service.ts`
- `app/index.tsx`
- `app/settings.tsx` (Push Debug section)
- `app.config.js` (notifications plugin + google services file)

---

## Firebase (FCM) setup — Android

1) Create Firebase project + Android app
- Console: https://console.firebase.google.com
- Create/open project
- Add Android app with package name: `com.anonymous.dispatchofficer`
- Download `google-services.json`

2) Add the JSON to the project
- Path: `android/app/google-services.json`
- Verify it contains the correct package name above

3) Gradle plugin (already configured)
- `android/build.gradle` includes:
  - `classpath 'com.google.gms:google-services:4.4.2'`
- `android/app/build.gradle` applies:
  - `apply plugin: 'com.google.gms.google-services'`

4) App config
- `app.config.js`:
  - `android.googleServicesFile: './android/app/google-services.json'`
  - Includes the `expo-notifications` plugin and Android options

5) Rebuild the app
- Use the provided script (Windows PowerShell):
  ```powershell
  .\build-android-on-windows.ps1
  ```
- Open the installed app icon (not Expo Go) when testing.

---

## Getting a device token (Android)

Inside the app:
- Go to Settings → Notifications → Push Debug
- Tap "Get device token" — you should see a long token string
- Use "Share token" to copy it for testing or storing in your backend

Common issues:
- "Default FirebaseApp is not initialized": ensure the Google Services plugin is applied and you rebuilt after adding `google-services.json`.
- No token: verify package name matches, Play Services are available, and you launched the installed dev build (not Expo Go).

---

## Testing push notifications

Option A: Firebase Console (recommended)
1) Console → Engage → Messaging (Cloud Messaging)
2) New campaign → Notification
3) Choose your Android app and set title/body
4) Click "Send test message" (aka "Test on device"), paste the device token, and send
5) Fully close the app before sending to validate closed-app delivery

Option B: Local Node script (works regardless of UI)
1) In Firebase Console → Project settings → Service accounts → Generate new private key → save as `serviceAccount.json` (do not commit)
2) Create `send-fcm-test.js` in the repo root:
   ```js
   const admin = require('firebase-admin');
   const serviceAccount = require('./serviceAccount.json');

   admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

   const token = 'PASTE_DEVICE_TOKEN_HERE';

   admin.messaging().send({
     token,
     notification: { title: 'Test push', body: 'Hello from Firebase Admin' },
     android: { priority: 'high' },
     data: { type: 'new_assignment', reportId: '123' },
   })
   .then((res) => { console.log('Sent:', res); process.exit(0); })
   .catch((err) => { console.error('Error:', err); process.exit(1); });
   ```
3) Run:
   ```powershell
   npm install firebase-admin
   node .\send-fcm-test.js
   ```

---

## Backend integration (send on assignment)

When a report is assigned to an officer, your backend should send an FCM message to that officer’s device token.

- Store tokens per officer
  - Example schema: `officer_push_tokens(officer_id, platform, token, updated_at)`
  - Update the token on app start or login
- Message format
  - Include `notification` (title/body) for closed-app delivery on Android
  - Include `data.reportId` and `data.type = 'new_assignment'` so the app can deep-link on tap
- Example payload (Firebase Admin SDK):
  ```json
  {
    "message": {
      "token": "<FCM_DEVICE_TOKEN>",
      "android": { "priority": "HIGH" },
      "notification": { "title": "🚨 New Report Assigned", "body": "Report #123" },
      "data": { "type": "new_assignment", "reportId": "123" }
    }
  }
  ```

Client-side deep link handling is already implemented:
- On notification tap, we inspect `data.reportId` and navigate to `/report/{id}`.

---

## Local notifications (while app is running)

- The app detects assignment changes while it’s active and calls:
  - `NotificationService.scheduleNewReportNotification({ id, title, description, location })`
- Android channel `default` is created at MAX importance

---

## Troubleshooting

- Not seeing token
  - Ensure you run the installed dev build (not Expo Go)
  - Check `android/app/google-services.json` and rebuild
  - Update Google Play Services on the device
- Console UI confusion
  - Use "Send test message" from the Notification composer to send to a single device token
  - Or use the Node script (Admin SDK) for a direct test
- No closed-app notifications
  - Ensure your backend includes the `notification` field (title/body), not data-only
  - Disable OEM battery restrictions for the app
- App opens but doesn’t navigate to the report
  - Ensure `data.reportId` is set and a string/number

---

## Files to review
- `services/notification-service.ts` — registration, token retrieval, local scheduling
- `app/index.tsx` — app wiring, notification listeners, assignment detection
- `app/settings.tsx` — Push Debug tools
- `app.config.js` — notifications plugin + googleServicesFile
- `android/build.gradle` and `android/app/build.gradle` — Google Services Gradle setup

---

## Next steps
- Wire token persistence in `app/index.tsx` to store tokens on your backend
- Add server logic to send FCM on assignment changes
- Optional: add iOS (APNs) path once you need iOS devices
