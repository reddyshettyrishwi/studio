// src/lib/firebase-client.ts
// Safe wrappers to access Firebase client SDK only in the browser.
//
// IMPORTANT: This file must NOT call initializeApp().
// It uses the firebase app exported from /lib/firebase.js which
// only initializes on the client (window !== undefined).

import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import the app you already created (lib/firebase.js at repo root)
import firebaseApp from "../../lib/firebase";

/**
 * Return a browser-only Auth instance, or null during SSR.
 */
export function getAuthSafe() {
  if (typeof window === "undefined" || !firebaseApp) return null;
  // firebaseApp is typed as any (from JS file). Force-cast to FirebaseApp.
  return getAuth(firebaseApp as FirebaseApp);
}

/**
 * Return a browser-only Firestore instance, or null during SSR.
 */
export function getFirestoreSafe() {
  if (typeof window === "undefined" || !firebaseApp) return null;
  return getFirestore(firebaseApp as FirebaseApp);
}
