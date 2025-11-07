
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
  or,
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

export const addUser = async (db: Firestore, user: Omit<User, 'password'>) => {
    const userRef = doc(db, 'users', user.id);
    
    // For admins, status is always 'Approved'. For others, it's what's passed or defaults to 'Pending'.
    const status = user.role === 'Admin' ? 'Approved' : (user.status || 'Pending');

    const newUser: Partial<User> = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: status,
        mobile: user.mobile,
        pan: user.pan,
    };

    await setDoc(userRef, newUser, { merge: true }); // Use merge to avoid overwriting if doc exists
    return { id: user.id, ...newUser } as User;
};

export const findUserByEmail = async (db: Firestore, email: string): Promise<User | undefined> => {
    if (!email) return undefined;
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return undefined;
    }
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
};

export const findUserByMobileOrPan = async (db: Firestore, mobile: string, pan: string): Promise<User | undefined> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, or(where('mobile', '==', mobile), where('pan', '==', pan)));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return undefined;
    }
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
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
    }, (error) => {
        console.error("Error fetching pending users:", error);
        callback([]);
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

// =================================================================
// Influencer and Campaign Management
// =================================================================

export const addInfluencer = async (db: Firestore, influencerData: Omit<Influencer, 'id' | 'avatar'>) => {
  const { mobile, pan } = influencerData;
  const influencersRef = collection(db, "influencers");

  // Check for duplicate mobile or PAN
  const duplicateQuery = query(influencersRef, or(where("mobile", "==", mobile), where("pan", "==", pan)));
  const duplicateSnapshot = await getDocs(duplicateQuery);

  if (!duplicateSnapshot.empty) {
      const existingDoc = duplicateSnapshot.docs[0].data();
      if (existingDoc.mobile === mobile) {
          throw new Error("An influencer with this mobile number already exists.");
      }
      if (existingDoc.pan === pan) {
          throw new Error("An influencer with this PAN ID already exists.");
      }
  }
  
  // If no duplicates, add the new influencer
  const influencerToAdd = {
    ...influencerData,
    avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, "influencers"), influencerToAdd);
  return { id: docRef.id, ...influencerToAdd } as Influencer;
};

export const deleteInfluencer = async (db: Firestore, influencerId: string) => {
    const influencerRef = doc(db, 'influencers', influencerId);
    await deleteDoc(influencerRef);
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