import { useEffect, useState, type PropsWithChildren } from 'react';
import {
  Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View,
  KeyboardAvoidingView, type TextInputProps, type StyleProp, type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, Copy } from '@/components/ui/demo-display';
import { useTheme } from '@/hooks/use-theme';

import { money, methodLabels, qrRemainingSeconds, statusLabels, type DemoOrder } from './model';

export { Badge, Copy } from '@/components/ui/demo-display';

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}>{children}</View>;
}

export function Button({ label, onPress, secondary = false, disabled = false, testID }: {
  label: string; onPress: () => void; secondary?: boolean; disabled?: boolean; testID?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} disabled={disabled} accessibilityRole="button"
      accessibilityState={{ disabled }} accessibilityLabel={label}
      style={({ pressed }) => [styles.button, {
        backgroundColor: secondary ? theme.background : theme.accent,
        borderColor: secondary ? theme.border : theme.accent,
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
      }]}>
      <ThemedText type="smallBold" style={{ color: secondary ? theme.text : theme.onAccent, textAlign: 'center' }}>{label}</ThemedText>
    </Pressable>
  );
}

export function Choice({ label, detail, selected, onPress, disabled = false }: {
  label: string; detail?: string; selected: boolean; onPress: () => void; disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [styles.choice, { borderColor: selected ? theme.accent : theme.border, backgroundColor: theme.background, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }]}>
      <View style={[styles.radio, { borderColor: selected ? theme.accent : theme.border }]}>
        {selected && <View style={[styles.radioDot, { backgroundColor: theme.accent }]} />}
      </View>
      <View style={styles.flex}><ThemedText type="smallBold">{label}</ThemedText>{detail && <Copy muted>{detail}</Copy>}</View>
    </Pressable>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.gapSmall}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor={theme.textSecondary}
        style={[styles.input, props.multiline && styles.multiline, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} />
      {error && <ThemedText testID={props.testID ? `${props.testID}-error` : undefined} type="small" accessibilityLiveRegion="polite" style={{ color: theme.text }}>{'! ' + error}</ThemedText>}
    </View>
  );
}

export function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <View style={styles.gapSmall}><ThemedText type="code" themeColor="textSecondary">{eyebrow.toUpperCase()}</ThemedText><Copy large>{title}</Copy>{description && <Copy muted>{description}</Copy>}</View>;
}

export function Notice({ title, children }: PropsWithChildren<{ title: string }>) {
  return <Card><ThemedText type="smallBold">{title}</ThemedText><Copy muted>{children}</Copy></Card>;
}

export function Empty({ children }: PropsWithChildren) {
  return <Card style={styles.empty}><Copy large>Chưa có đơn ở đây</Copy><Copy muted>{children}</Copy></Card>;
}

export function OrderSummary({ order, compact = false, testID }: { order: DemoOrder; compact?: boolean; testID?: string }) {
  return (
    <View style={styles.gap}>
      <View style={styles.row}><ThemedText type="smallBold">#{order.id}</ThemedText><Badge label={statusLabels[order.status]} /></View>
      <View style={styles.row}><Copy>Xôi · phần {money(order.price)}</Copy><ThemedText testID={testID ? `${testID}-price` : undefined} type="smallBold">{money(order.price)}</ThemedText></View>
      <View style={styles.gapSmall}>
        <ThemedText testID={testID ? `${testID}-name` : undefined} type="smallBold">{order.name}</ThemedText>
        <Copy muted>{order.phone}</Copy>
        {!compact && <Copy muted>{order.address}</Copy>}
        {order.note && <Copy>Ghi chú: {order.note}</Copy>}
      </View>
      <Copy muted>{order.payment === 'paid' ? '✓ Đã thanh toán' : order.payment === 'refunded' ? '↩ Đã hoàn tiền (mô phỏng)' : '○ Chưa thanh toán'} · {methodLabels[order.method]}</Copy>
      {order.shipper && <Copy muted>Shipper: {order.shipper}</Copy>}
      {order.paidAt && !compact && <Copy muted>Thời điểm thanh toán: {order.paidAt}</Copy>}
    </View>
  );
}

export function Dialog({ title, visible, onClose, children }: PropsWithChildren<{ title: string; visible: boolean; onClose: () => void }>) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: theme.background, borderColor: theme.border }]} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.gap}>
            <View style={styles.row}><Copy large>{title}</Copy><Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng hộp thoại" style={styles.close}><ThemedText>×</ThemedText></Pressable></View>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function QrPreview({ expiresAt, amount, onPaid, onFailed, onExpired, manual = false, disabled = false }: {
  expiresAt: number; amount: number; onPaid: () => void; onFailed: () => void;
  onExpired: () => void; manual?: boolean; disabled?: boolean;
}) {
  const [remaining, setRemaining] = useState(() => qrRemainingSeconds(expiresAt, Date.now()));
  useEffect(() => {
    const timer = setInterval(() => setRemaining(qrRemainingSeconds(expiresAt, Date.now())), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  const expired = remaining === 0;
  return (
    <View style={styles.gap}>
      <View style={styles.qrWrap}>
        <View style={styles.qrPlaceholder} accessible accessibilityLabel="Vùng mã QR minh hoạ, không dùng thanh toán">
          <View style={styles.qrCorners}><View style={styles.qrFinder} /><View style={styles.qrFinder} /></View>
          <View style={styles.qrPattern}>{Array.from({ length: 35 }, (_, i) => <View key={i} style={[styles.qrDot, { opacity: (i * 7 % 5) > 1 ? 1 : 0 }]} />)}</View>
          <View style={styles.qrCorners}><View style={styles.qrFinder} /><View style={styles.qrFinderSmall} /></View>
        </View>
        <ThemedText type="smallBold">{money(amount)}</ThemedText>
        <Copy muted>QR minh hoạ · không dùng để thanh toán</Copy>
        <Badge label={expired ? 'QR đã hết hạn' : `Còn ${Math.floor(remaining / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`} />
      </View>
      <Button label={manual ? 'Mô phỏng: đã đối chiếu chuyển khoản' : 'Mô phỏng: thanh toán thành công'} onPress={onPaid} disabled={expired || disabled} />
      <View style={styles.row}><View style={styles.flex}><Button secondary label="Mô phỏng thất bại" onPress={onFailed} /></View><View style={styles.flex}><Button secondary label="Mô phỏng hết hạn" onPress={onExpired} /></View></View>
    </View>
  );
}

export const styles = StyleSheet.create({
  gap: { gap: 16 },
  gapSmall: { gap: 6 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  card: { padding: 20, borderRadius: 22, borderWidth: 1, gap: 16 },
  button: { minHeight: 48, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, minHeight: 64 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  input: { minHeight: 50, padding: 14, borderWidth: 1, borderRadius: 14, fontSize: 16 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 520, maxHeight: '90%', borderRadius: 24, borderWidth: 1, padding: 20 },
  close: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  qrWrap: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  qrPlaceholder: { width: 172, height: 172, padding: 14, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ddd', justifyContent: 'space-between' },
  qrCorners: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qrFinder: { width: 36, height: 36, borderWidth: 8, borderColor: '#222' },
  qrFinderSmall: { width: 18, height: 18, backgroundColor: '#222' },
  qrPattern: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center' },
  qrDot: { width: 14, height: 6, backgroundColor: '#222' },
});
