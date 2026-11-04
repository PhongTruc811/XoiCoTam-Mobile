import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL, E2E_MOCK_BACKEND } from '@/config/api';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBackendConnection } from '../provider';
import { useRoleSession } from '@/features/session/provider';

const statusLabels = {
  idle: 'Chưa kiểm tra',
  checking: 'Đang kết nối',
  success: 'Đã kết nối',
  error: 'Kết nối thất bại',
} as const;

const statusIcons = { idle: '○', checking: '…', success: '✓', error: '!' } as const;

export function BackendConnectionCard() {
  const { status, message, brandThemeEnabled, checkConnection } = useBackendConnection();
  const { continueFromConnection } = useRoleSession();
  const theme = useTheme();
  const checking = status === 'checking';
  const revealing = status === 'success' && !brandThemeEnabled;
  const buttonLabel = checking
    ? 'Đang kiểm tra…'
    : revealing
      ? 'Đang mở ứng dụng…'
      : brandThemeEnabled
        ? 'Tiếp tục'
    : status === 'idle'
      ? 'Kiểm tra kết nối'
      : status === 'error'
        ? 'Thử lại'
        : 'Kiểm tra lại';

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.heading}>
        <ThemedText type="smallBold">Kết nối máy chủ</ThemedText>
        <ThemedView type="backgroundSelected" style={styles.statusBadge}>
          <ThemedText type="smallBold" accessible={false}>
            {statusIcons[status]}
          </ThemedText>
          <ThemedText type="small">{statusLabels[status]}</ThemedText>
        </ThemedView>
      </View>

      <View style={styles.server}>
        <ThemedText type="code" themeColor="textSecondary">ĐỊA CHỈ MÁY CHỦ</ThemedText>
        <ThemedText testID="connection-target" type="small" selectable style={styles.url}>
          {E2E_MOCK_BACKEND ? 'E2E · Kết nối mô phỏng, không gọi backend' : API_BASE_URL}
        </ThemedText>
      </View>

      <ThemedText
        type="small"
        themeColor="textSecondary"
        accessibilityLiveRegion="polite">
        {message}
      </ThemedText>

      <Pressable
        testID="connection-check"
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityState={{ disabled: checking || revealing, busy: checking || revealing }}
        disabled={checking || revealing}
        onPress={brandThemeEnabled ? continueFromConnection : checkConnection}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.accent },
          (pressed || checking || revealing) && styles.buttonDimmed,
        ]}>
        {(checking || revealing) && <ActivityIndicator size="small" color={theme.onAccent} />}
        <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
          {buttonLabel}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: 20,
    borderWidth: 1,
  },
  heading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  server: {
    gap: Spacing.two,
  },
  url: {
    flexShrink: 1,
  },
  button: {
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  buttonDimmed: {
    opacity: 0.65,
  },
});
