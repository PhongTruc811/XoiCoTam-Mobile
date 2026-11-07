import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useRoleSession } from '@/features/session/provider';
import { money } from './model';
import { StaffApiError, staffApi, type StaffOrder, type StaffOrdersPage } from './staff-api';
import { Badge, Button, Card, Copy, Dialog, Empty, SectionTitle, styles } from './ui';

export function StaffView({ page }: { page: string }) {
  const { staffIdentity, staffSessionExpired } = useRoleSession();
  const status = page === 'ready' ? 'ACCEPTED' : 'NEW';
  const [pageNumber, setPageNumber] = useState(0);
  const [ordersPage, setOrdersPage] = useState<StaffOrdersPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<StaffOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof StaffApiError && cause.status === 401) staffSessionExpired();
    return cause instanceof Error ? cause.message : 'Không thể tải dữ liệu. Vui lòng thử lại.';
  }, [staffSessionExpired]);
  const load = useCallback(async (targetPage: number) => {
    if (!staffIdentity) return;
    setLoading(true); setError('');
    try { const result = await staffApi.orders(status, targetPage); setOrdersPage(result); setPageNumber(targetPage); }
    catch (cause) { setError(handleError(cause)); }
    finally { setLoading(false); }
  }, [staffIdentity, status, handleError]);
  useEffect(() => {
    const timer = setTimeout(() => void load(0), 0);
    return () => clearTimeout(timer);
  }, [load]);
  async function openDetail(id: string) {
    setDetailLoading(true); setDetailError(''); setSelected(null);
    try { setSelected(await staffApi.detail(id)); }
    catch (cause) { setDetailError(handleError(cause)); }
    finally { setDetailLoading(false); }
  }
  async function accept() {
    if (!selected || accepting) return;
    setAccepting(true); setDetailError('');
    try { const saved = await staffApi.accept(selected.id); setSelected(saved); await load(0); }
    catch (cause) { setDetailError(handleError(cause)); }
    finally { setAccepting(false); }
  }
  return <View style={styles.gap}>
    <SectionTitle eyebrow="Quầy tiếp nhận" title={status === 'NEW' ? 'Đơn mới' : 'Đã tiếp nhận'} description="Đơn COD được tải từ máy chủ." />
    <View style={styles.row}><Badge label={`${ordersPage?.totalElements ?? 0} đơn ${status}`} /><Button secondary label="Tải lại" onPress={() => void load(0)} disabled={loading} /></View>
    {loading && <ActivityIndicator accessibilityLabel="Đang tải đơn" />}
    {!!error && <Card><ThemedText accessibilityLiveRegion="polite">{error}</ThemedText><Button label="Thử lại" onPress={() => void load(pageNumber)} /></Card>}
    {!loading && !error && ordersPage?.items.length === 0 && <Empty>Chưa có đơn {status}.</Empty>}
    {!error && ordersPage?.items.map(order => <Card key={order.id}>
      <View style={styles.row}><ThemedText type="smallBold">#{order.id.slice(0, 8)}</ThemedText><Badge label={order.status} /></View>
      <Copy>{order.menuName} · {money(order.total)}</Copy><Copy muted>{order.name} · {order.phone}</Copy>
      <Button secondary label="Xem chi tiết" testID={`staff-detail-${order.id}`} onPress={() => void openDetail(order.id)} />
    </Card>)}
    {!error && !!ordersPage && ordersPage.totalPages > 1 && <View style={styles.row}>
      <Button secondary label="Trang trước" disabled={loading || pageNumber === 0} onPress={() => void load(pageNumber - 1)} />
      <Copy>Trang {pageNumber + 1}/{ordersPage.totalPages}</Copy>
      <Button secondary label="Trang sau" disabled={loading || pageNumber + 1 >= ordersPage.totalPages} onPress={() => void load(pageNumber + 1)} />
    </View>}
    <Dialog title="Chi tiết đơn COD" visible={detailLoading || !!selected || !!detailError} onClose={() => { setSelected(null); setDetailError(''); }}>
      {detailLoading && <ActivityIndicator accessibilityLabel="Đang tải chi tiết" />}
      {!!detailError && <ThemedText accessibilityLiveRegion="polite">{detailError}</ThemedText>}
      {selected && <>
        <View style={styles.row}><ThemedText type="smallBold">#{selected.id}</ThemedText><Badge label={selected.status} /></View>
        <Copy>{selected.menuName} · {money(selected.price)}</Copy>
        <Copy>Tổng tiền: {money(selected.total)} · {selected.method} · {selected.payment}</Copy>
        <Copy>{selected.name} · {selected.phone}</Copy><Copy>{selected.address}</Copy>
        {!!selected.note && <Copy>Ghi chú: {selected.note}</Copy>}
        <Copy muted>Đặt lúc: {selected.createdAt}</Copy>
        {selected.acceptedAt && <Copy muted>Tiếp nhận lúc: {selected.acceptedAt} · {selected.acceptedBy}</Copy>}
        {selected.status === 'NEW' && <Button label={accepting ? 'Đang tiếp nhận…' : 'Tiếp nhận đơn'} disabled={accepting} testID={`staff-accept-${selected.id}`} onPress={() => void accept()} />}
        {selected.status === 'ACCEPTED' && <Copy muted>Chưa có thao tác bàn giao hoặc giao hàng trên máy chủ.</Copy>}
      </>}
    </Dialog>
  </View>;
}
