"use client";

import { useState, useEffect, useCallback } from 'react';
import { AppState, INITIAL_STATE } from '@/lib/types';

const STORAGE_KEY = 'remote_display_link_state';

export function useRemoteState() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  // Sync state from LocalStorage (Simulating a real-time DB for the sake of the environment)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };

    const initial = localStorage.getItem(STORAGE_KEY);
    if (initial) {
      setState(JSON.parse(initial));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
    }

    window.addEventListener('storage', handleStorageChange);
    
    // Interval check for cross-tab sync in some browsers that don't trigger storage on same page
    const interval = setInterval(() => {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) {
        const parsed = JSON.parse(current);
        // Using a timestamp to avoid unnecessary state updates if nothing changed
        setState(prev => prev.lastUpdate === parsed.lastUpdate ? prev : parsed);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => {
      const newState = { 
        ...prev, 
        ...updates, 
        lastUpdate: Date.now() 
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const resetState = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
    setState(INITIAL_STATE);
  }, []);

  return { state, updateState, resetState };
}