// lib/firebase.js
// @ts-check
import { getApps, initializeApp } from "firebase/app";
import { firebaseConfig as fallbackConfig } from "@/firebase/config";

/** @type {import("firebase/app").FirebaseApp | null} */
let firebaseApp = null;

if (typeof window !== "undefined") {
  // Running in the browser → initialize normally
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? fallbackConfig.apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? fallbackConfig.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? fallbackConfig.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? fallbackConfig.storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? fallbackConfig.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? fallbackConfig.appId,
  };

  const missingKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length) {
    console.error("Firebase configuration is incomplete. Missing keys:", missingKeys.join(", "));
  } else if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }
} else {
  // Running on the server → skip initialization
  console.log("Firebase not initialized on server (SSR).");
}

export default /** @type {import("firebase/app").FirebaseApp | null} */ (firebaseApp);
