import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BackendConnectionProvider, useBackendConnection } from '@/features/be-connection/provider';
import { OrderDemoProvider } from '@/features/order/provider';
import { entryScreens } from '@/features/session/navigation';
import { RoleSessionProvider, useRoleSession } from '@/features/session/provider';
import { EmployeePinModal } from '@/features/session/role/employee-pin-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const colorScheme = useColorScheme();
  const colors = useTheme();
  const { brandThemeEnabled } = useBackendConnection();
  const { activeScreen } = useRoleSession();
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = brandThemeEnabled
    ? {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          primary: colors.accent,
          background: colors.background,
          card: colors.backgroundElement,
          text: colors.text,
          border: colors.border,
        },
      }
    : baseTheme;

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false, animation: 'none' }}>
        {entryScreens.map(name => (
          <Stack.Protected key={name} guard={activeScreen === name}>
            <Stack.Screen name={name} />
          </Stack.Protected>
        ))}
      </Stack>
      <EmployeePinModal />
      <AnimatedSplashOverlay />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <BackendConnectionProvider>
      <RoleSessionProvider>
        <OrderDemoProvider>
          <AppNavigator />
        </OrderDemoProvider>
      </RoleSessionProvider>
    </BackendConnectionProvider>
    </GestureHandlerRootView>
  );
}
