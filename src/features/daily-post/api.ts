import { File as ExpoFile } from 'expo-file-system';
import { fetch } from 'expo/fetch';
import { Platform } from 'react-native';

import { API_BASE_URL } from '@/config/api';

export type Group = { id: string; name: string; url: string };
export type Asset = { name: string; url: string; bytes: number };
export type Content = { text: string; images: Asset[]; groups: Group[] };
export type Settings = { enabled: boolean; times: string[]; pausedDay: string | null };
export type ScheduleEntry = { time: string; outcome: string };
export type Schedule = { status: string; enabled: boolean; times: string[]; nextRunAt: number | null; entries: ScheduleEntry[]; busy: boolean };
export type JobItem = { group: Group; status: string; message: string; postUrl?: string | null };
export type Job = { id: string; source: string; createdAt: string; status: string; mode: 'LIVE' | 'PREPARE'; items: JobItem[] };
export type Dashboard = {
  content: Content; settings: Settings; schedule: Schedule; mode: 'LIVE' | 'PREPARE';
  busy: boolean; today: string; jobs: Job[]; slots: { key: string; outcome: string }[];
  cooldowns: Record<string, number>;
};
export type Upload = { uri: string; name: string; type: string; size: number; file?: File };

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, method = 'GET', body?: BodyInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (method !== 'GET') {
    const csrf = await request<{ headerName: string; token: string }>('/api/auth/csrf');
    headers[csrf.headerName] = csrf.token;
    if (typeof body === 'string' && path !== '/api/auth/login') headers['Content-Type'] = 'application/json';
    if (path === '/api/auth/login') headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method, body, headers, credentials: 'include' });
  } catch {
    throw new ApiError(path === '/api/content'
      ? 'Không tải ảnh lên được. Kiểm tra ảnh và kết nối rồi thử lại.'
      : 'Không kết nối được với laptop. Kiểm tra mạng rồi thử lại.', 0);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(payload?.message || (response.status === 401
      ? 'Phiên đăng nhập đã hết hoặc thông tin đăng nhập chưa đúng.'
      : `Không thực hiện được (HTTP ${response.status}).`), response.status);
  }
  return response.status === 204 ? null as T : response.json() as Promise<T>;
}

export const dailyApi = {
  me: () => request<{ username: string }>('/api/auth/me'),
  login: (username: string, password: string) => request<{ ok: boolean }>('/api/auth/login', 'POST',
    `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`),
  logout: () => request<null>('/api/auth/logout', 'POST'),
  dashboard: () => request<Dashboard>('/api/dashboard'),
  saveSettings: (enabled: boolean, times: string[]) => request<Settings>('/api/settings', 'PUT', JSON.stringify({ enabled, times })),
  post: (requestId: string, groupIds: string[]) => request<{ id: string; status: string }>('/api/jobs', 'POST', JSON.stringify({ requestId, groupIds })),
  pause: () => request<Settings>('/api/pause-today', 'POST'),
  resume: () => request<Settings>('/api/resume-today', 'POST'),
  deleteJob: (id: string) => request<null>(`/api/jobs/${encodeURIComponent(id)}`, 'DELETE'),
  deleteAll: () => request<null>('/api/jobs', 'DELETE'),
  saveContent: (text: string, retained: string[], uploads: Upload[]) => {
    const form = new FormData();
    form.append('text', text);
    retained.forEach(name => form.append('retained', name));
    for (const upload of uploads) {
      if (Platform.OS === 'web') {
        if (!upload.file) throw new ApiError('Không đọc được ảnh đã chọn. Vui lòng chọn lại ảnh.', 0);
        form.append('images', upload.file, upload.name);
      } else {
        const file = new ExpoFile(upload.uri);
        if (!file.exists || file.size === 0) throw new ApiError('Ảnh đã chọn không còn trên điện thoại. Vui lòng chọn lại ảnh.', 0);
        form.append('images', file, upload.name);
      }
    }
    return request<Content>('/api/content', 'POST', form);
  },
};

export const imageUrl = (path: string) => `${API_BASE_URL}${path}`;
