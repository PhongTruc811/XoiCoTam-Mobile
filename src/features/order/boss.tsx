import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

import { money } from './model';
import { useOrderDemo } from './provider';
import { Badge, Button, Card, Copy, Dialog, Notice, SectionTitle, styles } from './ui';

export function BossView({ page }: { page: string }) {
  const { storeOpen, orders, dispatch } = useOrderDemo();
  const [confirmClose, setConfirmClose] = useState(false);
  const waiting = orders.filter(order => ['new', 'ready'].includes(order.status));
  const prepaid = waiting.filter(order => order.payment === 'paid');
  const delivering = orders.filter(order => order.status === 'delivering');
  const finished = orders.filter(order => order.status === 'finished');
  const totals = [
    { label: 'Đơn cần xử lý', value: waiting.length.toString() },
    { label: 'Đang giao', value: delivering.length.toString() },
    { label: 'Đã hoàn tất', value: finished.length.toString() },
  ];
  return (
    <View style={styles.gap}>
      <SectionTitle eyebrow="Chủ quán" title={page === 'store' ? 'Hôm nay quán mình thế nào?' : 'Một góc nhìn về cửa hàng'} description="Theo dõi đơn mẫu và quyết định thời điểm nhận đơn." />
      <Card>
        <View style={styles.row}><ThemedText type="smallBold">Xôi Cô Tấm</ThemedText><Badge label={storeOpen ? 'Đang mở cửa' : 'Đã đóng cửa'} /></View>
        <Copy large>{storeOpen ? 'Sẵn sàng nhận những đơn mới.' : 'Hẹn khách vào ngày mai.'}</Copy>
        <Copy muted>{storeOpen ? 'Khách có thể chọn món, xác nhận đơn và thanh toán.' : 'Khách nhìn thấy thông báo hết món. Nút đặt món bị vô hiệu hoá.'}</Copy>
        <Button label={storeOpen ? 'Đóng quán · ngừng nhận đơn' : 'Mở quán · nhận đơn trở lại'} onPress={() => storeOpen ? setConfirmClose(true) : dispatch({ type: 'store', open: true })} />
      </Card>
      <View style={styles.row}>{totals.map(item => <Card key={item.label} style={{ flex: 1, minWidth: 120 }}><Copy large>{item.value}</Copy><Copy muted>{item.label}</Copy></Card>)}</View>
      <Card>
        <SectionTitle eyebrow="Đối soát đơn mẫu" title="Những khoản cần lưu ý" />
        <View style={styles.row}><Copy>Đơn chưa giao, đã trả trước</Copy><ThemedText type="smallBold">{prepaid.length}</ThemedText></View>
        <View style={styles.row}><Copy>Số tiền cần rà soát nếu hết món</Copy><ThemedText type="smallBold">{money(prepaid.reduce((sum, order) => sum + order.price, 0))}</ThemedText></View>
        <Copy muted>Đây là tổng từ dữ liệu minh hoạ, không phải báo cáo doanh thu thực tế.</Copy>
      </Card>
      {!storeOpen && <Notice title="Staff cần hỗ trợ các khách đã đặt">Đơn chưa giao: liên hệ khách, xử lý hoàn tiền nếu đã thanh toán, rồi huỷ và gỡ khỏi danh sách. Đơn đang giao vẫn tiếp tục được xử lý.</Notice>}
      <Notice title="Thông báo khách sẽ nhìn thấy">{storeOpen ? 'Quán đang nhận đơn. Mời bạn chọn phần xôi yêu thích!' : 'Hôm nay quán đã hết món. Bạn quay lại vào ngày mai nhé!'}</Notice>

      <Dialog title="Đóng quán hôm nay?" visible={confirmClose} onClose={() => setConfirmClose(false)}>
        <Copy>Ngừng nhận đơn mới ngay sau khi xác nhận.</Copy>
        <Copy muted>Còn {waiting.length} đơn chưa giao, trong đó {prepaid.length} đơn đã thanh toán trước. Staff cần liên hệ và hỗ trợ các khách này.</Copy>
        <Copy muted>{delivering.length} đơn đang giao vẫn tiếp tục xử lý.</Copy>
        <Button label="Xác nhận đóng quán" onPress={() => { dispatch({ type: 'store', open: false }); setConfirmClose(false); }} />
        <Button secondary label="Giữ quán mở" onPress={() => setConfirmClose(false)} />
      </Dialog>
    </View>
  );
}
