'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = React.useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return initializeFirebase();
    } catch (error) {
      console.error('Failed to initialize Firebase during render', error);
      return null;
    }
  });

  React.useEffect(() => {
    if (services) return;
    if (typeof window === 'undefined') return;
    try {
      const initialized = initializeFirebase();
      setServices(initialized);
    } catch (error) {
      console.error('Failed to initialize Firebase', error);
    }
  }, [services]);

  if (!services) {
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
