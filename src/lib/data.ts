
'use client';

import type { Influencer, Campaign, PendingUser, User } from './types';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  addDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Timestamp,
  Firestore,
} from 'firebase/firestore';

// Note: The original in-memory data has been removed.
// The app will now fetch and update data from Firestore.

// =================================================================
// These functions are placeholders and will be replaced by
// real-time Firestore hooks in the components.
// =================================================================

export const getInfluencers = async (db: Firestore): Promise<Influencer[]> => {
  const influencersCol = collection(db, 'influencers');
  const snapshot = await getDocs(influencersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Influencer));
};

export const getCampaigns = async (db: Firestore): Promise<Campaign[]> => {
  const campaignsCol = collection(db, 'campaigns');
  const snapshot = await getDocs(campaignsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
};

// =================================================================
// User Management Functions
// =================================================================

export const addUser = async (db: Firestore, user: User) => {
  const userRef = doc(db, 'users', user.id);
  
  // Check if user already exists
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    // In a real app, you might merge data, but here we just prevent overwriting to be safe.
    // Or, if sign-up is the only entry point for new users, this might indicate an error.
    console.warn("User document already exists, not overwriting.");
    return;
  }

  const newUser: Omit<User, 'id'> = {
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role,
    status: user.role === 'Admin' ? 'Approved' : user.status,
  };

  await setDoc(userRef, newUser);
  return { id: user.id, ...newUser } as User;
};

export const findUserByEmail = async (db: Firestore, email: string): Promise<User | undefined> => {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return undefined;
    }
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
};


export const findUserByCredentials = async (db: Firestore, email: string, password?: string): Promise<User | undefined> => {
  const user = await findUserByEmail(db, email);
  if (!user) return undefined;

  // This is an insecure password check. In a real app, use Firebase Auth.
  if (password && user.password && user.password === password) {
    return user;
  }
  // If no password is provided (e.g., Google Sign-In), just return the user found by email.
  if (!password) {
      return user;
  }

  return undefined;
};


export const getPendingUsers = (db: Firestore, callback: (users: PendingUser[]) => void) => {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where("status", "==", "Pending"));
    
    return onSnapshot(q, (snapshot) => {
        const pendingUsers = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                role: data.role,
                status: 'Pending'
            } as PendingUser
        });
        callback(pendingUsers);
    });
};

export const approveUser = async (db: Firestore, userId: string) => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { status: 'Approved' }, { merge: true });
};

export const rejectUser = async (db: Firestore, userId: string) => {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
};

export const isUserApproved = async (db: Firestore, email: string): Promise<boolean> => {
    const user = await findUserByEmail(db, email);
    return user?.status === 'Approved';
};

// =================================================================
// Influencer and Campaign Management
// =================================================================

export const addInfluencer = async (db: Firestore, influencerData: Omit<Influencer, 'id' | 'avatar'>) => {
  const influencerToAdd = {
    ...influencerData,
    avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, "influencers"), influencerToAdd);
  return { id: docRef.id, ...influencerToAdd } as Influencer;
};

export const logCampaign = async (db: Firestore, campaignData: Omit<Campaign, 'id'>) => {
  const campaignToAdd = {
    ...campaignData,
    date: Timestamp.fromDate(new Date(campaignData.date)),
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, "campaigns"), campaignToAdd);
  return { id: docRef.id, ...campaignToAdd } as Campaign;
};

export const updateCampaignStatus = async (db: Firestore, campaignId: string, status: string) => {
  const campaignRef = doc(db, 'campaigns', campaignId);
  await setDoc(campaignRef, { approvalStatus: status }, { merge: true });
};
