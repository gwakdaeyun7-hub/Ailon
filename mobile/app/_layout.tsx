import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DrawerProvider } from '@/context/DrawerContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { SideDrawer } from '@/components/shared/SideDrawer';
import { useNotifications } from '@/hooks/useNotifications';
import '../global.css';

SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { colors, isDark } = useTheme();
  useNotifications();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
      <SideDrawer />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Lora-Regular': require('../assets/fonts/Lora-Regular.ttf'),
    'Lora-Italic': require('../assets/fonts/Lora-Italic.ttf'),
    'Lora-Bold': require('../assets/fonts/Lora-Bold.ttf'),
    'Lora-BoldItalic': require('../assets/fonts/Lora-BoldItalic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <DrawerProvider>
            <InnerLayout />
          </DrawerProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
