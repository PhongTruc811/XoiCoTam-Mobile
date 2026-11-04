/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    accent: '#208AEF',
    onAccent: '#FFFFFF',
    border: '#E0E1E6',
    link: '#3c87f7',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    accent: '#208AEF',
    onAccent: '#FFFFFF',
    border: '#2E3135',
    link: '#3c87f7',
  },
} as const;

export const BrandColors = {
  light: {
    text: '#4A250B',
    background: '#FFFBF2',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F4B41A',
    textSecondary: '#806349',
    accent: '#F4B41A',
    onAccent: '#4A250B',
    border: '#EDDCC3',
    link: '#90500B',
  },
  dark: {
    text: '#FFF3D6',
    background: '#1D140C',
    backgroundElement: '#2C2014',
    backgroundSelected: '#715020',
    textSecondary: '#CEB89B',
    accent: '#F4B41A',
    onAccent: '#4A250B',
    border: '#503B27',
    link: '#F4B41A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
