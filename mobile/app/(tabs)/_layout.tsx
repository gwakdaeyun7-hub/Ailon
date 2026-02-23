import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Cpu, BookOpen, FlaskConical, Bookmark, User } from 'lucide-react-native';

function TabIcon({ Icon, color, focused }: { Icon: any; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
      {focused && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: '#E53935',
            marginTop: 4,
          }}
        />
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0F0F0',
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: '#E53935',
        tabBarInactiveTintColor: '#BDBDBD',
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
          title: 'AI 트렌드',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Cpu} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="snaps"
        options={{
          title: '학문 스낵',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={BookOpen} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: '시너지 랩',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={FlaskConical} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: '저장',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Bookmark} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={User} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
