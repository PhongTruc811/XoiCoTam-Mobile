// File này cấu hình giúp các màn hình dùng chung một địa chỉ backend.

export const E2E_MOCK_BACKEND = process.env.EXPO_PUBLIC_E2E_MOCK_BACKEND === 'true';
const apiUrl = process.env.EXPO_PUBLIC_API_URL;


if (!apiUrl && !E2E_MOCK_BACKEND) {
    throw new Error("Chưa cấu hình EXPO_PUBLIC_API_URL trong .env.local");
}

export const API_BASE_URL = apiUrl?.replace(/\/+$/, '') ?? '';