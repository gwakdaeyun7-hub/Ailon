import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DrawerProvider } from '@/context/DrawerContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { SideDrawer } from '@/components/shared/SideDrawer';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <DrawerProvider>
          <StatusBar style="dark" translucent />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAFAFA' } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
          </Stack>
          <SideDrawer />
        </DrawerProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
