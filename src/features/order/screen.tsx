import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useRoleSession } from '@/features/session/provider';
import { roles, type Role } from '@/features/session/model';
import { BackButton } from '@/features/session/role/back-button';
import { useSwipeBack } from '@/features/session/use-swipe-back';

import { useOrderDemo } from './provider';
import { Badge, styles } from './ui';

const sections: Record<Role, { id: string; label: string }[]> = {
  customer: [{ id: 'menu', label: 'Đặt món' }, { id: 'orders', label: 'Đơn của tôi' }],
  staff: [{ id: 'new', label: 'Đơn mới' }, { id: 'ready', label: 'Đã tiếp nhận' }],
  shipper: [{ id: 'delivering', label: 'Đơn cần giao' }, { id: 'finished', label: 'Hoàn thành đơn' }],
  boss: [{ id: 'overview', label: 'Tổng quan' }, { id: 'store', label: 'Cửa hàng' }, { id: 'daily-post', label: 'Bài đăng hằng ngày' }],
};

type RoleWorkspaceProps = {
  role: Role;
  children: (page: string, navigate: (page: string) => void) => ReactNode;
};

export function RoleWorkspace({ role, children }: RoleWorkspaceProps) {
  const params = useLocalSearchParams<{ page?: string }>();
  const validPages = sections[role].map(section => section.id);
  if (role === 'customer') validPages.push('review', 'payment');
  const page = params.page && validPages.includes(params.page) ? params.page : sections[role][0].id;
  const theme = useTheme();
  const { goBack } = useRoleSession();
  const { storeOpen } = useOrderDemo();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const currentRole = roles.find(item => item.id === role);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [page]);

  function navigate(nextPage: string) {
    if (nextPage === page) return;
    setPageHistory(previous => [...previous, page]);
    router.setParams({ page: nextPage });
  }

  function back() {
    if (pageHistory.length) {
      const previousPage = pageHistory[pageHistory.length - 1];
      setPageHistory(previous => previous.slice(0, -1));
      router.setParams({ page: previousPage });
    } else goBack();
  }
  const { gesture, scrollGesture, swipeStyle } = useSwipeBack(back, `${role}:${page}`);

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[screenStyles.safe, { backgroundColor: theme.background }]}>
      <GestureDetector gesture={gesture}>
      <Animated.View collapsable={false} style={[screenStyles.safe, { backgroundColor: theme.background }, swipeStyle]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[screenStyles.header, { borderColor: theme.border }]}>
          <View style={screenStyles.headerContent}>
            <View style={screenStyles.backSlot}><BackButton onPress={back} compact testID="workspace-back" /></View>
            <View style={screenStyles.brand}>
              <Image source={require('@/assets/images/logoIcon/logo.png')} contentFit="contain" accessibilityLabel="Xôi Cô Tấm" style={screenStyles.logo} />
              <ThemedText type="smallBold" style={screenStyles.brandName}>XÔI CÔ TẤM</ThemedText>
            </View>
          </View>
        </View>
        <GestureDetector gesture={scrollGesture}>
        <ScrollView ref={scroll} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={screenStyles.scroll}>
          <View style={screenStyles.container}>
            <View style={styles.row}>
              <ThemedText testID={`workspace-${role}`} type="smallBold">{currentRole?.label}</ThemedText>
              {role !== 'staff' && <Badge label={storeOpen ? 'Quán đang mở' : 'Quán đã đóng'} />}
            </View>
            <View style={screenStyles.sections}>
              {sections[role].map(section => {
                const selected = page === section.id || (role === 'customer' && section.id === 'menu' && ['review', 'payment'].includes(page));
                return (
                  <Pressable key={section.id} testID={`nav-${role}-${section.id}`} onPress={() => navigate(section.id)}
                    accessibilityRole="button" accessibilityState={{ selected }}
                    style={({ pressed }) => [screenStyles.section, {
                      backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                      borderColor: theme.border, opacity: pressed ? 0.7 : 1,
                    }]}>
                    <ThemedText type="smallBold">{section.label}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {children(page, navigate)}
          </View>
        </ScrollView>
        </GestureDetector>
        </KeyboardAvoidingView>
      </Animated.View>
      </GestureDetector>
    </SafeAreaView>
  );
}

const screenStyles = StyleSheet.create({
  safe: { flex: 1 },
  header: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingVertical: 10 },
  headerContent: { width: '100%', maxWidth: 960, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  backSlot: { position: 'absolute', left: 0, top: 2, zIndex: 1 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: { width: 36, height: 36 },
  brandName: { fontSize: 16, letterSpacing: 1 },
  scroll: { alignItems: 'center', padding: 20, paddingBottom: 32 },
  container: { width: '100%', maxWidth: 960, gap: 24 },
  sections: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, justifyContent: 'center' },
});
