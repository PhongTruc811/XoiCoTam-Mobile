import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useRoleSession } from '../provider';
import { Button, Card, Field, styles } from '@/features/order/ui';
import { SelectionShell } from './role-selection';

export function CustomerAccountScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { chooseCustomerPath } = useRoleSession();
  return (
    <SelectionShell title="Tài khoản khách hàng" description="Đăng nhập hoặc tạo tài khoản để theo dõi đơn hàng về sau.">
      <View style={styles.row}>
        <View style={styles.flex}><Button label="Đăng nhập" secondary={mode !== 'login'} onPress={() => setMode('login')} /></View>
        <View style={styles.flex}><Button label="Đăng ký" secondary={mode !== 'register'} onPress={() => setMode('register')} /></View>
      </View>
      <Card>
        {mode === 'register' && <Field label="Họ và tên" value={name} onChangeText={setName} autoComplete="name" placeholder="Tên của bạn" />}
        <Field label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="09xxxxxxxx" />
        <Field label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Nhập mật khẩu" />
        <Button label={mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'} disabled onPress={() => {}} />
        <ThemedText type="small" themeColor="textSecondary">Tài khoản đang ở bản phác thảo giao diện. Chức năng đăng ký và đăng nhập sẽ hoạt động khi tích hợp backend.</ThemedText>
      </Card>
      <Button secondary label="Đặt món không cần tài khoản" onPress={() => chooseCustomerPath('guest')} />
    </SelectionShell>
  );
}
