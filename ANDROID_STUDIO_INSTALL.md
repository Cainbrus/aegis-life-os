# Digital Mate — Install on your phone with Android Studio

The project is pre-configured so this build **updates over your existing app without losing data**:
- Package: `com.digitalmate.app` (unchanged)
- Signing: committed keystore `frontend/android/app/digitalmate-signing.keystore`
  (matches the installed APK — CN=Android Debug, SHA-256 `B6:90:1D:3F:...:9B`)
- Version bumped: versionCode 2 / versionName 1.1

## 0. One-time prerequisites (on your computer)
- Install **Android Studio** (latest).
- Install **Node.js 18+** and **Yarn** (`npm i -g yarn`).
- On your phone: Settings → About phone → tap **Build number** 7× to unlock Developer options,
  then Settings → Developer options → enable **USB debugging**.

## 1. Get the project onto your computer
Use the chat's **"Save to GitHub"** button, then on your computer:
```bash
git clone <your-repo-url> digitalmate
cd digitalmate
```
(or download the project zip and unzip it).

## 2. Build the web app and sync it into Android
```bash
cd frontend
yarn install
yarn build
npx cap sync android
```

## 3. Open the Android project in Android Studio
- Android Studio → **Open** → select the folder `frontend/android` (NOT the repo root).
- Wait for **Gradle sync** to finish. If prompted, let it install the required SDK / build-tools
  (compileSdk 33) and accept licenses.

## 4. Connect your phone and Run
- Plug the phone in via USB; tap **Allow USB debugging** on the phone.
- In Android Studio's device dropdown (top toolbar) select your phone.
- Click the green **Run ▶** button.
- Android Studio builds a signed debug APK and installs it. Because the package + signature match
  and versionCode is higher (2 > 1), it **updates in place** — your codes, device_id, and
  server-linked data are kept.

## 5. (Optional) Build an APK file to sideload later
- Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
- Click **locate** in the popup → `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.
- Install from a file manager on the phone, or:
  ```bash
  adb install -r frontend/android/app/build/outputs/apk/debug/app-debug.apk
  ```
  `-r` = reinstall/update (keeps data). Do **NOT** uninstall the old app first.

## Verify the signature matches (so data is preserved)
```bash
keytool -list -v -keystore frontend/android/app/digitalmate-signing.keystore \
  -storepass android -alias androiddebugkey | grep SHA256
```
Must print: `SHA256: B6:90:1D:3F:4D:2B:5D:90:29:1E:8F:C9:67:9F:BE:AD:3A:35:6F:C1:75:06:BC:4F:9A:72:11:CA:F6:A9:0F:9B`

## Notes
- On the phone, the `0000` dev bypass is **disabled** (native build). Use your real **access code**.
- If Android ever refuses the install with a "signatures do not match" error, it means the build was
  signed with a different key — check step above. You'd otherwise have to uninstall (which wipes local
  data and creates a new device_id). The committed keystore prevents this.
- Native features (Device Admin, SIM-swap, secret dial code, call triggers) only work on a real device;
  grant the requested permissions on first launch.

## Troubleshooting
- **Gradle sync fails / SDK missing**: Android Studio → Settings → Languages & Frameworks → Android SDK →
  install "Android 13 (API 33)" platform + latest Build-Tools, then File → Sync Project with Gradle Files.
- **Device not detected**: reconnect USB, re-accept the debugging prompt, try `adb devices`.
- **App shows old content after update**: you likely skipped `yarn build && npx cap sync android` (step 2).
