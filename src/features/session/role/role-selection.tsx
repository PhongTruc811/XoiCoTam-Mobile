import { Image } from 'expo-image';
import { type PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { Badge, Copy } from '@/components/ui/demo-display';
import { useTheme } from '@/hooks/use-theme';
import { shipperNames } from '@/features/order/model';
import { useRoleSession } from '../provider';
import { roles } from '../model';
import { useSwipeBack } from '../use-swipe-back';

export function SelectionShell({ title, description, children }: PropsWithChildren<{ title: string; description: string }>) {
  const theme = useTheme();
  const { goBack } = useRoleSession();
  const { gesture, scrollGesture, swipeStyle } = useSwipeBack(goBack, title);
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.background }]}>
      <GestureDetector gesture={gesture}>
      <Animated.View collapsable={false} style={[styles.safe, { backgroundColor: theme.background }, swipeStyle]}>
        <GestureDetector gesture={scrollGesture}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.container}>
            <View style={styles.intro}>
              <Image source={require('@/assets/images/logoIcon/logo.png')} contentFit="contain" accessibilityLabel="Xôi Cô Tấm" style={styles.logo} />
              <Badge label="✓ Đã kết nối cửa hàng" />
              <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
              <Copy muted>{description}</Copy>
            </View>
            <View style={styles.gap}>{children}</View>
            <View style={styles.swipeHint}><Copy muted>Kéo ngón tay từ trái sang phải để quay lại →</Copy></View>
          </View>
        </ScrollView>
        </GestureDetector>
      </Animated.View>
      </GestureDetector>
    </SafeAreaView>
  );
}

export function SelectionCard({ number, label, caption, onPress, testID }: { number: string; label: string; caption: string; onPress: () => void; testID?: string }) {
  const theme = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.75 : 1 }]}>
      <View style={[styles.number, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="smallBold">{number}</ThemedText>
      </View>
      <View style={styles.flex}>
        <ThemedText type="smallBold" style={styles.label}>{label}</ThemedText>
        <Copy muted>{caption}</Copy>
      </View>
      <ThemedText accessible={false}>→</ThemedText>
    </Pressable>
  );
}

export function RoleSelectionScreen() {
  const { chooseAudience } = useRoleSession();
  return (
    <SelectionShell title="Bạn là ai?" description="Chọn cách bạn muốn sử dụng Xôi Cô Tấm.">
      <SelectionCard testID="audience-customer" number="01" label="Khách hàng" caption="Đặt món và theo dõi đơn hàng" onPress={() => chooseAudience('customer')} />
      <SelectionCard testID="audience-employee" number="02" label="Nhân viên" caption="Tiếp nhận, giao hàng hoặc quản lý cửa hàng" onPress={() => chooseAudience('employee')} />
    </SelectionShell>
  );
}

export function CustomerOptionsScreen() {
  const { chooseCustomerPath } = useRoleSession();
  return (
    <SelectionShell title="Chào mừng khách hàng" description="Bạn muốn bắt đầu như thế nào?">
      <SelectionCard number="01" label="Đăng ký / Đăng nhập" caption="Truy cập tài khoản khách hàng" onPress={() => chooseCustomerPath('account')} />
      <SelectionCard testID="customer-guest" number="02" label="Đặt món ngay (khách)" caption="Tiếp tục mà không cần tài khoản" onPress={() => chooseCustomerPath('guest')} />
    </SelectionShell>
  );
}

export function EmployeeRoleScreen() {
  const { chooseEmployeeRole } = useRoleSession();
  return (
    <SelectionShell title="Vai trò nhân viên" description="Chọn công việc của bạn tại cửa hàng.">
      {roles.filter((role): role is (typeof roles)[number] & { id: 'staff' | 'shipper' | 'boss' } => role.id !== 'customer').map((role, index) => (
        <SelectionCard key={role.id} testID={`role-${role.id}`} number={`0${index + 1}`} label={role.label} caption={role.caption}
          onPress={() => chooseEmployeeRole(role.id)} />
      ))}
    </SelectionShell>
  );
}

export function ShipperIdentityScreen() {
  const { chooseShipperIdentity } = useRoleSession();
  return (
    <SelectionShell title="Bạn là:" description="Chọn tên của bạn để xem các đơn được bàn giao cho bạn.">
      {shipperNames.map((name, index) => (
        <SelectionCard key={name} number={`0${index + 1}`} label={name}
          caption="Xem đơn giao của tôi" onPress={() => chooseShipperIdentity(name)} />
      ))}
    </SelectionShell>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 16 },
  flex: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  container: { width: '100%', maxWidth: 560, gap: 28 },
  intro: { alignItems: 'center', gap: 14 },
  logo: { width: 90, height: 90 },
  title: { fontSize: 28, lineHeight: 36, textAlign: 'center' },
  swipeHint: { alignItems: 'center', marginTop: 4 },
  card: { minHeight: 90, padding: 18, borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  number: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18, lineHeight: 26 },
});
