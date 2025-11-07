
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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

export const addUser = (db: Firestore, user: Omit<User, 'password'>) => {
    const userRef = doc(db, 'users', user.id);
    
    const status = user.role === 'Admin' ? 'Approved' : (user.status || 'Pending');

    const newUser: Partial<User> = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: status,
        mobile: user.mobile,
        pan: user.pan,
    };

    setDoc(userRef, newUser, { merge: true }).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: newUser,
        })
      );
    });
};

export const findUserByEmail = async (db: Firestore, email: string): Promise<User | undefined> => {
    if (!email) return undefined;
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where("email", "==", email));
    try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return undefined;
        }
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: 'users',
              operation: 'list',
            })
        );
        throw error; // Re-throw so the caller knows it failed
    }
};

export const findUserByMobileOrPan = async (db: Firestore, mobile: string, pan: string): Promise<User | undefined> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, or(where('mobile', '==', mobile), where('pan', '==', pan)));
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return undefined;
        }
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
         errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: 'users',
              operation: 'list',
            })
        );
        throw error; // Re-throw so the caller knows it failed
    }
};


export const approveUser = (db: Firestore, userId: string) => {
    const userRef = doc(db, 'users', userId);
    setDoc(userRef, { status: 'Approved' }, { merge: true }).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { status: 'Approved' },
        })
      );
    });
};

export const rejectUser = (db: Firestore, userId: string) => {
    const userRef = doc(db, 'users', userId);
    deleteDoc(userRef).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: userRef.path,
          operation: 'delete',
        })
      );
    });
};

// =================================================================
// Influencer and Campaign Management
// =================================================================

export const addInfluencer = async (db: Firestore, influencerData: Omit<Influencer, 'id' | 'avatar'>) => {
  const { mobile, pan } = influencerData;
  const influencersRef = collection(db, "influencers");

  // Check for duplicate mobile or PAN
  const duplicateQuery = query(influencersRef, or(where("mobile", "==", mobile), where("pan", "==", pan)));

  try {
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
  } catch (error) {
     errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: 'influencers',
          operation: 'list'
        })
    );
    // Re-throw a more user-friendly error or the original, depending on desired UX
    throw new Error("Could not verify influencer uniqueness. Please check permissions.");
  }
  
  // If no duplicates, add the new influencer
  const influencerToAdd = {
    ...influencerData,
    avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
    createdAt: Timestamp.now(),
  };

  addDoc(collection(db, "influencers"), influencerToAdd).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: 'influencers',
          operation: 'create',
          requestResourceData: influencerToAdd,
        })
      );
  });
};

export const deleteInfluencer = (db: Firestore, influencerId: string) => {
    const influencerRef = doc(db, 'influencers', influencerId);
    deleteDoc(influencerRef).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: influencerRef.path,
          operation: 'delete',
        })
      );
    });
};

export const logCampaign = (db: Firestore, campaignData: Omit<Campaign, 'id'>) => {
  const campaignToAdd = {
    ...campaignData,
    date: Timestamp.fromDate(new Date(campaignData.date)),
    createdAt: Timestamp.now(),
  };
  addDoc(collection(db, "campaigns"), campaignToAdd).catch(error => {
    errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: 'campaigns',
          operation: 'create',
          requestResourceData: campaignToAdd,
        })
      );
  });
};

export const updateCampaignStatus = (db: Firestore, campaignId: string, status: string) => {
  const campaignRef = doc(db, 'campaigns', campaignId);
  setDoc(campaignRef, { approvalStatus: status }, { merge: true }).catch(error => {
    errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: campaignRef.path,
          operation: 'update',
          requestResourceData: { approvalStatus: status },
        })
      );
  });
};
