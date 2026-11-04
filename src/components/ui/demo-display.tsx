import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function Copy({ children, muted = false, large = false, testID }: PropsWithChildren<{ muted?: boolean; large?: boolean; testID?: string }>) {
  return <ThemedText testID={testID} type={large ? 'subtitle' : 'small'} themeColor={muted ? 'textSecondary' : 'text'} style={large && displayStyles.title}>{children}</ThemedText>;
}

export function Badge({ label }: { label: string }) {
  const theme = useTheme();
  return <View style={[displayStyles.badge, { backgroundColor: theme.backgroundSelected }]}><ThemedText type="smallBold" style={displayStyles.badgeText}>{label}</ThemedText></View>;
}

const displayStyles = StyleSheet.create({
  title: { fontSize: 26, lineHeight: 34, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 12, lineHeight: 18 },
});
