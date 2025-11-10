// lib/firebase.js
// @ts-check
import { getApps, initializeApp } from "firebase/app";

/** @type {import("firebase/app").FirebaseApp | null} */
let firebaseApp = null;

if (typeof window !== "undefined") {
  // Running in the browser → initialize normally
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }
} else {
  // Running on the server → skip initialization
  console.log("Firebase not initialized on server (SSR).");
}

export default /** @type {import("firebase/app").FirebaseApp | null} */ (firebaseApp);
