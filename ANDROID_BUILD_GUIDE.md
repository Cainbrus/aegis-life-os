# 📱 DIGITAL MATE - ANDROID BUILD GUIDE
## Complete Step-by-Step Instructions

---

# ✅ CAPACITOR SETUP COMPLETE!

Your React app is now ready to be built as an Android app.

## Project Structure Created:
```
/app/frontend/
├── android/                    # Android native project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/  # Your web app files
│   │   │   ├── res/            # Android resources
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   └── build.gradle
├── capacitor.config.json       # Capacitor configuration
└── build/                      # Web build output
```

---

# STEP 1: INSTALL ANDROID STUDIO

## Download Android Studio
1. Go to: https://developer.android.com/studio
2. Download for your OS (Windows/Mac/Linux)
3. Install with default settings
4. During setup, install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (emulator)

## First Launch
1. Open Android Studio
2. Select "Open an existing project"
3. Navigate to: `/app/frontend/android`
4. Wait for Gradle sync to complete (may take 5-10 mins first time)

---

# STEP 2: BUILD DEBUG APK (For Testing)

## Option A: Using Android Studio
1. Open project in Android Studio
2. Wait for Gradle sync
3. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## Option B: Using Command Line
```bash
cd /app/frontend/android
./gradlew assembleDebug
```

The APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

# STEP 3: TEST ON DEVICE/EMULATOR

## Test on Emulator
1. In Android Studio, click **Tools** → **Device Manager**
2. Create a new virtual device (Pixel 6, API 33 recommended)
3. Click the green **Run** button ▶️
4. App will install and launch on emulator

## Test on Real Device
1. Enable **Developer Options** on your Android phone:
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable **USB Debugging**:
   - Settings → Developer Options → USB Debugging → ON
3. Connect phone via USB
4. Allow USB debugging when prompted
5. In Android Studio, select your device and click **Run** ▶️

---

# STEP 4: BUILD RELEASE APK (For Google Play)

## Generate Signing Key
```bash
keytool -genkey -v -keystore digitalmate-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias digitalmate
```

Save this file securely! You'll need it for all future updates.

## Configure Signing in Gradle
Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('digitalmate-release-key.jks')
            storePassword 'your_store_password'
            keyAlias 'digitalmate'
            keyPassword 'your_key_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Build Release APK
```bash
cd /app/frontend/android
./gradlew assembleRelease
```

Release APK: `android/app/build/outputs/apk/release/app-release.apk`

---

# STEP 5: BUILD AAB FOR GOOGLE PLAY (RECOMMENDED)

Google Play prefers Android App Bundle (AAB) format:

```bash
cd /app/frontend/android
./gradlew bundleRelease
```

AAB file: `android/app/build/outputs/bundle/release/app-release.aab`

---

# STEP 6: UPLOAD TO GOOGLE PLAY

## Prerequisites
1. Google Play Developer Account ($25 one-time fee)
   - https://play.google.com/console

## Create New App
1. Go to Google Play Console
2. Click **Create app**
3. Fill in:
   - App name: **Digital Mate**
   - Default language: English
   - App or game: App
   - Free or paid: Free
   - Declarations: Check all boxes
4. Click **Create app**

## Store Listing
Fill in these required fields:

### Short Description (80 chars max):
```
Your phone's invisible bodyguard. Trap snoops with fake data.
```

### Full Description:
```
Digital Mate is the ultimate phone security app that doesn't just lock intruders out - it lets them into FAKE DATA while secretly capturing their photo.

🎭 TRAP MODE
When someone enters the wrong unlock pattern 3 times, Digital Mate activates Trap Mode. The intruder sees a fake phone with fake messages, fake photos, and fake contacts. Meanwhile, we're secretly capturing their photo and logging everything they do.

👻 INVISIBLE VAULT
Hide your most private files in a vault that doesn't exist until you know the secret. Open your Phone app, dial your secret code, and press call. The vault magically appears. There's no app icon, no folder - completely invisible.

🛡️ BEHAVIORAL GUARD
Digital Mate learns how YOU use your phone - your typing rhythm, swipe patterns, the way you hold your phone. If someone else picks it up, we know.

📸 INTRUDER EVIDENCE
Every intrusion is documented with:
• Photo of the intruder
• Location data
• Timestamp
• Activity log of everything they tried to access

Perfect for:
• Protecting your privacy
• Catching phone snoops
• Domestic violence evidence collection
• Keeping kids out of your phone
• Business phone security

Your phone knows everything about you. It's time it started protecting you.
```

### App Category
- Category: Tools
- Tags: Security, Privacy, Protection

### Screenshots (Required)
- At least 2 phone screenshots
- Optional: 7-inch tablet, 10-inch tablet

### App Icon
- 512x512 PNG
- Use the Digital Mate shield logo

---

# STEP 7: CONTENT RATING

1. Go to **Policy** → **App content** → **Content rating**
2. Fill out questionnaire:
   - Violence: None
   - Sexual content: None
   - Profanity: None
   - User-generated content: No
   - Personal info collected: Yes (explain: security features)
3. Save and get rating (likely "Everyone" or "Teen")

---

# STEP 8: PRIVACY POLICY

Create a privacy policy page. You can use:
- Free generator: https://www.termsfeed.com/privacy-policy-generator/
- Or create a simple page on your website

Required content:
- What data you collect (photos, location for security)
- How data is stored (locally on device)
- How data is used (intruder evidence)
- Contact information

---

# STEP 9: RELEASE

## Internal Testing (Recommended First)
1. Go to **Testing** → **Internal testing**
2. Create a release
3. Upload your AAB file
4. Add testers (email addresses)
5. Roll out to internal testers
6. Test for 1-2 days

## Production Release
1. Go to **Production**
2. Create a release
3. Upload your AAB file
4. Add release notes:
   ```
   Digital Mate v1.0.0
   
   🎭 Trap Mode - Catch phone snoops with fake data
   👻 Invisible Vault - Hidden storage via phone dialer
   📸 Intruder Evidence - Photos, location, activity logs
   🛡️ Behavioral Guard - Learns your unique patterns
   ```
5. Click **Review release**
6. Click **Start rollout to Production**

---

# TIMELINE

| Step | Time |
|------|------|
| Build APK | 5 mins |
| Create Play Console account | 15 mins |
| Fill store listing | 30 mins |
| Content rating | 10 mins |
| Submit for review | 5 mins |
| Google review | 1-3 days |
| **Total** | **~3-4 days** |

---

# UPDATING THE APP

When you make changes:

```bash
# 1. Build web app
cd /app/frontend
yarn build

# 2. Sync with Android
npx cap sync android

# 3. Build new APK/AAB
cd android
./gradlew bundleRelease

# 4. Upload to Google Play with new version number
```

---

# QUICK COMMANDS REFERENCE

```bash
# Build web app
yarn build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build debug APK
cd android && ./gradlew assembleDebug

# Build release AAB
cd android && ./gradlew bundleRelease

# Clean build
cd android && ./gradlew clean
```

---

# TROUBLESHOOTING

## Gradle sync failed
- Check internet connection
- File → Invalidate Caches / Restart

## App crashes on launch
- Check `adb logcat` for errors
- Make sure `yarn build` completed successfully
- Run `npx cap sync android` again

## Changes not showing
- Clear app data on device
- Run `yarn build && npx cap sync android`

---

**Your Digital Mate Android app is ready to build! 🚀**

Questions? The Capacitor docs are helpful:
https://capacitorjs.com/docs/android
