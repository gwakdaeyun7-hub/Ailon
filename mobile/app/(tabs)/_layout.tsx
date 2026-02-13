import { Tabs } from 'expo-router';
import { Newspaper, BookOpen, Lightbulb } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#2e2e2e',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#555555',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'AI 트렌드',
          tabBarIcon: ({ color, size }) => <Newspaper size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="snaps"
        options={{
          title: '학문 스낵',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: '시너지 랩',
          tabBarIcon: ({ color, size }) => <Lightbulb size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
