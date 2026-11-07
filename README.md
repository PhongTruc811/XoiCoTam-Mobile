# Xôi Cô Tấm Mobile

Ứng dụng di động của dự án **Xôi Cô Tấm**, xây dựng với React Native, Expo và TypeScript. App giới thiệu trải nghiệm đặt món và quản lý giao nhận theo từng vai trò.

## Tổng quan

Ứng dụng hiện có luồng kiểm tra kết nối máy chủ, chọn nhóm người dùng và mở giao diện theo vai trò:

| Vai trò | Trải nghiệm chính |
| --- | --- |
| **Khách hàng** | Chọn món, nhập thông tin nhận hàng, xem lại đơn và theo dõi trạng thái. |
| **Nhân viên** | Đăng nhập bằng tài khoản STAFF, xem và tiếp nhận đơn COD từ backend. |
| **Shipper** | Xem đơn được giao, thông tin nhận hàng và cập nhật quá trình giao. |
| **Quản lý** | Theo dõi trạng thái hoạt động của quán và tình hình đơn hàng. |

Giao diện đăng nhập/đăng ký và một số bước trong quy trình được dựng để minh họa trải nghiệm sản phẩm.

## Trạng thái hiện tại

Đây là **bản prototype đang phát triển**. Ứng dụng có thể kiểm tra kết nối với backend; các thao tác đặt hàng, lưu trạng thái đơn, thanh toán QR, thu tiền và hoàn tiền hiện được mô phỏng trong app. Đơn mẫu chỉ tồn tại trong phiên chạy và không đại diện cho giao dịch thật.

Nhánh nhân viên đăng nhập qua backend và cần tài khoản STAFF hợp lệ. Hình ảnh món ăn chỉ mang tính minh họa.

## Công nghệ và cấu trúc

- **Expo SDK 58**, **React Native 0.88** và **TypeScript**.
- **Expo Router** quản lý màn hình và điều hướng.
- **Reanimated** và **Gesture Handler** hỗ trợ chuyển động và thao tác vuốt.
- Cấu trúc theo tính năng, với các phần chính trong `src/features/`:
  - `be-connection/`: kiểm tra kết nối backend.
  - `session/`: phiên sử dụng, chọn vai trò và điều hướng.
  - `order/`: giao diện và trạng thái đơn hàng mẫu.
- `src/app/` chứa route; `src/components/` chứa thành phần giao diện dùng chung.

## Chạy ứng dụng

Tại thư mục dự án mobile:

```bash
npm ci
```

Tạo `.env.local` cạnh `package.json`, rồi cấu hình URL gốc của backend:

```dotenv
EXPO_PUBLIC_API_URL=http://<dia-chi-backend>:<cong>
```

Ứng dụng kiểm tra endpoint `GET /api/backend-status`. Backend cần trả về HTTP thành công và JSON có `"status": "SUCCESS"`.

Khởi động Expo:

```bash
npm start
```

Có thể chọn mở ứng dụng trên thiết bị hoặc môi trường chạy được Expo hỗ trợ. Trên điện thoại thật, địa chỉ backend phải truy cập được từ điện thoại; `localhost` sẽ trỏ về chính điện thoại.

Khi laptop đổi Wi-Fi hoặc nhận IP mới, chạy script từ thư mục gốc dự án để cập nhật `.env.local` theo IPv4 Wi-Fi hiện tại:

```powershell
.\scripts\Check-EXPO_PUBLIC_API_URL.ps1
```

Script in URL hiện có, tên Wi-Fi (SSID) và IPv4 Wi-Fi hiện tại. Nếu hai IP khác nhau, chọn `y` để cập nhật `.env.local` hoặc `n` để kết thúc mà không sửa file. Nếu hai IP đã khớp, script chuyển thẳng đến câu hỏi chạy Expo. Sau khi cập nhật, script cũng hỏi có chạy `npx expo start` trong thư mục mobile không: `y` để chạy, `n` để bỏ qua. Cổng backend mặc định là `8080`; có thể đổi bằng `-Port 8081`. Nếu có nhiều adapter Wi-Fi đang hoạt động, chọn bằng `-InterfaceAlias 'Wi-Fi'`. Nếu Expo đã chạy, chọn `n` rồi **Reload** app trong Expo Go để nhận URL mới. iPhone và laptop cần ở cùng mạng Wi-Fi.

## Dành cho nhà phát triển

Các lệnh thường dùng:

```bash
npm run lint
npm run typecheck
npm test
```

Tài liệu thiết kế và kịch bản kiểm thử nằm trong [docs](./docs/) và [Mobile_Testing.md](./Mobile_Testing.md).

## Tài liệu

- [Phác thảo luồng đặt món](./docs/online-order-prototype.md)
- [Nguyên tắc tổ chức mã nguồn](./docs/Design-Patterns.md)
- [Hướng dẫn kiểm thử mobile](./Mobile_Testing.md)

---

[Expo](https://expo.dev) · React Native · TypeScript
