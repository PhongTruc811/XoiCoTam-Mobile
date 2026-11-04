import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useRoleSession } from '../provider';

const keys = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['', ''], ['0', ''], ['⌫', '']];

export function EmployeePinModal() {
  const { pinPromptOpen, verifyEmployeePin, cancelEmployeePin } = useRoleSession();
  if (!pinPromptOpen) return null;
  return <PinPad verify={verifyEmployeePin} cancel={cancelEmployeePin} />;
}

function PinPad({ verify, cancel }: { verify: (pin: string) => boolean; cancel: () => void }) {
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));

  function press(key: string) {
    if (key === '⌫') { setPin(previous => previous.slice(0, -1)); setError(false); return; }
    if (pin.length >= 6) return;
    const next = pin + key;
    setError(false);
    setPin(next);
    if (next.length === 6 && !verify(next)) {
      setPin('');
      setError(true);
      shake.set(withSequence(withTiming(-12, { duration: 55 }), withTiming(12, { duration: 55 }), withTiming(-8, { duration: 55 }), withTiming(8, { duration: 55 }), withTiming(0, { duration: 55 })));
    }
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={cancel}>
      <SafeAreaView style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.panel, { backgroundColor: theme.background }]} accessibilityViewIsModal onAccessibilityEscape={cancel}>
            <Image source={require('@/assets/images/logoIcon/logo.png')} contentFit="contain" style={styles.logo} />
            <ThemedText type="subtitle" style={styles.title}>Nhập mật mã nhân viên</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>Nhập 6 chữ số để chọn vai trò của bạn.</ThemedText>
            <Animated.View style={[styles.dots, shakeStyle]} accessible accessibilityLabel={`Đã nhập ${pin.length} trên 6 chữ số`}>
              {Array.from({ length: 6 }, (_, index) => <View key={index} style={[styles.dot, { borderColor: error ? '#B54738' : theme.text, backgroundColor: index < pin.length ? theme.text : 'transparent' }]} />)}
            </Animated.View>
            <ThemedText testID="employee-pin-error" type="small" accessibilityLiveRegion="polite" style={[styles.error, { color: '#B54738' }]}>{error ? 'Mật mã chưa đúng. Bạn thử lại nhé.' : ' '}</ThemedText>
            <View style={styles.keypad}>
              {keys.map(([key, letters], index) => key ? (
                <View key={key} style={styles.keyCell}>
                  <Pressable testID={key === '⌫' ? 'employee-pin-delete' : `employee-pin-${key}`} accessibilityRole="button" accessibilityLabel={key === '⌫' ? 'Xóa chữ số cuối' : `Số ${key}`} onPress={() => press(key)}
                    style={({ pressed }) => [styles.key, { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement, borderColor: theme.border, transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
                    <ThemedText style={styles.digit}>{key}</ThemedText>
                    {!!letters && <ThemedText type="small" style={styles.letters}>{letters}</ThemedText>}
                  </Pressable>
                </View>
              ) : <View key={`empty-${index}`} style={styles.keyCell} />)}
            </View>
            <Pressable onPress={cancel} accessibilityRole="button" accessibilityLabel="Hủy nhập mật mã" style={styles.cancel}>
              <ThemedText type="smallBold" themeColor="textSecondary">Hủy</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(26,19,11,0.62)' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  panel: { width: '100%', maxWidth: 400, borderRadius: 32, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12, alignItems: 'center' },
  logo: { width: 64, height: 64, marginBottom: 14 },
  title: { fontSize: 22, lineHeight: 30, textAlign: 'center', marginBottom: 6 },
  center: { textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 16, marginTop: 24 },
  dot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.5 },
  error: { minHeight: 34, paddingTop: 10, textAlign: 'center' },
  keypad: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, paddingTop: 8 },
  keyCell: { width: '33.333%', alignItems: 'center' },
  key: { width: 70, height: 70, borderRadius: 35, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  digit: { fontSize: 30, lineHeight: 34, fontWeight: '400' },
  letters: { fontSize: 9, lineHeight: 12, letterSpacing: 1.4 },
  cancel: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 24, marginTop: 12 },
});
