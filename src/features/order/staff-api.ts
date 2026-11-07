import { fetch } from 'expo/fetch';

import { API_BASE_URL } from '@/config/api';

export type StaffOrder = {
  id: string; menuItemId: string; menuName: string; price: number; total: number;
  status: string; payment: string; method: string; name: string; phone: string;
  address: string; note: string | null; createdAt: string;
  acceptedAt: string | null; acceptedBy: string | null;
};
export type StaffOrdersPage = { items: StaffOrder[]; page: number; size: number; totalElements: number; totalPages: number };
export type StaffIdentity = { username: string; roles: string[] };

export class StaffApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

let csrf: { headerName: string; token: string } | null = null;

async function request<T>(path: string, options: { method?: string; body?: string; csrf?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.csrf) {
    const current = csrf ?? await staffApi.refreshCsrf();
    headers[current.headerName] = current.token;
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET', body: options.body, headers, credentials: 'include',
    });
  } catch {
    throw new StaffApiError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', 0);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const fallback: Record<number, string> = {
      401: 'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.',
      403: 'Không có quyền thực hiện hoặc mã CSRF đã hết hạn.',
      404: 'Không tìm thấy đơn hàng.',
      409: 'Đơn đã chuyển trạng thái và không thể tiếp nhận.',
    };
    throw new StaffApiError(payload?.message || fallback[response.status] || `Máy chủ trả lỗi HTTP ${response.status}.`, response.status);
  }
  return response.status === 204 ? null as T : response.json() as Promise<T>;
}

export const staffApi = {
  refreshCsrf: async () => {
    csrf = await request<{ headerName: string; token: string }>('/api/auth/csrf');
    return csrf;
  },
  me: () => request<StaffIdentity>('/api/auth/me'),
  login: async (username: string, password: string) => {
    await staffApi.refreshCsrf();
    await request<{ ok: boolean }>('/api/auth/login', { method: 'POST', csrf: true,
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}` });
    await staffApi.refreshCsrf();
    return staffApi.me();
  },
  logout: async () => {
    await staffApi.refreshCsrf();
    await request<null>('/api/auth/logout', { method: 'POST', csrf: true });
    csrf = null;
  },
  orders: (status: 'NEW' | 'ACCEPTED', page: number) => request<StaffOrdersPage>(`/api/staff/orders?status=${status}&page=${page}&size=20`),
  detail: (id: string) => request<StaffOrder>(`/api/staff/orders/${encodeURIComponent(id)}`),
  accept: async (id: string) => {
    await staffApi.refreshCsrf();
    return request<StaffOrder>(`/api/staff/orders/${encodeURIComponent(id)}/accept`, { method: 'POST', csrf: true });
  },
};

export const canUseStaffOrders = (identity: StaffIdentity) =>
  identity.roles.some(role => ['ROLE_STAFF', 'ROLE_BOSS', 'ROLE_ADMIN'].includes(role));
