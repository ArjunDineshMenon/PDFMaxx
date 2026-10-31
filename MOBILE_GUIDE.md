# PDFMaxx — Mobile Deployment & Publishing Guide (Android & iOS)

This repository contains the complete native mobile project configuration powered by **Capacitor 6** and **Ionic**, enabling **PDFMaxx** to run as a high-performance, native app on both **Android** and **iOS** with zero cloud dependencies.

---

## 📱 Mobile Architecture Overview

- **App Package ID**: `com.arjundineshmenon.pdfmaxx`
- **App Name**: `PDFMaxx`
- **Native Android Project**: [`android/`](file:///c:/Users/Lenovo-PC/Documents/Projects/PDFMaxx/android/) (Gradle & Android Studio)
- **Native iOS Project**: [`ios/`](file:///c:/Users/Lenovo-PC/Documents/Projects/PDFMaxx/ios/) (Xcode & CocoaPods)
- **Shared Web Engine**: [`dist/`](file:///c:/Users/Lenovo-PC/Documents/Projects/PDFMaxx/dist/) (100% offline, client-side WebAssembly & Canvas)

### Installed Native Plugins
1. **`@capacitor/share`**: Native Android & iOS Share Sheet. Allows users to export converted PDFs and Office files directly to WhatsApp, AirDrop, Google Drive, Gmail, or save to Files.
2. **`@capacitor/camera`**: High-resolution camera document scanning with autofocus and rear-facing (`environment`) camera selection.
3. **`@capacitor/filesystem`**: Secure local device file storage and retrieval.
4. **`@capacitor/status-bar`**: Styled dark/light mobile status bar matching PDFMaxx theme.
5. **`@capacitor/splash-screen`**: Smooth branded splash screen during startup.
6. **`@capacitor/haptics`**: Physical tactile feedback on touch actions.

---

## 🚀 Quick Mobile Commands (`package.json`)

| Command | Action |
|---|---|
| `npm run mobile:prepare` | Rebundles app files and synchronizes Android & iOS assets |
| `npm run mobile:sync` | Syncs web assets and native plugins to mobile projects |
| `npm run mobile:android` | Opens the native Android project in Android Studio |
| `npm run mobile:ios` | Opens the native iOS project in Xcode (on macOS) |
| `npm run mobile:run:android` | Compiles and deploys to a connected Android phone or emulator |
| `npm run mobile:run:ios` | Compiles and deploys to an iPhone or iOS Simulator |

---

## 🤖 Android Setup & Google Play Store Launch

### 1. Requirements for Android
- Download and install [Android Studio](https://developer.android.com/studio).
- Install the **Android SDK Platform 34** (or latest) in Android Studio's SDK Manager.

### 2. Testing on an Android Phone (USB Debugging)
1. On your Android phone, enable **Developer Options**:
   - Go to *Settings* → *About Phone* → tap **Build Number** 7 times.
   - Go to *Developer Options* and turn on **USB Debugging**.
2. Connect your phone to your PC with a USB cable.
3. In terminal, run:
   ```bash
   npm run mobile:prepare
   npm run mobile:android
   ```
4. Android Studio will open with the [`android/`](file:///c:/Users/Lenovo-PC/Documents/Projects/PDFMaxx/android/) project.
5. In the top toolbar, select your connected phone from the device dropdown and click the green **▶ Play** button.
6. The app will compile and launch directly on your phone!

### 3. Generating a Production Release (`.aab`) for Google Play
1. In Android Studio, go to:
   **Build** → **Generate Signed Bundle / APK...**
2. Choose **Android App Bundle (`.aab`)** and click **Next**.
3. Create or select your keystore file (save your password safely!).
4. Select `release` build variant and click **Create**.
5. Android Studio generates `app-release.aab`.

### 4. Uploading to Google Play Console
1. Create a developer account at [Google Play Console](https://play.google.com/console) ($25 one-time registration).
2. Click **Create App**:
   - Name: `PDFMaxx — 32-in-1 PDF Suite`
   - Default language: English
   - App or Game: App
   - Free or Paid: Free
3. Go to **Production** (or **Internal Testing**) → click **Create new release**.
4. Drag and drop your `app-release.aab` bundle.
5. Fill out the Store Listing (description, screenshots, icons from `src/icons/icon-512.png`).
6. Submit for review!

---

## 🍏 iOS Setup & Apple App Store Launch

### 1. Requirements for iOS
- A Mac computer (MacBook, Mac mini, iMac, or Mac in Cloud).
- [Xcode](https://developer.apple.com/xcode/) from the Mac App Store.
- CocoaPods (`sudo gem install cocoapods`).

### 2. Testing on an iPhone (Local Development)
1. Sync your project files to your Mac.
2. In the project root on your Mac, run:
   ```bash
   npm run mobile:prepare
   npm run mobile:ios
   ```
3. Xcode will launch with the [`ios/`](file:///c:/Users/Lenovo-PC/Documents/Projects/PDFMaxx/ios/) workspace.
4. Connect your iPhone via USB, select your device in the top device selector.
5. Under **Signing & Capabilities**, select your Apple ID team.
6. Click the **▶ Play (Build and Run)** button. The app installs directly onto your iPhone!

### 3. Publishing to the Apple App Store
1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year).
2. In Xcode, select **Any iOS Device (arm64)** as the build target.
3. Go to **Product** → **Archive**.
4. Once the build completes, click **Distribute App** → **App Store Connect** → **Upload**.
5. Open [App Store Connect](https://appstoreconnect.apple.com), select your uploaded build, add app screenshots and description, and submit for App Review.

---

## 🌐 Instant Mobile Access & Installation (PWA Mode)
You can run and install PDFMaxx on any **Android phone, iPhone, iPad, tablet, or Chromebook immediately** without waiting for App Store reviews:

1. **Automatic GitHub Pages Deployment**:
   Every push to `main` automatically builds and deploys the latest PWA via [`.github/workflows/deploy-pwa.yml`](.github/workflows/deploy-pwa.yml).
   - In your GitHub repo: go to **Settings** → **Pages** → under **Build and deployment**, select **GitHub Actions**.
   - Your live app URL will be: `https://<your-github-username>.github.io/PDFMaxx/`
2. **One-Tap Install on Android**:
   - Open your GitHub Pages link in Chrome or Edge on Android.
   - Tap the **"Install App"** button in the top navigation header (or choose "Install App" from Chrome's menu).
   - PDFMaxx will be added to your home screen with its official icon, launching in full-screen standalone mode.
3. **One-Tap Install on iPhone & iPad**:
   - Open your GitHub Pages link in Safari on iOS.
   - Tap the **"Install App"** button (or tap Safari's Share button ⎋).
   - Choose **"Add to Home Screen"** ⊕ and tap **Add**.
4. **100% Offline Capability**:
   - Thanks to the Service Worker (`sw.js`), all 32 tools, styling, scripts, and libraries are cached locally.
   - Once loaded once, you can turn on Airplane Mode and use all 32 PDF and image tools completely offline!

