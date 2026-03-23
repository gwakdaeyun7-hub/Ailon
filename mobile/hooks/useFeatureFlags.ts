/**
 * Feature flags from Firestore app_config/social_features
 * Fetches once on mount, defaults to hide social features
 */

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FeatureFlags {
  showLikeCounts: boolean;
  showComments: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  showLikeCounts: false,
  showComments: false,
};

let cachedFlags: FeatureFlags | null = null;

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(cachedFlags ?? DEFAULT_FLAGS);

  useEffect(() => {
    if (cachedFlags) return;

    const fetchFlags = async () => {
      try {
        const snap = await getDoc(doc(db, 'app_config', 'social_features'));
        if (snap.exists()) {
          const data = snap.data();
          const resolved: FeatureFlags = {
            showLikeCounts: data.show_like_counts ?? DEFAULT_FLAGS.showLikeCounts,
            showComments: data.show_comments ?? DEFAULT_FLAGS.showComments,
          };
          cachedFlags = resolved;
          setFlags(resolved);
        } else {
          cachedFlags = DEFAULT_FLAGS;
        }
      } catch {
        cachedFlags = DEFAULT_FLAGS;
      }
    };

    fetchFlags();
  }, []);

  return flags;
}
