import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const statusLabels: Record<string, string> = {
  QUEUED: 'Chờ xử lý', RUNNING: 'Đang thực hiện', PREPARED: 'Đã soạn thử',
  SUBMITTED: 'Facebook xác nhận đã gửi', PENDING_APPROVAL: 'Đang chờ duyệt',
  UNKNOWN: 'Cần kiểm tra Facebook', NEEDS_LOGIN: 'Cần đăng nhập Facebook',
  FAILED: 'Chưa gửi được', CANCELLED: 'Đã dừng', SKIPPED: 'Đã bỏ qua',
  COMPLETED: 'Hoàn tất lượt xử lý', ATTENTION: 'Cần kiểm tra',
  INTERRUPTED: 'Bị gián đoạn', MISSED: 'Đã lỡ giờ', PAUSED: 'Đã nghỉ hôm nay',
  BUSY_SKIPPED: 'Bỏ qua do lượt khác đang chạy', FAILED_SKIPPED: 'Không tạo được lượt đăng',
  WAITING: 'Chờ tới giờ', DISABLED: 'Lịch đang tắt',
};
export const statusLabel = (status: string) => statusLabels[status] ?? status;
export const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export const formatCountdown = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest].slice(hours ? 0 : 1).map(value => String(value).padStart(2, '0')).join(':');
};
export type PendingPost = { requestId: string; groupIds: string[] };
const pendingKey = 'daily-post-pending';
export async function readPending(): Promise<PendingPost | null> {
  try {
    const value = Platform.OS === 'web' ? sessionStorage.getItem(pendingKey) : await SecureStore.getItemAsync(pendingKey);
    return value ? JSON.parse(value) as PendingPost : null;
  } catch { return null; }
}
export async function writePending(value: PendingPost | null) {
  if (Platform.OS === 'web') {
    if (value) sessionStorage.setItem(pendingKey, JSON.stringify(value));
    else sessionStorage.removeItem(pendingKey);
  } else if (value) await SecureStore.setItemAsync(pendingKey, JSON.stringify(value));
  else await SecureStore.deleteItemAsync(pendingKey);
}
