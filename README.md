# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Choose your development method:

### Method A: Development with Expo Go

   ```bash
   npx expo start
   ```

### Method B: Native Android Build (Recommended for Full Features)

1. Set up Firebase and get `google-services.json`:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or open existing one
   - Add an Android app with package name `com.anonymous.dispatchofficer`
   - Download the `google-services.json` file
   - Place it in `android/app/google-services.json`

2. Set the environment variable for Google Services:
   ```powershell
   $env:GOOGLE_SERVICES_JSON="android\app\google-services.json"
   ```

3. Run the Android build script:
   ```powershell
   .\build-android-on-windows.ps1
   ```

   This script will:
   - Generate native Android files
   - Install Android SDK dependencies if needed
   - Build and install the app on your connected device
   - Start the Metro bundler for development

4. Requirements:
   - Android Studio with Android SDK installed
   - Android device connected via USB with USB debugging enabled
   - Java Development Kit (JDK) installed
   - Environment variables set up properly (ANDROID_HOME, JAVA_HOME)

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Troubleshooting Android Build

If you encounter any issues during the Android build process:

1. Missing `gradlew.bat`:
   - Run `npx expo prebuild -p android` to regenerate native files
   - Then run the build script again

2. Google Services issues:
   - Ensure `google-services.json` is in the correct location
   - Verify the package name matches in both files
   - Make sure the environment variable is set correctly

3. Build failures:
   - Try cleaning the build: `cd android && .\gradlew clean`
   - Update Android SDK tools in Android Studio
   - Check Java version compatibility

4. Device connection issues:
   - Enable USB debugging on your device
   - Try different USB ports or cables
   - Run `adb devices` to verify device connection

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Notifications (setup and usage)

For local notifications and background push (FCM) setup, testing, and troubleshooting, see:

- `docs/NOTIFICATIONS.md`

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
