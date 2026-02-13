/**
 * 사용자 설정 관리 Hook
 * users/{userId}/preferences/main 문서에서 설정을 관리합니다.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type { NewsCategory } from '@/lib/types';

export interface UserPreferences {
  newsCategories: NewsCategory[];
  disciplines: string[];
  notificationsEnabled: boolean;
  onboardingCompleted: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  newsCategories: ['models_architecture', 'agentic_reality', 'opensource_code', 'physical_ai', 'policy_safety'],
  disciplines: [],
  notificationsEnabled: false,
  onboardingCompleted: false,
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      return;
    }

    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const prefRef = doc(db, 'users', user.uid, 'preferences', 'main');
        const prefDoc = await getDoc(prefRef);

        if (prefDoc.exists()) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...prefDoc.data() } as UserPreferences);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      if (!user) return;

      const newPrefs = { ...preferences, ...updates };
      setPreferences(newPrefs);

      try {
        const prefRef = doc(db, 'users', user.uid, 'preferences', 'main');
        await setDoc(prefRef, newPrefs, { merge: true });
      } catch (error) {
        console.error('Error updating preferences:', error);
        setPreferences(preferences); // rollback
      }
    },
    [user, preferences]
  );

  return { preferences, updatePreferences, loading };
}
