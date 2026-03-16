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
import { LogOut, Bookmark, User as UserIcon, ChevronRight, Globe, Bell, MessageCircle, Heart, Moon, ExternalLink, Shield, FileText } from 'lucide-react-native';
// expo-notifications는 dev build에서만 동작
let Notifications: typeof import('expo-notifications') | null = null;
try { Notifications = require('expo-notifications'); } catch {}
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { cardShadow, FontFamily } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { bookmarks } = useBookmarks(user?.uid ?? null);
  const { lang, setLanguage, t } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <UserIcon size={40} color={colors.textDim} style={{ marginBottom: 16 }} />
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>{t('auth.login_required')}</Text>
          <Text style={{ color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
            {t('auth.login_benefits')}
          </Text>
          <Pressable
            onPress={() => router.push('/auth')}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 16 }}
          >
            <Text style={{ color: colors.card, fontWeight: '700', fontSize: 16 }}>{t('auth.google_login')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800', fontFamily: FontFamily.serifItalic }}>{t('profile.title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Card 1: Avatar + Name + Email (horizontal) */}
        <View style={{ marginHorizontal: 16, marginBottom: 24, backgroundColor: colors.card, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, ...cardShadow }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.card, fontSize: 22, fontWeight: '800' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 4 }}>
              {user.displayName ?? t('profile.user')}
            </Text>
            <Text style={{ color: colors.textDim, fontSize: 14 }}>{user.email}</Text>
          </View>
        </View>

        {/* Card 2: Settings (Language + Dark Mode) */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, ...cardShadow }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', ...(lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 0.5 } : {}), marginBottom: 14 }}>{t('profile.settings')}</Text>
          {/* Language */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Globe size={20} color={colors.textSecondary} />
            <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setLanguage('ko')}
                accessibilityRole="button"
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', minHeight: 44, justifyContent: 'center',
                  backgroundColor: lang === 'ko' ? colors.primary : colors.surface,
                  borderWidth: 1, borderColor: lang === 'ko' ? colors.primary : colors.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: lang === 'ko' ? colors.card : colors.textSecondary }}>한국어</Text>
              </Pressable>
              <Pressable
                onPress={() => setLanguage('en')}
                accessibilityRole="button"
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', minHeight: 44, justifyContent: 'center',
                  backgroundColor: lang === 'en' ? colors.primary : colors.surface,
                  borderWidth: 1, borderColor: lang === 'en' ? colors.primary : colors.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: lang === 'en' ? colors.card : colors.textSecondary }}>English</Text>
              </Pressable>
            </View>
          </View>
          {/* Divider */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginVertical: 16 }} />
          {/* Dark Mode */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Moon size={20} color={colors.textSecondary} />
            <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>{t('profile.dark_mode')}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.switchTrackActive }}
              thumbColor={isDark ? colors.primary : colors.textDim}
              accessibilityLabel={t('profile.dark_mode')}
            />
          </View>
        </View>

        {/* Card 3: Notification Settings */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, ...cardShadow }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', ...(lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 0.5 } : {}), marginBottom: 14 }}>{t('notification.title')}</Text>
          {notifPermission === 'denied' ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <Text style={{ color: colors.textDim, fontSize: 13, textAlign: 'center' }}>{t('notification.denied')}</Text>
              <Pressable
                onPress={() => {
                  if (Platform.OS === 'ios') Linking.openURL('app-settings:');
                  else Linking.openSettings();
                }}
                style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: colors.card, fontWeight: '600', fontSize: 13 }}>{t('notification.open_settings')}</Text>
              </Pressable>
            </View>
          ) : notifPermission === 'undetermined' ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <Text style={{ color: colors.textDim, fontSize: 13, textAlign: 'center' }}>{t('notification.enable_desc')}</Text>
              <Pressable
                onPress={async () => {
                  if (!Notifications) return;
                  const { status } = await Notifications.requestPermissionsAsync();
                  setNotifPermission(status);
                }}
                style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: colors.card, fontWeight: '600', fontSize: 13 }}>{t('notification.enable')}</Text>
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
                  <Icon size={20} color={colors.textSecondary} />
                  <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>{label}</Text>
                  <Switch
                    value={settings[key]}
                    onValueChange={(v) => updateSetting(key, v)}
                    trackColor={{ false: colors.border, true: colors.switchTrackActive }}
                    thumbColor={settings[key] ? colors.primary : colors.textDim}
                    accessibilityLabel={label}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Card 4: Activity + Legal */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, ...cardShadow }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', ...(lang === 'en' ? { textTransform: 'uppercase', letterSpacing: 0.5 } : {}), marginBottom: 14 }}>{t('profile.more')}</Text>
          {/* Activity */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Bookmark size={20} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>{bookmarks.length}</Text>
              <Text style={{ color: colors.textDim, fontSize: 13 }}>{t('profile.saved_bookmarks')}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/saved')}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingVertical: 10, paddingHorizontal: 8 }}
            >
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{t('profile.view')}</Text>
              <ChevronRight size={14} color={colors.primary} />
            </Pressable>
          </View>
          {/* Divider */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginVertical: 12 }} />
          {/* Privacy Policy */}
          <Pressable
            onPress={() => Linking.openURL(
              lang === 'ko'
                ? 'https://gwakdaeyun7-hub.github.io/Ailon/privacy-policy.html'
                : 'https://gwakdaeyun7-hub.github.io/Ailon/privacy-policy-en.html'
            )}
            accessibilityRole="button"
            accessibilityLabel={t('profile.privacy_policy')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingVertical: 6 }}
          >
            <Shield size={20} color={colors.textSecondary} />
            <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>{t('profile.privacy_policy')}</Text>
            <ExternalLink size={14} color={colors.textDim} />
          </Pressable>
          {/* Divider */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginVertical: 4 }} />
          {/* Terms of Service */}
          <Pressable
            onPress={() => Linking.openURL(
              lang === 'ko'
                ? 'https://gwakdaeyun7-hub.github.io/Ailon/terms-of-service.html'
                : 'https://gwakdaeyun7-hub.github.io/Ailon/terms-of-service-en.html'
            )}
            accessibilityRole="button"
            accessibilityLabel={t('profile.terms_of_service')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingVertical: 6 }}
          >
            <FileText size={20} color={colors.textSecondary} />
            <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>{t('profile.terms_of_service')}</Text>
            <ExternalLink size={14} color={colors.textDim} />
          </Pressable>
        </View>

        {/* Sign Out — plain text button */}
        <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            accessibilityRole="button"
            style={{ paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <LogOut size={18} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '600' }}>
              {signingOut ? t('profile.signing_out') : t('profile.signout')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
