# GitHub Actions APK Build Guide

This repository is configured to automatically build Android APKs using GitHub Actions.

## How to Build an APK

### Method 1: Automatic Build (on push)
Simply push your code to the `main` or `feature/google-maps-integration` branch:
```bash
git add .
git commit -m "Your commit message"
git push origin feature/google-maps-integration
```

The APK will be built automatically.

### Method 2: Manual Build
1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **Build Android APK** workflow from the left sidebar
4. Click **Run workflow** button
5. Select the branch you want to build
6. Click **Run workflow**

## Setup Required (First Time Only)

You need to add your API keys as GitHub Secrets:

1. Go to your repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add these secrets:
   - `GOOGLE_MAPS_API_KEY` - Your Google Maps API key
   - `SUPABASE_URL` - Your Supabase project URL (if using)
   - `SUPABASE_ANON_KEY` - Your Supabase anon key (if using)

## Download the Built APK

After the workflow completes:

1. Go to the **Actions** tab in GitHub
2. Click on the completed workflow run
3. Scroll down to **Artifacts** section
4. Download **app-release.zip**
5. Extract the ZIP to get `app-release.apk`

## Install the APK

Transfer the APK to your Android device and install it. You may need to enable "Install from unknown sources" in your device settings.

## Build Status

The build typically takes 5-10 minutes. You can monitor progress in the Actions tab.

## Notes

- The APK is kept for 30 days in GitHub's artifact storage
- This builds a **release** APK (not signed for Play Store)
- For Play Store distribution, you'll need to configure signing keys
