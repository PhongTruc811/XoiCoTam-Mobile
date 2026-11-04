export type Role = 'customer' | 'staff' | 'shipper' | 'boss';

export const roles: { id: Role; label: string; caption: string; symbol: string }[] = [
  { id: 'customer', label: 'Khách hàng', caption: 'Đặt món online', symbol: '01' },
  { id: 'staff', label: 'Nhân viên cửa hàng', caption: 'Tiếp nhận & chuẩn bị', symbol: '02' },
  { id: 'shipper', label: 'Shipper', caption: 'Giao hàng', symbol: '03' },
  { id: 'boss', label: 'Quản lý', caption: 'Điều hành cửa hàng', symbol: '04' },
];
