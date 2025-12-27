# Build Instructions

## Prerequisites

- Node.js 18+
- Android Studio
- Android SDK (API 24+)
- Java JDK 11+

## Setup

1. Install dependencies:
```bash
npm install
```

2. Add Android platform (first time only):
```bash
npm run cap:add:android
```

## Build Commands

### Web Build
```bash
npm run build
```

### Sync Capacitor (after web build)
```bash
npm run cap:sync
```

### Build Android APK
```bash
npm run android:build
```

### Install to Device via ADB
```bash
npm run android:install
```

### Combined Build + Install
```bash
npm run android:install
```

## Manual Steps

1. Build web app: `npm run build`
2. Sync to Capacitor: `npm run cap:sync`
3. Open in Android Studio: `npm run cap:open:android`
4. Build APK in Android Studio or: `cd android && ./gradlew assembleDebug`
5. Install: `cd android && ./gradlew installDebug` or use ADB

## APK Location

After building, the APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Notes

- The app is configured as a HOME launcher
- Requires QUERY_ALL_PACKAGES permission for app listing
- Works 100% offline after first load
- Supabase sync is optional and disabled by default

