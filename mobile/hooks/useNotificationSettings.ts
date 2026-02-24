/**
 * 알림 설정 Hook — users/{uid}/preferences/notifications 문서
 * 실시간 동기화 + 기본값 제공
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationSettings {
  newsAlerts: boolean;
  commentReplies: boolean;
  likes: boolean;
}

const DEFAULTS: NotificationSettings = {
  newsAlerts: true,
  commentReplies: true,
  likes: true,
};

export function useNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULTS);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', user.uid, 'preferences', 'notifications');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSettings({
          newsAlerts: d.newsAlerts ?? DEFAULTS.newsAlerts,
          commentReplies: d.commentReplies ?? DEFAULTS.commentReplies,
          likes: d.likes ?? DEFAULTS.likes,
        });
      } else {
        setSettings(DEFAULTS);
      }
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const updateSetting = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid, 'preferences', 'notifications');
      await setDoc(ref, { [key]: value }, { merge: true });
    },
    [user],
  );

  return { settings, loading, updateSetting };
}
