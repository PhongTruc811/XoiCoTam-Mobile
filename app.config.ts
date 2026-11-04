import type { ConfigContext, ExpoConfig } from 'expo/config';

// Keep the simulator test build separate from the regular app on the device.
export default function configureApp({ config }: ConfigContext): ExpoConfig {
  const base = { ...config, name: config.name ?? 'XoiCoTam', slug: config.slug ?? 'XoiCoTam' };
  if (process.env.EXPO_PUBLIC_E2E_MOCK_BACKEND !== 'true') return base;
  return {
    ...base,
    name: 'XoiCoTam E2E',
    scheme: 'xoicotam-e2e',
    ios: { ...base.ios, bundleIdentifier: 'com.xoicotam.mobile.e2e' },
  };
}
