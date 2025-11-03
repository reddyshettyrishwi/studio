'use client';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { ReactNode, useState, useEffect } from 'react';
import { FirebaseProvider } from './provider';
import firebaseConfig from './config';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// Initialize Firebase on the client side
if (typeof window !== 'undefined') {
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
}

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [isFirebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    if (firebaseApp) {
      setFirebaseInitialized(true);
    }
  }, []);

  if (!isFirebaseInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
