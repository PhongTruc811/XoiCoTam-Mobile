import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useRoleSession } from '@/features/session/provider';

import { getShipperOrders, money, type PaymentMethod } from './model';
import { useOrderDemo } from './provider';
import { Button, Card, Copy, Dialog, Empty, Notice, OrderSummary, QrPreview, SectionTitle, styles } from './ui';

export function ShipperView({ page }: { page: string }) {
  const { orders, dispatch } = useOrderDemo();
  const theme = useTheme();
  const { shipperIdentity: identity } = useRoleSession();
  const [cashId, setCashId] = useState<string>();
  const [contactId, setContactId] = useState<string>();
  const [feedback, setFeedback] = useState('');
  const [qr, setQr] = useState<{ id: string; method: 'QR03' | 'QR02'; expiresAt: number; failed: boolean }>();
  const cashOrder = orders.find(order => order.id === cashId);
  const qrOrder = orders.find(order => order.id === qr?.id);
  const contact = orders.find(order => order.id === contactId);
  const visible = getShipperOrders(orders, identity, page === 'finished' ? 'finished' : 'delivering');

  function pay(id: string, method: Exclude<PaymentMethod, 'COD' | 'QR01'>) {
    dispatch({ type: 'pay', id, method, at: new Date().toLocaleString('vi-VN') });
    setCashId(undefined); setQr(undefined);
    setFeedback(id + ' đã thu đủ tiền (mô phỏng). Bạn có thể xác nhận giao thành công.');
  }

  return (
    <View style={styles.gap}>
      <SectionTitle eyebrow={'Shipper · ' + identity} title="Giao tận tay khách hàng" description="Đơn được staff bàn giao sẽ xuất hiện ngay trong Đơn cần giao của bạn." />
      {!!feedback && <Notice title="Cập nhật giao hàng">{feedback}</Notice>}
      {visible.length === 0 && <Empty>Chỉ hiển thị đơn được staff bàn giao cho {identity}.</Empty>}
      {visible.map(order => (
        <Card key={order.id}>
          <OrderSummary order={order} />
          {order.status !== 'finished' && <>
            <Link href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address.replace('Địa chỉ mẫu: ', ''))}`} target="_blank" asChild>
              <Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.button, { borderColor: theme.border, backgroundColor: theme.background }])}>
                <ThemedText type="smallBold">↗ Tìm địa chỉ trên Google Maps</ThemedText>
              </Pressable>
            </Link>
            <Button secondary label="Thông tin liên hệ khách" onPress={() => setContactId(order.id)} />
          </>}
          {order.status === 'delivering' && <>
            <View style={styles.row}><Copy>Cần thu từ khách</Copy><Copy large>{money(order.payment === 'paid' ? 0 : order.price)}</Copy></View>
            {order.payment === 'unpaid' ? <>
              <Button label="Thu tiền mặt" onPress={() => setCashId(order.id)} />
              <Button secondary label="Khách chuyển khoản · hiển thị QR" onPress={() => setQr({ id: order.id, method: 'QR03', expiresAt: Date.now() + 15 * 60 * 1000, failed: false })} />
              <Copy muted>Xác nhận đã thu đủ tiền trước khi hoàn tất giao hàng.</Copy>
            </> : <Copy>✓ Đơn đã thanh toán. Không thu thêm tiền.</Copy>}
            <Button label="Xác nhận đã giao thành công" disabled={order.payment !== 'paid'} onPress={() => { dispatch({ type: 'finish', id: order.id }); setFeedback(order.id + ' đã giao xong và hoàn tất.'); }} />
          </>}
        </Card>
      ))}

      <Dialog title="Xác nhận thu tiền mặt" visible={!!cashId} onClose={() => setCashId(undefined)}>
        {cashOrder && <><OrderSummary order={cashOrder} compact /><Copy large>{money(cashOrder.price)}</Copy><Copy muted>Chỉ xác nhận sau khi đã nhận đủ tiền từ khách. Đây là thao tác mô phỏng.</Copy><Button label="Mô phỏng: đã thu đủ tiền mặt" onPress={() => pay(cashOrder.id, 'CASH')} /></>}
      </Dialog>

      <Dialog title={qr?.method === 'QR02' ? 'QR dự phòng của chủ quán' : 'Chuyển khoản khi nhận hàng'} visible={!!qr} onClose={() => setQr(undefined)}>
        {qr && qrOrder && <>
          <Copy>Đơn {qr.id} · {qr.method}</Copy>
          {qr.failed ? <>
            <Notice title="Giao dịch không thành công">Có thể dùng QR tài khoản ngân hàng cá nhân của chủ quán hoặc quay lại thu tiền mặt.</Notice>
            <Button label="Hiển thị QR dự phòng · QR02" onPress={() => setQr({ ...qr, method: 'QR02', failed: false, expiresAt: Date.now() + 15 * 60 * 1000 })} />
            <Button secondary label="Quay lại để thu tiền mặt" onPress={() => setQr(undefined)} />
          </> : <>
            {qr.method === 'QR02' && <Copy muted>QR tài khoản chủ quán. Cần đối chiếu giao dịch trước khi xác nhận đã thanh toán.</Copy>}
            <QrPreview key={qr.expiresAt} expiresAt={qr.expiresAt} amount={qrOrder.price} manual={qr.method === 'QR02'}
              onPaid={() => { if (Date.now() < qr.expiresAt) pay(qr.id, qr.method); }}
              onFailed={() => setQr({ ...qr, failed: true })}
              onExpired={() => setQr({ ...qr, failed: true })} />
          </>}
        </>}
      </Dialog>

      <Dialog title="Thông tin người nhận" visible={!!contactId} onClose={() => setContactId(undefined)}>
        {contact && <><Copy large>{contact.name}</Copy><Copy>{contact.phone}</Copy><Copy muted>{contact.address}</Copy><Copy muted>Thông tin mẫu. Bản phác thảo không thực hiện cuộc gọi.</Copy></>}
      </Dialog>
    </View>
  );
}
