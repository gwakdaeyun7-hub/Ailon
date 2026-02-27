import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Cpu, BookOpen, Bookmark, User } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

function TabIcon({ Icon, color, focused }: { Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>; color: string; focused: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
      {focused && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: colors.primary,
            marginTop: 4,
          }}
        />
      )}
    </View>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.news'),
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Cpu} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="snaps"
        options={{
          title: t('tab.snaps'),
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={BookOpen} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t('tab.saved'),
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Bookmark} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab.profile'),
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={User} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
