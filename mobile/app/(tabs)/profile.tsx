import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Bookmark, User as UserIcon, ChevronRight, Globe, Bell, MessageCircle, Heart } from 'lucide-react-native';
// expo-notifications는 dev build에서만 동작
let Notifications: typeof import('expo-notifications') | null = null;
try { Notifications = require('expo-notifications'); } catch {}
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'expo-router';
import { Colors } from '@/lib/colors';
import { cardShadow } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { bookmarks } = useBookmarks(user?.uid ?? null);
  const { lang, setLanguage, t } = useLanguage();
  const { settings, updateSetting } = useNotificationSettings();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('undetermined');

  useEffect(() => {
    Notifications?.getPermissionsAsync().then(({ status }) => setNotifPermission(status));
  }, []);

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'AI';

  const handleSignOut = () => {
    Alert.alert(t('profile.signout'), t('profile.signout_confirm'), [
      { text: t('profile.signout_cancel'), style: 'cancel' },
      {
        text: t('profile.signout'),
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } catch {
            Alert.alert(t('profile.error'), t('profile.signout_error'));
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <UserIcon size={32} color="#E53935" />
          </View>
          <Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>{t('auth.login_required')}</Text>
          <Text style={{ color: Colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
            {t('auth.login_benefits')}
          </Text>
          <Pressable
            onPress={() => router.push('/auth')}
            style={{ backgroundColor: Colors.primary, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 16 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>{t('auth.google_login')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ color: Colors.textPrimary, fontSize: 24, fontWeight: '800' }}>{t('profile.title')}</Text>
        <View style={{ width: 40, height: 3, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 12 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + Info */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 20, padding: 20, alignItems: 'center', ...cardShadow }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800' }}>{initials}</Text>
          </View>
          <Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 4 }}>
            {user.displayName ?? t('profile.user')}
          </Text>
          <Text style={{ color: Colors.textDim, fontSize: 14 }}>{user.email}</Text>
        </View>

        {/* Language Selection */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 20, padding: 20, ...cardShadow }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>{t('profile.language')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8EAF6', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={18} color="#5C6BC0" />
            </View>
            <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setLanguage('ko')}
                accessibilityRole="button"
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                  backgroundColor: lang === 'ko' ? Colors.primary : Colors.surface,
                  borderWidth: 1, borderColor: lang === 'ko' ? Colors.primary : Colors.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: lang === 'ko' ? '#FFFFFF' : '#757575' }}>한국어</Text>
              </Pressable>
              <Pressable
                onPress={() => setLanguage('en')}
                accessibilityRole="button"
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                  backgroundColor: lang === 'en' ? Colors.primary : Colors.surface,
                  borderWidth: 1, borderColor: lang === 'en' ? Colors.primary : Colors.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: lang === 'en' ? '#FFFFFF' : '#757575' }}>English</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 20, padding: 20, ...cardShadow }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>{t('notification.title')}</Text>
          {notifPermission === 'denied' ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <Text style={{ color: Colors.textDim, fontSize: 13, textAlign: 'center' }}>{t('notification.denied')}</Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS === 'ios') Linking.openURL('app-settings:');
                  else Linking.openSettings();
                }}
                style={{ backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>{t('notification.open_settings')}</Text>
              </Pressable>
            </View>
          ) : notifPermission === 'undetermined' ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <Text style={{ color: Colors.textDim, fontSize: 13, textAlign: 'center' }}>{t('notification.enable_desc')}</Text>
              <Pressable
                onPress={async () => {
                  if (!Notifications) return;
                  const { status } = await Notifications.requestPermissionsAsync();
                  setNotifPermission(status);
                }}
                style={{ backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>{t('notification.enable')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {([
                { key: 'newsAlerts' as const, icon: Bell, label: t('notification.news_alerts') },
                { key: 'commentReplies' as const, icon: MessageCircle, label: t('notification.comment_replies') },
                { key: 'likes' as const, icon: Heart, label: t('notification.likes') },
              ]).map(({ key, icon: Icon, label }) => (
                <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color="#FF9800" />
                  </View>
                  <Text style={{ flex: 1, color: Colors.textPrimary, fontSize: 15, fontWeight: '600' }}>{label}</Text>
                  <Switch
                    value={settings[key]}
                    onValueChange={(v) => updateSetting(key, v)}
                    trackColor={{ false: Colors.border, true: '#FFCCBC' }}
                    thumbColor={settings[key] ? Colors.primary : Colors.textDim}
                    accessibilityLabel={label}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: Colors.card, borderRadius: 20, padding: 20, ...cardShadow }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>{t('profile.activity')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Bookmark size={18} color="#E53935" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{bookmarks.length}</Text>
              <Text style={{ color: Colors.textDim, fontSize: 13 }}>{t('profile.saved_bookmarks')}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/saved')}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>{t('profile.view')}</Text>
              <ChevronRight size={14} color="#E53935" />
            </Pressable>
          </View>
        </View>

        {/* Sign Out */}
        <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            accessibilityRole="button"
            style={{ backgroundColor: Colors.card, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, ...cardShadow, borderWidth: 1, borderColor: '#FFCDD2' }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={16} color="#E53935" />
            </View>
            <Text style={{ color: Colors.primary, fontSize: 15, fontWeight: '700', flex: 1 }}>
              {signingOut ? t('profile.signing_out') : t('profile.signout')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
