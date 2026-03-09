
"use client";

import { useCallback, useMemo } from 'react';
import { doc, serverTimestamp } from 'firebase/firestore';
import { 
  useFirestore, 
  useDoc, 
  useMemoFirebase, 
  updateDocumentNonBlocking,
  useUser,
  setDocumentNonBlocking
} from '@/firebase';
import { AppState, INITIAL_STATE, SessionState } from '@/lib/types';

export function useRemoteState(sessionId: string | null) {
  const firestore = useFirestore();
  const { user } = useUser();

  const sessionRef = useMemoFirebase(() => {
    if (!firestore || !sessionId) return null;
    return doc(firestore, 'sessions', sessionId);
  }, [firestore, sessionId]);

  const { data: sessionDoc, isLoading } = useDoc<any>(sessionRef);

  // Map Firestore doc to AppState
  const state: AppState = useMemo(() => {
    if (!sessionDoc) return INITIAL_STATE;
    return {
      currentQuestionIndex: sessionDoc.currentQuestionIndex ?? 0,
      status: (sessionDoc.status as SessionState) ?? 'IDLE',
      selectedOption: sessionDoc.selectedOption ?? null,
      timerEndAt: sessionDoc.timerEndAt ?? null,
      answeredIndices: sessionDoc.answeredIndices ?? [],
      skippedIndices: sessionDoc.skippedIndices ?? [],
      lastUpdate: sessionDoc.updatedAt?.toMillis?.() || Date.now(),
    };
  }, [sessionDoc]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    if (!sessionRef) return;

    // Map AppState updates back to Firestore fields
    const firestoreUpdates: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    updateDocumentNonBlocking(sessionRef, firestoreUpdates);
  }, [sessionRef]);

  const initializeSession = useCallback(() => {
    if (!sessionRef || !user) return;
    
    const initialData = {
      ...INITIAL_STATE,
      controlPanelUid: user.uid,
      displayPanelUid: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    setDocumentNonBlocking(sessionRef, initialData, { merge: true });
  }, [sessionRef, user]);

  const resetState = useCallback(() => {
    if (!sessionRef) return;
    updateDocumentNonBlocking(sessionRef, {
      ...INITIAL_STATE,
      updatedAt: serverTimestamp(),
    });
  }, [sessionRef]);

  return { state, updateState, resetState, initializeSession, isLoading, sessionExists: !!sessionDoc };
}
