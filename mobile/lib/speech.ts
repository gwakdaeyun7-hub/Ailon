/**
 * expo-speech wrapper — Expo Go에서는 네이티브 모듈 없음
 * dev build에서만 TTS 작동, Expo Go에서는 graceful fallback
 */
let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch {}
export default Speech;
