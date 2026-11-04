import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { money, statusLabels, validateCustomer, type CustomerDetails, type DemoOrder, type MealPrice } from './model';
import { useOrderDemo } from './provider';
import { MealCard, MealPhoto } from './meal-card';
import { Badge, Button, Card, Choice, Copy, Dialog, Empty, Field, Notice, OrderSummary, QrPreview, SectionTitle, styles } from './ui';

const emptyForm: CustomerDetails = { name: '', phone: '', address: '', note: '' };
const sizes: { price: MealPrice; label: string; caption: string }[] = [
  { price: 20000, label: 'Phần 20 nghìn', caption: 'Lựa chọn gọn nhẹ' },
  { price: 25000, label: 'Phần 25 nghìn', caption: 'Vừa đủ cho buổi sáng' },
  { price: 30000, label: 'Phần 30 nghìn', caption: 'Một bữa thật no' },
];

export function CustomerView({ page, navigate }: { page: string; navigate: (page: string) => void }) {
  const { storeOpen, orders, customerOrderIds, dispatch } = useOrderDemo();
  const [form, setForm] = useState<CustomerDetails>(emptyForm);
  const [price, setPrice] = useState<MealPrice>(25000);
  const [errors, setErrors] = useState<ReturnType<typeof validateCustomer>>({});
  const [method, setMethod] = useState<'COD' | 'bank' | 'momo'>('COD');
  const [pendingId, setPendingId] = useState<string>();
  const [confirmCod, setConfirmCod] = useState(false);
  const [qr, setQr] = useState<{ id: string; expiresAt: number }>();
  const [paymentNotice, setPaymentNotice] = useState('');
  const pending = orders.find(order => order.id === pendingId);
  const ownOrders = orders.filter(order => customerOrderIds.includes(order.id));
  const currentPage = !pending && ['review', 'payment'].includes(page) && Object.keys(validateCustomer(form)).length ? 'menu' : page;
  const draft: DemoOrder = pending ?? { ...form, id: 'Đơn của bạn', price, status: 'new', payment: 'unpaid', method: 'COD', createdAt: '' };

  function createOrder(paymentMethod: 'COD' | 'QR01') {
    const id = 'XCT-' + (Math.max(1004, ...orders.map(order => Number(order.id.split('-')[1]) || 0)) + 1);
    dispatch({ type: 'create', order: {
      ...form, name: form.name.trim(), phone: form.phone.replace(/\s/g, ''), address: form.address.trim(),
      price, id, status: 'new', payment: 'unpaid', method: paymentMethod,
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    } });
    return id;
  }

  function review() {
    const nextErrors = validateCustomer(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0 && storeOpen) navigate('review');
  }

  function startQr() {
    if (!storeOpen) return;
    const id = pending?.status === 'new' && pending.payment === 'unpaid' ? pending.id : createOrder('QR01');
    setPendingId(id);
    setPaymentNotice('');
    setQr({ id, expiresAt: Date.now() + 15 * 60 * 1000 });
  }

  function confirmPayment() {
    if (!qr || !storeOpen || Date.now() >= qr.expiresAt) return;
    const order = orders.find(item => item.id === qr.id);
    if (!order || order.status !== 'new' || order.payment !== 'unpaid') return;
    dispatch({ type: 'pay', id: qr.id, method: 'QR01', at: new Date().toLocaleString('vi-VN') });
    setQr(undefined);
    setPaymentNotice('Thanh toán thành công (mô phỏng). Cửa hàng đã nhận đơn.');
    navigate('orders');
  }

  function submitCod() {
    if (!storeOpen) return;
    if (pending && pending.status === 'new' && pending.payment === 'unpaid') dispatch({ type: 'cod', id: pending.id });
    else createOrder('COD');
    setConfirmCod(false);
    setPaymentNotice('Đặt món thành công (mô phỏng). Bạn sẽ thanh toán khi nhận hàng.');
    setPendingId(undefined);
    navigate('orders');
  }

  function updateField(key: keyof CustomerDetails, value: string) {
    setForm(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
  }

  return (
    <View style={styles.gap}>
      {!storeOpen && <Notice title="Hôm nay quán đã hết món">Tính năng đặt món đang tạm đóng. Bạn quay lại vào ngày mai nhé! Các đơn đã đặt vẫn được cửa hàng hỗ trợ.</Notice>}
      {!!paymentNotice && <Notice title="Thông tin đơn hàng">{paymentNotice}</Notice>}

      {currentPage === 'orders' ? (
        <>
          <SectionTitle eyebrow="Theo dõi đơn" title="Bữa sáng đang trên đường" description="Theo dõi quá trình tiếp nhận và giao đơn của bạn." />
          <Button secondary label="Đặt một phần xôi mới" disabled={!storeOpen} onPress={() => { setPendingId(undefined); setForm(emptyForm); setPaymentNotice(''); navigate('menu'); }} />
          {ownOrders.length === 0 && <Empty>Đặt phần xôi đầu tiên để theo dõi ở đây.</Empty>}
          {ownOrders.map(order => (
            <Card key={order.id}>
              <OrderSummary order={order} testID={`customer-order-${order.id}`} />
              <View style={customerStyles.timeline}>
                {(['new', 'ready', 'delivering', 'finished'] as const).map((step, index) => {
                  const current = ['new', 'ready', 'delivering', 'finished'].indexOf(order.status);
                  return <View key={step} style={customerStyles.timelineStep}><ThemedText type="smallBold">{order.status !== 'cancelled' && index <= current ? '●' : '○'}</ThemedText><Copy muted>{statusLabels[step]}</Copy></View>;
                })}
              </View>
              {order.status === 'cancelled' && <Copy>Quán đã huỷ đơn sau khi liên hệ. {order.payment === 'refunded' ? 'Tiền đã được đánh dấu hoàn lại trong bản mẫu.' : 'Bạn không cần thanh toán đơn này.'}</Copy>}
              {order.status === 'new' && order.payment === 'unpaid' && order.method === 'QR01' && <Button disabled={!storeOpen} label="Tiếp tục thanh toán" onPress={() => { setPendingId(order.id); setForm({ name: order.name, phone: order.phone, address: order.address, note: order.note }); setPrice(order.price); navigate('payment'); }} />}
            </Card>
          ))}
        </>
      ) : currentPage === 'review' ? (
        <>
          <SectionTitle eyebrow="Bước 2 / 3" title="Kiểm tra lại đơn của bạn" description="Địa chỉ, phần xôi và lưu ý sẽ được gửi đến cửa hàng." />
          <Card><MealPhoto price={draft.price} /><OrderSummary order={draft} testID="review" /><View style={styles.row}><Copy>Tổng tiền món</Copy><Copy large>{money(draft.price)}</Copy></View></Card>
          <Button testID="review-continue" label="Xác nhận & chọn thanh toán" disabled={!storeOpen} onPress={() => navigate('payment')} />
          <Button testID="review-edit" secondary label="Huỷ xác nhận, sửa thông tin" onPress={() => navigate('menu')} />
        </>
      ) : currentPage === 'payment' ? (
        <>
          <SectionTitle eyebrow="Bước 3 / 3" title="Bạn muốn thanh toán thế nào?" description="Chọn thanh toán trước hoặc thanh toán khi nhận hàng." />
          <Card>
            <View style={styles.row}><Copy>Tổng tiền món</Copy><Copy large>{money(draft.price)}</Copy></View>
            <Choice label="Thanh toán khi nhận hàng" detail="Tiền mặt hoặc chuyển khoản cho shipper" selected={method === 'COD'} onPress={() => setMethod('COD')} />
            <Choice label="Ngân hàng" detail="Thanh toán trước qua QR · hiệu lực 15 phút" selected={method === 'bank'} onPress={() => setMethod('bank')} />
            <Choice label="MoMo / ví trả sau" detail="Bản phác thảo lựa chọn theo requirements" selected={method === 'momo'} onPress={() => setMethod('momo')} />
          </Card>
          <Button testID="payment-submit" label={method === 'COD' ? 'Xác nhận đặt món' : 'Hiển thị QR thanh toán'} disabled={!storeOpen || (pending?.status === 'cancelled')} onPress={() => method === 'COD' ? setConfirmCod(true) : startQr()} />
          <Button secondary label={pending ? 'Về đơn của tôi' : 'Quay lại kiểm tra đơn'} onPress={() => navigate(pending ? 'orders' : 'review')} />
        </>
      ) : (
        <>
          <Card>
            <View style={styles.row}><Badge label={storeOpen ? 'Đang nhận đơn' : 'Đã hết món'} /><Copy muted>Đặt món trực tuyến</Copy></View>
            <SectionTitle eyebrow="Xôi Cô Tấm" title="Một phần xôi, một buổi sáng ngon." description="Chọn phần xôi bạn thích. Cô Tấm chuẩn bị, shipper giao đến bạn." />
          </Card>
          <SectionTitle eyebrow="Bước 1 / 3" title="Chọn phần xôi" />
          <Copy muted>Ảnh minh hoạ được tạo dựa trên món xôi của quán.</Copy>
          {sizes.map(size => <MealCard key={size.price} price={size.price} caption={size.caption} selected={price === size.price} disabled={!storeOpen} onPress={() => { setPrice(size.price); setPendingId(undefined); }} />)}
          <Card>
            <SectionTitle eyebrow="Giao tới" title="Thông tin người nhận" />
            <Field testID="recipient-name" label="Tên người nhận *" placeholder="Tên của bạn" autoComplete="name" value={form.name} maxLength={100} onChangeText={value => updateField('name', value)} error={errors.name} />
            <Field testID="recipient-phone" label="Số điện thoại *" placeholder="09xxxxxxxx" keyboardType="phone-pad" autoComplete="tel" value={form.phone} maxLength={16} onChangeText={value => updateField('phone', value)} error={errors.phone} />
            <Field testID="recipient-address" label="Địa chỉ giao hàng *" placeholder="Số nhà, tên đường, phường / xã…" multiline value={form.address} maxLength={240} onChangeText={value => updateField('address', value)} error={errors.address} />
            <Field testID="recipient-note" label="Lưu ý cho cửa hàng" placeholder="Ví dụ: không hành, ít nước sốt…" multiline value={form.note} maxLength={300} onChangeText={value => updateField('note', value)} />
            <Button secondary label="Điền thông tin mẫu" onPress={() => { setForm({ name: 'Khách trải nghiệm', phone: '0900000000', address: 'Địa chỉ mẫu: 12 Nguyễn Văn Cừ, TP.HCM', note: 'Không hành.' }); setErrors({}); setPendingId(undefined); }} />
          </Card>
          <View style={styles.row}><Copy>Tổng tiền món</Copy><Copy testID="menu-total" large>{money(price)}</Copy></View>
          <Button testID="order-review" label="Đặt món · xem lại thông tin" disabled={!storeOpen} onPress={() => { setPendingId(undefined); setPaymentNotice(''); review(); }} />
        </>
      )}

      <Dialog title="Xác nhận đặt món" visible={confirmCod} onClose={() => setConfirmCod(false)}>
        <OrderSummary order={{ ...draft, method: 'COD' }} />
        <Copy muted>Bạn sẽ thanh toán {money(draft.price)} khi nhận hàng.</Copy>
        <Button testID="cod-confirm" label="Xác nhận đơn này" disabled={!storeOpen} onPress={submitCod} />
        <Button secondary label="Huỷ, quay lại thanh toán" onPress={() => setConfirmCod(false)} />
      </Dialog>

      <Dialog title={method === 'momo' ? 'Thanh toán MoMo' : 'Thanh toán ngân hàng'} visible={!!qr} onClose={() => setQr(undefined)}>
        {qr && <>
          <Copy>Mã đơn: {qr.id} · QR01</Copy>
          <QrPreview key={qr.expiresAt} expiresAt={qr.expiresAt} amount={draft.price} disabled={!storeOpen || pending?.status === 'cancelled'} onPaid={confirmPayment}
            onFailed={() => { setQr(undefined); setPaymentNotice('Giao dịch thất bại (mô phỏng). Hãy chọn lại hình thức thanh toán.'); }}
            onExpired={() => { setQr(undefined); setPaymentNotice('QR đã hết hạn (mô phỏng). Hãy tạo QR mới hoặc chọn thanh toán khi nhận hàng.'); }} />
          {!storeOpen && <Copy>Quán đã đóng; vui lòng liên hệ cửa hàng về đơn đang chờ thanh toán.</Copy>}
          <Button secondary label="Đổi hình thức thanh toán" onPress={() => setQr(undefined)} />
        </>}
      </Dialog>
    </View>
  );
}

const customerStyles = StyleSheet.create({
  timeline: { gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#999', paddingTop: 16 },
  timelineStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
