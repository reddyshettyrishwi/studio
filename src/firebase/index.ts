'use client';

import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '../../lib/firebase';

type FirebaseServices = {
  firebaseApp: FirebaseApp;
  auth: ReturnType<typeof getAuth>;
  firestore: ReturnType<typeof getFirestore>;
};

let cachedServices: FirebaseServices | null = null;

export function initializeFirebase(): FirebaseServices {
  if (typeof window === 'undefined') {
    throw new Error('initializeFirebase can only run in the browser environment.');
  }

  const app = (firebaseApp as FirebaseApp | null) ?? null;

  if (!app) {
    throw new Error('Firebase app has not been initialized. Check your environment configuration.');
  }

  if (!cachedServices) {
    cachedServices = getSdks(app);
  }

  return cachedServices;
}

export function getSdks(firebaseApp: FirebaseApp): FirebaseServices {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
