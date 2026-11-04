import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { money, shipperNames, type DemoOrder } from './model';
import { useOrderDemo } from './provider';
import { Badge, Button, Card, Choice, Copy, Dialog, Empty, Notice, OrderSummary, SectionTitle, styles } from './ui';

export function StaffView({ page }: { page: string }) {
  const { orders, storeOpen, dispatch } = useOrderDemo();
  const [selectedId, setSelectedId] = useState<string>();
  const [dialog, setDialog] = useState<'handoff' | 'contact'>();
  const [shipper, setShipper] = useState<string>(shipperNames[0]);
  const [contacted, setContacted] = useState(false);
  const [refunded, setRefunded] = useState(false);
  const [feedback, setFeedback] = useState('');
  const selected = orders.find(order => order.id === selectedId);
  const status = page === 'ready' ? 'ready' : 'new';
  const visible = orders.filter(order => order.status === status);
  const affected = orders.filter(order => ['new', 'ready'].includes(order.status));

  function openContact(order: DemoOrder) {
    setSelectedId(order.id); setContacted(false); setRefunded(false); setDialog('contact');
  }

  return (
    <View style={styles.gap}>
      <SectionTitle eyebrow="Quầy tiếp nhận" title="Mỗi đơn đều được chăm chút" description="Tiếp nhận, đọc lưu ý của khách và bàn giao đúng người giao hàng." />
      <View style={styles.row}>
        <Badge label={orders.filter(order => order.status === 'new').length + ' đơn mới'} />
        <Badge label={orders.filter(order => order.status === 'ready').length + ' chờ bàn giao'} />
      </View>
      {!storeOpen && <Notice title={'Quán đã đóng · ' + affected.length + ' đơn cần rà soát'}>Liên hệ khách trước khi huỷ đơn. Với đơn đã thanh toán, trao đổi và xác nhận việc hoàn tiền trước khi gỡ đơn.</Notice>}
      {!!feedback && <Notice title="Đã cập nhật đơn mẫu">{feedback}</Notice>}
      {visible.length === 0 && <Empty>Đơn ở bước này sẽ xuất hiện sau khi khách đặt món hoặc nhân viên tiếp nhận.</Empty>}
      {visible.map(order => (
        <Card key={order.id}>
          <OrderSummary order={order} />
          <Copy muted>Tiếp nhận lúc {order.createdAt}</Copy>
          {order.status === 'new' && <Button testID={`staff-accept-${order.id}`}
            label={order.method !== 'COD' && order.payment === 'unpaid' ? 'Đang chờ khách thanh toán' : 'Tiếp nhận đơn'}
            disabled={order.method !== 'COD' && order.payment === 'unpaid'}
            onPress={() => { dispatch({ type: 'accept', id: order.id }); setFeedback(order.id + ' đã tiếp nhận, đang chờ bàn giao.'); }} />}
          {order.status === 'ready' && !order.shipper && <Button testID={`staff-handoff-${order.id}`} label="Chọn shipper & bàn giao" onPress={() => { setSelectedId(order.id); setDialog('handoff'); }} />}
          <Button secondary label={!storeOpen ? 'Liên hệ khách & xử lý hết món' : 'Xem thông tin liên hệ'} onPress={() => openContact(order)} />
        </Card>
      ))}

      <Dialog title="Bàn giao đơn" visible={dialog === 'handoff'} onClose={() => setDialog(undefined)}>
        {selected && <>
          <OrderSummary order={selected} compact />
          <Copy>Chọn shipper nhận đơn trực tiếp tại quầy.</Copy>
          {shipperNames.map(name => <Choice key={name} label={name} selected={shipper === name} onPress={() => setShipper(name)} />)}
          <Button label="Xác nhận bàn giao" onPress={() => { dispatch({ type: 'handoff', id: selected.id, shipper }); setFeedback(selected.id + ' đã bàn giao cho ' + shipper + '.'); setDialog(undefined); }} />
        </>}
      </Dialog>

      <Dialog title={storeOpen ? 'Liên hệ người nhận' : 'Xử lý đơn khi hết món'} visible={dialog === 'contact'} onClose={() => setDialog(undefined)}>
        {selected && <>
          <OrderSummary order={selected} />
          <Button secondary label={contacted ? '✓ Đã liên hệ khách (mô phỏng)' : 'Mô phỏng gọi khách · ' + selected.phone} onPress={() => setContacted(true)} />
          {!storeOpen && <>
            <Copy muted>Thông báo quán đã hết món và thống nhất cách xử lý với khách.</Copy>
            {selected.payment === 'paid' && <Choice label={'Đã thống nhất & hoàn lại ' + money(selected.price)} detail="Chỉ đánh dấu trong bản mẫu, không có giao dịch hoàn tiền." selected={refunded} onPress={() => setRefunded(!refunded)} />}
            <Button label="Huỷ & gỡ khỏi danh sách xử lý" disabled={!contacted || (selected.payment === 'paid' && !refunded)}
              onPress={() => { dispatch({ type: 'cancel', id: selected.id, contacted, refundConfirmed: refunded }); setFeedback(selected.id + ' đã được gỡ khỏi danh sách xử lý sau khi liên hệ khách.'); setDialog(undefined); }} />
            <ThemedText type="small" themeColor="textSecondary">Khách vẫn thấy thông báo huỷ / hoàn tiền trong bản mẫu để dễ kiểm tra luồng.</ThemedText>
          </>}
        </>}
      </Dialog>
    </View>
  );
}
