# RemoteDisplayLink - Production Deployment Guide

This app is a real-time, dual-device synchronization tool built with Next.js and Firebase.

## 🚀 Deployment to Vercel

1. **Connect Repo**: Push your code to GitHub/GitLab and import it into Vercel.
2. **Framework**: Vercel will auto-detect Next.js. Use default build settings (`npm run build`).
3. **Environment Variables**: The app currently uses the config in `src/firebase/config.ts`. If you move these to environment variables, prefix them with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`).

## 🔥 Firebase Setup (REQUIRED)

To make the app functional in production, you **must** configure your Firebase project:

### 1. Enable Authentication
- Go to the [Firebase Console](https://console.firebase.google.com/).
- Navigate to **Build > Authentication**.
- Click the **Sign-in method** tab.
- Enable **Anonymous** (required for the real-time sync between devices).

### 2. Provision Firestore
- Navigate to **Build > Firestore Database**.
- Click **Create Database**.
- Select a location close to your users.
- Start in **Production Mode**.

### 3. Deploy Security Rules
- Copy the content of the `firestore.rules` file in this project.
- Paste it into the **Rules** tab of your Firestore Database in the Firebase Console.
- Click **Publish**.

## 📱 Mobile Usage
- **Control Panel**: Open `/control` on your smartphone.
- **Display Panel**: Open `/display` on a tablet, laptop, or TV.
- **Sync**: Use the QR code or manual ID in the Control Panel to link the screens.
