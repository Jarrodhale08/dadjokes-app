/**
 * Auth Initialization Hook
 *
 * Initialize Supabase auth on app startup.
 * Use this in _layout.tsx to restore session and listen for auth changes.
 */

import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';

export function useAuthInit() {
  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const loadFromCloud = useAppStore((state) => state.loadFromCloud);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Load cloud data when authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadFromCloud();
    }
  }, [isInitialized, isAuthenticated, loadFromCloud]);

  return { isInitialized, isAuthenticated };
}

export default useAuthInit;
