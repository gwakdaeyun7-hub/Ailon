import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';
import { getLocales } from 'expo-localization';
import translations, { type Language } from '@/lib/translations';
import { auth, db } from '@/lib/firebase';

const STORAGE_KEY = 'ailon_language';

/** 기본 언어는 항상 영어, 사용자가 수동 변경 시 AsyncStorage에 저장 */
function getSystemLanguage(): Language {
  return 'en';
}

interface LanguageContextValue {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(getSystemLanguage);

  // 저장된 언어 설정 로드 (사용자가 수동 설정한 값이 시스템 감지보다 우선)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'en' || val === 'ko') setLangState(val);
    });
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLangState(newLang);
    AsyncStorage.setItem(STORAGE_KEY, newLang);
    // Firestore에 언어 동기화 (서버 측 이중언어 알림용)
    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, 'users', user.uid), { language: newLang }, { merge: true }).catch(() => {});
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] ?? entry['ko'] ?? key;
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
