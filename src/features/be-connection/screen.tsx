import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { BackendConnectionCard } from './components/backend-connection-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useBackendConnection } from './provider';

export function ConnectionScreen() {
  const { status, brandThemeEnabled } = useBackendConnection();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.heroSection}>
            <AnimatedIcon />
            <ThemedText type="subtitle" style={styles.title}>Xôi Cô Tấm</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.title}>
              Kiểm tra kết nối cửa hàng để tiếp tục.
            </ThemedText>
          </ThemedView>
          <BackendConnectionCard />
        </ScrollView>
        {status === 'success' && !brandThemeEnabled && (
          <View style={styles.successBackdrop} accessibilityLiveRegion="assertive">
            <View style={styles.successPopup} accessible accessibilityLabel="Kết nối thành công">
              <ThemedText style={styles.successCheck}>✓</ThemedText>
              <ThemedText type="subtitle" style={styles.successTitle}>Kết nối thành công!</ThemedText>
              <ThemedText type="small" style={styles.successTitle}>Đang chuẩn bị giao diện cho bạn…</ThemedText>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth, paddingHorizontal: Spacing.four },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, gap: Spacing.four, paddingBottom: Spacing.four },
  heroSection: { flexGrow: 1, minHeight: 260, paddingVertical: Spacing.five, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  title: { textAlign: 'center' },
  successBackdrop: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', padding: 24 },
  successPopup: { width: '100%', maxWidth: 340, alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#D4E9DA' },
  successCheck: { width: 70, height: 70, borderRadius: 35, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', lineHeight: 70, fontSize: 42, color: '#FFFFFF', backgroundColor: '#25834B' },
  successTitle: { textAlign: 'center', color: '#174F30' },
});
