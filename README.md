# APMS Mobile — Activity Points Management System

The official Android companion app for APMS, built with React Native. Students can log in, track their activity points, upload certificates, and view approvals — all from their phone.

---

## 📱 App Info

| Field | Value |
|---|---|
| App Name | APMS |
| Package | `com.activitypointsnative` |
| Version | 1.0 (build 1) |
| Platform | Android (iOS scaffold included) |
| Min SDK | API 24 (Android 7.0) |
| Target SDK | API 36 (Android 16) |
| React Native | 0.85.3 |

---

## ✨ Features

- **OTP Login** — Email-based login with OTP verification
- **Forgot Password** — Reset password via email OTP
- **Dashboard** — Live activity points summary per category
- **Upload Certificate** — Pick images from camera or gallery and submit with category, date, and description
- **Certificates** — View all submitted certificates with approval status
- **Animated Splash Screen** — Custom icon scale + fade exit animation (Android 12+)
- **Persistent Auth** — JWT stored in AsyncStorage; session restores on relaunch
- **Auto Logout** — Clears session automatically on 401 responses

---

## 🛠️ Tech Stack

| Package | Version | Purpose |
|---|---|---|
| React Native | 0.85.3 | Core framework |
| React | 19.2.3 | UI rendering |
| TypeScript | ^5.8.3 | Type safety |
| React Navigation | ^7.x | Stack + bottom tab navigation |
| Axios | ^1.16.0 | API calls with interceptors |
| AsyncStorage | ^1.23.1 | Token & session persistence |
| react-native-image-picker | ^8.2.1 | Camera & gallery access |
| react-native-blob-util | ^0.19.11 | File download & handling |
| react-native-vector-icons | ^10.3.0 | MaterialCommunityIcons tab bar |
| react-native-safe-area-context | ^5.7.0 | Notch / gesture bar handling |
| react-native-screens | ^4.24.0 | Native navigation optimization |
| datetimepicker | ^8.3.0 | Date selection on uploads |
| androidx.core:core-splashscreen | 1.0.1 | Native Android splash screen |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 22.11.0
- JDK 17+
- Android Studio with Android SDK (API 36)
- A physical Android device or emulator (API 24+)

### Install dependencies

```bash
npm install
```

### Configure the API URL

Open `src/api/axiosInstance.ts` and update `BASE_URL` to point to your backend:

```ts
export const BASE_URL = 'https://your-backend-url.com/api';
```

### Run in development

```bash
# Start Metro bundler
npm start

# In a separate terminal, run on Android
npm run android
```

---

## 📦 Build Release APK

```bash
cd android
gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Common build issues (Windows)

If you hit a `classes.dex` file lock error:

```bash
gradlew --stop
rd /s /q app\build
gradlew assembleRelease
```

Also make sure Android Studio is closed and antivirus real-time scanning is paused during the build.

---

## 📁 Project Structure

```
src/
├── api/
│   └── axiosInstance.ts        # Axios client with auth interceptors
├── context/
│   └── AuthContext.tsx         # Global auth state, login/logout
├── navigation/
│   ├── RootNavigator.tsx       # Auth-aware root stack
│   └── StudentTabNavigator.tsx # Bottom tab bar (Dashboard / Upload / Certificates)
├── screens/
│   ├── LoginScreen.tsx
│   ├── VerifyOtpScreen.tsx
│   ├── ForgotPasswordScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── UploadCertificateScreen.tsx
│   └── CertificatesScreen.tsx
├── theme/
│   └── index.ts                # Colors, typography, shared tokens
└── utils/
    └── calcPoints.ts           # SBTE Kerala points calculation (client-side)
```

---

## 🔐 Auth Flow

```
App launch
  └─ AsyncStorage has token + role=student?
       ├─ Yes → verify via GET /students/me → go to StudentTabNavigator
       └─ No  → go to Login → VerifyOtp → StudentTabNavigator
```

On 401 response, the Axios interceptor automatically clears all stored tokens and the user is returned to the login screen.

---

## 🔑 Permissions

| Permission | Reason |
|---|---|
| `INTERNET` | API communication |
| Camera | Certificate photo capture |
| Read Storage | Certificate image selection from gallery |

---

## 🔗 Related

This app connects to the **APMS Backend** — see [`APMSV1-main`](../APMSV1-main) for backend setup instructions and API documentation.

---

## 📄 License

Internal use only.
