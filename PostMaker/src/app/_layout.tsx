import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { SafeAreaInsetsContext, SafeAreaProvider } from 'react-native-safe-area-context';
import { RenderProvider, useRender } from '../render/RenderContext';
import { useStore } from '../store/projects';
import { useReduceMotion } from '../ui/a11y';
import { DialogHost } from '../ui/dialog';
import { UI } from '../ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(UI.bg).catch(() => {});

function Gate() {
  const ready = useRender();
  const hydrated = useStore((s) => s.hydrated);
  const reduceMotion = useReduceMotion();
  useEffect(() => {
    if (ready && hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [ready, hydrated]);
  if (!ready || !hydrated) return null;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: UI.bg },
        animation: reduceMotion ? 'fade' : 'default',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="editor/[id]" />
      <Stack.Screen name="caption/[id]" options={{ presentation: 'modal', animation: reduceMotion ? 'fade' : 'slide_from_bottom' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal', animation: reduceMotion ? 'fade' : 'slide_from_bottom' }} />
      <Stack.Screen name="debug" />
    </Stack>
  );
}

const ZERO = { top: 0, bottom: 0, left: 0, right: 0 };

function WebInsets({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return <SafeAreaInsetsContext.Provider value={ZERO}>{children}</SafeAreaInsetsContext.Provider>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: UI.bg }}>
      <SafeAreaProvider>
        {/* On the web page the host already pads the safe areas, so the app must not add them again. */}
        <WebInsets>
          <RenderProvider>
            <StatusBar style="light" />
            <Gate />
            <DialogHost />
          </RenderProvider>
        </WebInsets>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
