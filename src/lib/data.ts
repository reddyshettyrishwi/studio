
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

export const addUser = async (db: Firestore, user: Omit<User, 'id'>) => {
  const usersCol = collection(db, 'users');
  
  // Check if user already exists
  const q = query(usersCol, where("email", "==", user.email));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    throw new Error("An account with this email already exists.");
  }

  const newUserRef = doc(collection(db, "users"));
  
  const newUser: User = {
    id: newUserRef.id,
    name: user.name,
    email: user.email,
    password: user.password, // In a real app, this should be hashed.
    role: user.role,
    status: user.role === 'Admin' ? 'Approved' : 'Pending',
  };

  await setDoc(newUserRef, newUser);
  return newUser;
};

export const findUserByCredentials = async (db: Firestore, email: string, password?: string): Promise<User | undefined> => {
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return undefined;
  }
  
  const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;

  if (password && user.password !== password) {
      return undefined;
  }

  return user;
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
    const user = await findUserByCredentials(db, email);
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
