/**
 * EditProfileModal — 프로필 편집 모달 (닉네임 + 프로필 사진)
 * profile.tsx에서 분리된 컴포넌트
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Camera, X, Trash2 } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { MIN_TOUCH_TARGET } from '@/lib/theme';

let ImagePicker: typeof import('expo-image-picker') | null = null;
try { ImagePicker = require('expo-image-picker'); } catch {}

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (updates: { displayName?: string; photoURI?: string }) => Promise<void>;
  currentName: string;
  currentPhotoURL: string | null;
}

export default function EditProfileModal({
  visible,
  onClose,
  onSave,
  currentName,
  currentPhotoURL,
}: EditProfileModalProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  const [name, setName] = useState(currentName);
  const [photoURI, setPhotoURI] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhotoURL);
  const [saving, setSaving] = useState(false);

  // 모달 열릴 때 현재 값으로 초기화
  useEffect(() => {
    if (visible) {
      setName(currentName);
      setPhotoURI(null);
      setPhotoPreview(currentPhotoURL);
    }
  }, [visible, currentName, currentPhotoURL]);

  const pickImage = useCallback(async () => {
    if (!ImagePicker) {
      Alert.alert('Error', 'Image picker is not available');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('profile.error'),
        Platform.OS === 'ios'
          ? 'Please allow photo access in Settings.'
          : 'Photo access permission is required.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoURI(result.assets[0].uri);
      setPhotoPreview(result.assets[0].uri);
    }
  }, [t]);

  const handleRemovePhoto = useCallback(() => {
    setPhotoURI(null);
    setPhotoPreview(null);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert(t('profile.error'), t('profile.edit_name_empty'));
      return;
    }

    setSaving(true);
    try {
      const updates: { displayName?: string; photoURI?: string } = {};

      if (trimmedName !== currentName) {
        updates.displayName = trimmedName;
      }
      if (photoURI) {
        updates.photoURI = photoURI;
      }

      if (Object.keys(updates).length > 0) {
        await onSave(updates);
      }

      Alert.alert('', t('profile.edit_success'));
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(t('profile.error'), t('profile.edit_error'));
    } finally {
      setSaving(false);
    }
  }, [name, currentName, photoURI, onSave, onClose, t]);

  const initials = currentName
    ? currentName.slice(0, 2).toUpperCase()
    : 'AI';

  const hasChanges = name.trim() !== currentName || photoURI !== null || (photoPreview === null && currentPhotoURL !== null);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.bg }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: Platform.OS === 'ios' ? 16 : 24,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('profile.edit_cancel')}
            style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, alignItems: 'flex-start', justifyContent: 'center' }}
          >
            <X size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }}>
            {t('profile.edit')}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={saving || !hasChanges}
            accessibilityRole="button"
            style={{
              minWidth: MIN_TOUCH_TARGET,
              minHeight: MIN_TOUCH_TARGET,
              alignItems: 'flex-end',
              justifyContent: 'center',
              opacity: saving || !hasChanges ? 0.4 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>
                {t('profile.edit_save')}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' }}>
          {/* Avatar */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ position: 'relative' }}>
              {photoPreview ? (
                <Image
                  source={{ uri: photoPreview }}
                  style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface }}
                />
              ) : (
                <View style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: colors.card, fontSize: 32, fontWeight: '800' }}>{initials}</Text>
                </View>
              )}
              {/* Camera badge */}
              <Pressable
                onPress={pickImage}
                accessibilityRole="button"
                accessibilityLabel={t('profile.edit_photo')}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.bg,
                }}
              >
                <Camera size={16} color={colors.card} />
              </Pressable>
            </View>

            {/* Photo action buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <Pressable
                onPress={pickImage}
                accessibilityRole="button"
                style={{
                  minHeight: MIN_TOUCH_TARGET,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                  {t('profile.edit_photo')}
                </Text>
              </Pressable>
              {photoPreview && (
                <Pressable
                  onPress={handleRemovePhoto}
                  accessibilityRole="button"
                  style={{
                    minHeight: MIN_TOUCH_TARGET,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={14} color={colors.textDim} />
                  <Text style={{ color: colors.textDim, fontSize: 14, fontWeight: '600' }}>
                    {t('profile.edit_photo_remove')}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Nickname input */}
          <View style={{ width: '100%' }}>
            <Text style={{
              color: colors.textSecondary,
              fontSize: 13,
              fontWeight: '600',
              marginBottom: 8,
            }}>
              {t('profile.edit_nickname')}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('profile.edit_nickname_placeholder')}
              placeholderTextColor={colors.placeholder}
              maxLength={30}
              autoFocus
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <Text style={{
              color: colors.textDim,
              fontSize: 12,
              marginTop: 6,
              textAlign: 'right',
            }}>
              {name.length}/30
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
