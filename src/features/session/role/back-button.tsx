import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function BackButton({ onPress, label = 'Quay lại', compact = false, testID }: { onPress: () => void; label?: string; compact?: boolean; testID?: string }) {
  const theme = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, compact && styles.compact, {
        borderColor: theme.border,
        backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
        opacity: pressed ? 0.82 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      }]}>
      <ThemedText accessible={false} style={[styles.chevron, { color: theme.text }]}>‹</ThemedText>
      {!compact && <ThemedText type="smallBold">{label}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 12, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  compact: { width: 44, height: 44, paddingHorizontal: 0 },
  chevron: { fontSize: 32, lineHeight: 36, marginTop: -3 },
});
