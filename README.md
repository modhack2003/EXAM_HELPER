# 📱 RemoteDisplayLink

**RemoteDisplayLink** is a high-performance, real-time synchronization tool built with Next.js and Firebase. It allows you to turn any smartphone into a remote control and any larger screen (TV, Tablet, Laptop) into a synchronized display for interactive presentations, quizzes, or live voting.

---

## ✨ Features

- **Dual-Device Sync**: Real-time interaction between a Control Panel and a Display Panel.
- **Wake Lock API**: Prevents screens from dimming or sleeping during active sessions.
- **Fullscreen API**: Immersive "App-like" experience on mobile and desktop.
- **QR & Manual Entry**: Join sessions via QR code scan or manual 7-digit ID.
- **125 Question Cycles**: Support for long-form sessions with navigation controls.
- **Anonymous Auth**: Instant, secure connection without requiring user accounts.

---

## 🚀 Deployment Guide (Vercel)

1. **Push to GitHub**: Initialize a git repository and push your project to GitHub.
2. **Import to Vercel**: Connect your repo at [vercel.com/new](https://vercel.com/new).
3. **Build Settings**: Vercel will auto-detect Next.js. Use the default build command (`npm run build`).
4. **Environment Variables**: The app uses the configuration in `src/firebase/config.ts`. If you prefer to use environment variables, prefix them with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`).

---

## 🔥 Firebase Setup (REQUIRED)

To make the app functional in production, follow these steps in the [Firebase Console](https://console.firebase.google.com/):

### 1. Enable Anonymous Authentication
- Navigate to **Build > Authentication**.
- Under the **Sign-in method** tab, click **Add new provider**.
- Select **Anonymous**, toggle **Enable**, and click **Save**.
- *Why? This allows devices to sync securely and instantly.*

### 2. Provision Firestore
- Navigate to **Build > Firestore Database**.
- Click **Create Database** and select a location near your users.
- Start in **Production Mode**.

### 3. Deploy Security Rules
- Copy the content of the `firestore.rules` file in this repository.
- Paste it into the **Rules** tab of your Firestore Database in the Firebase Console.
- Click **Publish**.

---

## 📱 Usage Instructions

### 1. Presenter (Control Panel)
- Open `/control` on your smartphone.
- A unique Session ID is generated automatically.
- Share the QR code or the Session ID with your audience screen.

### 2. Audience (Display Panel)
- Open `/display` on the target device (TV, Monitor).
- Scan the QR code or enter the Session ID manually.
- Use the **Maximize** button for a professional fullscreen view.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Shadcn UI
- **Database**: Firebase Firestore (Real-time SDK)
- **Auth**: Firebase Anonymous Authentication
- **Icons**: Lucide React
- **QR Generation**: qrcode.react

---

## 📄 License
MIT License. Created for high-speed real-time synchronization.
