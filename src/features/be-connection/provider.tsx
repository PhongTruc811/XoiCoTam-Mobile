import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from 'react';

import { API_BASE_URL, E2E_MOCK_BACKEND } from '@/config/api';
import {
  connectionReducer,
  initialConnectionState,
  SUCCESS_REVEAL_DELAY_MS,
  verifyBackendConnection,
  type ConnectionState,
} from './model';

type BackendConnectionContextValue = ConnectionState & {
  checkConnection: () => Promise<void>;
};

const BackendConnectionContext = createContext<BackendConnectionContextValue | null>(null);

export function BackendConnectionProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(connectionReducer, initialConnectionState);
  const request = useRef<AbortController | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      request.current?.abort();
      request.current = null;
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = null;
    };
  }, []);

  const checkConnection = useCallback(async () => {
    if (request.current || revealTimer.current) return;

    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10000);
    dispatch({ type: 'checking' });

    try {
      await verifyBackendConnection(API_BASE_URL, controller.signal, E2E_MOCK_BACKEND ? 'mock' : 'live');
      if (request.current === controller) {
        dispatch({ type: 'success' });
        revealTimer.current = setTimeout(() => {
          revealTimer.current = null;
          dispatch({ type: 'reveal' });
        }, SUCCESS_REVEAL_DELAY_MS);
      }
    } catch (error) {
      if (request.current === controller) {
        dispatch({
          type: 'error',
          message: controller.signal.aborted
            ? 'Kết nối quá 10 giây. Kiểm tra máy chủ và Wi-Fi rồi thử lại.'
            : error instanceof Error
              ? error.message
              : 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
        });
      }
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
      }
    }
  }, []);

  const value = useMemo(() => ({ ...state, checkConnection }), [state, checkConnection]);

  return (
    <BackendConnectionContext.Provider value={value}>
      {children}
    </BackendConnectionContext.Provider>
  );
}

export function useBackendConnection() {
  const context = useContext(BackendConnectionContext);
  if (!context) {
    throw new Error('useBackendConnection must be used within BackendConnectionProvider.');
  }
  return context;
}
