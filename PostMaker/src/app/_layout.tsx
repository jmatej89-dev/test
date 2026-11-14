import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RenderProvider, useRender } from '../render/RenderContext';
import { useStore } from '../store/projects';
import { useReduceMotion } from '../ui/a11y';
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: UI.bg }}>
      <SafeAreaProvider>
        <RenderProvider>
          <StatusBar style="light" />
          <Gate />
        </RenderProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
