# Push Notifications (Android) — Background/Closed App

This app supports local notifications out of the box. To receive notifications when the app is backgrounded or closed, enable remote push using Firebase Cloud Messaging (FCM).

## 1) Create a Firebase project
- Go to https://console.firebase.google.com and create (or open) a project.
- Add an Android app with the package name `com.anonymous.dispatchofficer` (must match `app.config.js`).
- Download the `google-services.json` for this Android app.

## 2) Add google-services.json to the project
- Save the file to the project and set its path in your environment variable:
  - Windows PowerShell (temporary for current session):
    ```powershell
    $env:GOOGLE_SERVICES_JSON="android\app\google-services.json"
    ```
  - Then place the file at `android/app/google-services.json` or provide another path and update the env var accordingly.
- The config in `app.config.js` reads:
  - `android.googleServicesFile: process.env.GOOGLE_SERVICES_JSON`

## 3) Rebuild the native app
- After adding `google-services.json`, rebuild and install:
  ```powershell
  .\build-android-on-windows.ps1
  ```

## 4) Device token and backend
- On app start, the app requests notification permission and fetches the device push token (FCM) on Android.
- You must persist that token to your backend for the current officer so your server can send push messages.
- Where to persist:
  - Implement a method in your backend (e.g., Supabase or your dispatch service) to save the token per officer.
  - In `app/index.tsx`, look for the TODO after `registerForPushNotifications()` and call your API there.

## 5) Sending a push
- Use Firebase Admin SDK or Expo Push service (with app using Expo push tokens) to send a notification containing `data: { reportId, type }`.
- Example minimal FCM HTTP v1 message (Firebase Admin SDK recommended):
  ```json
  {
    "message": {
      "token": "<FCM_DEVICE_TOKEN>",
      "android": { "priority": "HIGH" },
      "data": { "type": "new_assignment", "reportId": "123" },
      "notification": { "title": "🚨 New Report Assigned", "body": "Report #123" }
    }
  }
  ```

## 6) Deep link handling
- The app already listens for notification taps and navigates to `/report/{reportId}` when `data.reportId` is present.

## Tips
- If you don’t receive pushes while the app is closed:
  - Confirm `google-services.json` matches the app package.
  - Ensure the device has network and notifications allowed for the app.
  - Some OEMs require disabling battery optimizations.
  - Rebuild after any Firebase changes.
