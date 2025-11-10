
'use client';

import type { Influencer, Campaign, CampaignCompletion, User } from './types';
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

export const upsertUser = (db: Firestore, user: User) => {
    const userRef = doc(db, 'users', user.id);
    
    setDoc(userRef, user, { merge: true }).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: userRef.path,
          operation: 'write',
          requestResourceData: user,
        })
      );
    });
};

export const getUserProfile = async (db: Firestore, userId: string): Promise<User | undefined> => {
    if (!userId) return undefined;
    const userRef = doc(db, 'users', userId);
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as User;
        }
        return undefined;
    } catch (error) {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: userRef.path,
              operation: 'get',
            })
        );
        throw error;
    }
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
     if (error instanceof Error && (error.message.includes("mobile number") || error.message.includes("PAN ID"))) {
        throw error;
     }
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

export const completeCampaign = (
  db: Firestore,
  campaignId: string,
  completion: Omit<CampaignCompletion, 'reportedAt'>
) => {
  const campaignRef = doc(db, 'campaigns', campaignId);
  const payload = {
    approvalStatus: 'Completed',
    completionDetails: {
      ...completion,
      reportedAt: Timestamp.now(),
    },
  };

  setDoc(campaignRef, payload, { merge: true }).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: campaignRef.path,
        operation: 'update',
        requestResourceData: payload,
      })
    );
  });
};
