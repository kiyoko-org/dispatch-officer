$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Ensure android/local.properties has the SDK path for Gradle
if (!(Test-Path -Path "android\local.properties")) {
	New-Item -ItemType File -Path "android\local.properties" -Force | Out-Null
}
"sdk.dir=$($env:ANDROID_HOME -replace '\\','/')" | Out-File -FilePath "android\local.properties" -Encoding ascii -Force

# Build and run with only arm64-v8a to avoid Windows 260 character path limit
cd android
.\gradlew.bat installDebug -PreactNativeArchitectures=arm64-v8a
cd ..

# Set up port forwarding for Metro bundler
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081

# Start Metro bundler
npx expo start
