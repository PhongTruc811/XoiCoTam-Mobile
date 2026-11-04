export type ConnectionStatus = 'idle' | 'checking' | 'success' | 'error';
export const SUCCESS_REVEAL_DELAY_MS = 2500;

export type ConnectionState = {
  status: ConnectionStatus;
  message: string;
  brandThemeEnabled: boolean;
};

export type ConnectionAction =
  | { type: 'checking' }
  | { type: 'success' }
  | { type: 'reveal' }
  | { type: 'error'; message: string };

export const initialConnectionState: ConnectionState = {
  status: 'idle',
  message: 'Nhấn nút bên dưới để kiểm tra kết nối.',
  brandThemeEnabled: false,
};

export function connectionReducer(
  state: ConnectionState,
  action: ConnectionAction
): ConnectionState {
  switch (action.type) {
    case 'checking':
      return { ...state, status: 'checking', message: 'Đang kết nối đến máy chủ…' };
    case 'success':
      return {
        status: 'success',
        message: 'Kết nối thành công. Đang mở ứng dụng…',
        brandThemeEnabled: state.brandThemeEnabled,
      };
    case 'reveal':
      return { ...state, brandThemeEnabled: true };
    case 'error':
      return { ...state, status: 'error', message: action.message };
  }
}

export async function verifyBackendConnection(
  baseUrl: string,
  signal: AbortSignal,
  mode: 'live' | 'mock' = 'live'
) {
  if (signal.aborted) {
    const error = new Error('Kết nối đã bị huỷ.');
    error.name = 'AbortError';
    throw error;
  }
  // Only the explicitly configured E2E build uses a simulated connection.
  if (mode === 'mock') return;

  const response = await fetch(
    `${baseUrl.replace(/\/$/, '')}/api/backend-status`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Máy chủ trả về HTTP ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (
    typeof data !== 'object' ||
    data === null ||
    !('status' in data) ||
    data.status !== 'SUCCESS'
  ) {
    throw new Error('Máy chủ trả về dữ liệu không như mong đợi.');
  }
}
