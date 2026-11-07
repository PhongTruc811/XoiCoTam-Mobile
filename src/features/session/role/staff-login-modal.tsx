import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Button, Field } from '@/features/order/ui';
import { StaffApiError } from '@/features/order/staff-api';
import { useRoleSession } from '../provider';

export function StaffLoginModal() {
  const { staffLoginOpen, loginStaff, cancelStaffLogin } = useRoleSession();
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    if (!username.trim() || !password) { setError('Nhập tài khoản và mật khẩu nhân viên.'); return; }
    setBusy(true); setError('');
    try { await loginStaff(username.trim(), password); setPassword(''); }
    catch (cause) { setError(cause instanceof StaffApiError && cause.status === 401
      ? 'Tài khoản hoặc mật khẩu chưa đúng.' : cause instanceof Error ? cause.message : 'Không thể đăng nhập.'); }
    finally { setBusy(false); }
  }
  return <Modal transparent visible={staffLoginOpen} animationType="fade" onRequestClose={cancelStaffLogin}>
    <SafeAreaView style={styles.backdrop}>
      <View style={[styles.panel, { backgroundColor: theme.background }]}>
        <ThemedText type="subtitle">Đăng nhập nhân viên</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Dùng tài khoản STAFF do cửa hàng cấp.</ThemedText>
        <Field label="Tên đăng nhập" testID="staff-username" autoCapitalize="none" autoCorrect={false} value={username} onChangeText={setUsername} />
        <Field label="Mật khẩu" testID="staff-password" secureTextEntry value={password} onChangeText={setPassword} />
        {!!error && <ThemedText accessibilityLiveRegion="polite" style={styles.error}>{error}</ThemedText>}
        {busy ? <ActivityIndicator /> : <Button label="Đăng nhập" testID="staff-login" onPress={submit} />}
        <Pressable onPress={cancelStaffLogin} disabled={busy} accessibilityRole="button" style={styles.cancel}>
          <ThemedText type="smallBold">Hủy</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(26,19,11,0.62)', justifyContent: 'center', padding: 20 },
  panel: { width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 24, padding: 24, gap: 16 },
  error: { color: '#B54738' },
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
