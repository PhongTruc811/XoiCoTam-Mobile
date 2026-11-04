export type OrderStatus = 'new' | 'ready' | 'delivering' | 'finished' | 'cancelled';
export type PaymentMethod = 'COD' | 'QR01' | 'CASH' | 'QR03' | 'QR02';
export type MealPrice = 20000 | 25000 | 30000;
export const shipperNames = ['Bố Khanh', 'Techim (Heo)', 'Bobo'] as const;
export type ShipperName = (typeof shipperNames)[number];
export type CustomerDetails = { name: string; phone: string; address: string; note: string };

export type DemoOrder = CustomerDetails & {
  id: string;
  price: MealPrice;
  status: OrderStatus;
  payment: 'unpaid' | 'paid' | 'refunded';
  method: PaymentMethod;
  shipper?: string;
  createdAt: string;
  paidAt?: string;
};

export type DemoState = {
  storeOpen: boolean;
  orders: DemoOrder[];
  customerOrderIds: string[];
};

export type DemoAction =
  | { type: 'store'; open: boolean }
  | { type: 'create'; order: DemoOrder }
  | { type: 'accept'; id: string }
  | { type: 'handoff'; id: string; shipper: string }
  | { type: 'pay'; id: string; method: Exclude<PaymentMethod, 'COD'>; at: string }
  | { type: 'cod'; id: string }
  | { type: 'finish'; id: string }
  | { type: 'cancel'; id: string; contacted: boolean; refundConfirmed: boolean }
  | { type: 'reset' };

export const statusLabels: Record<OrderStatus, string> = {
  new: 'Đơn mới', ready: 'Chờ bàn giao',
  delivering: 'Đang giao', finished: 'Hoàn tất', cancelled: 'Đã huỷ',
};

export const methodLabels: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng', QR01: 'QR trả trước',
  CASH: 'Tiền mặt', QR03: 'QR khi giao hàng', QR02: 'QR tài khoản chủ quán',
};

const samples: DemoOrder[] = [
  { id: 'XCT-1001', name: 'Khách mẫu A', phone: '0900000001', address: 'Địa chỉ mẫu: 12 Nguyễn Văn Cừ, TP.HCM', note: 'Không hành, thêm muỗng.', price: 25000, status: 'new', payment: 'paid', method: 'QR01', createdAt: '07:10', paidAt: '07:11' },
  { id: 'XCT-1002', name: 'Khách mẫu B', phone: '0900000002', address: 'Địa chỉ mẫu: 45 Trần Hưng Đạo, TP.HCM', note: 'Giao ở cổng, gọi trước khi đến.', price: 30000, status: 'ready', payment: 'unpaid', method: 'COD', createdAt: '07:15' },
  { id: 'XCT-1003', name: 'Khách mẫu C', phone: '0900000003', address: 'Địa chỉ mẫu: 28 Nguyễn Trãi, TP.HCM', note: '', price: 20000, status: 'delivering', payment: 'paid', method: 'QR01', shipper: 'Bố Khanh', createdAt: '07:20' },
  { id: 'XCT-1004', name: 'Khách mẫu D', phone: '0900000004', address: 'Địa chỉ mẫu: 60 Lê Văn Sỹ, TP.HCM', note: 'Ít nước sốt.', price: 25000, status: 'delivering', payment: 'unpaid', method: 'COD', shipper: 'Bố Khanh', createdAt: '07:25' },
];

export function createDemoState(): DemoState {
  return { storeOpen: true, orders: samples.map(order => ({ ...order })), customerOrderIds: ['XCT-1001'] };
}

export function getShipperOrders(orders: DemoOrder[], identity: ShipperName | null, status: 'delivering' | 'finished') {
  return orders.filter(order => identity !== null && order.shipper === identity && order.status === status);
}

export function qrRemainingSeconds(expiresAt: number, now: number) {
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

export function money(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

export function validateCustomer(customer: CustomerDetails) {
  const errors: Partial<Record<keyof CustomerDetails, string>> = {};
  if (!customer.name.trim()) errors.name = 'Bạn hãy nhập tên người nhận.';
  if (!/^(0\d{9}|\+84\d{9})$/.test(customer.phone.replace(/\s/g, ''))) {
    errors.phone = 'Nhập số điện thoại hợp lệ: 10 số hoặc +84.';
  }
  if (!customer.address.trim()) errors.address = 'Bạn hãy nhập địa chỉ giao hàng.';
  return errors;
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === 'reset') return createDemoState();
  if (action.type === 'store') return { ...state, storeOpen: action.open };
  if (action.type === 'create') {
    if (!state.storeOpen || state.orders.some(order => order.id === action.order.id)) return state;
    if (Object.keys(validateCustomer(action.order)).length || ![20000, 25000, 30000].includes(action.order.price)) return state;
    return {
      ...state,
      orders: [action.order, ...state.orders],
      customerOrderIds: [action.order.id, ...state.customerOrderIds],
    };
  }
  return {
    ...state,
    orders: state.orders.map(order => {
      if (order.id !== action.id) return order;
      switch (action.type) {
        case 'accept':
          return order.status === 'new' && (order.method === 'COD' || order.payment === 'paid')
            ? { ...order, status: 'ready' } : order;
        case 'handoff':
          return order.status === 'ready' && !order.shipper && shipperNames.includes(action.shipper as typeof shipperNames[number])
            ? { ...order, shipper: action.shipper, status: 'delivering' } : order;
        case 'pay':
          if (order.payment !== 'unpaid') return order;
          if (action.method === 'QR01' && (!state.storeOpen || order.status !== 'new')) return order;
          if (action.method !== 'QR01' && order.status !== 'delivering') return order;
          return { ...order, payment: 'paid', method: action.method, paidAt: action.at };
        case 'cod':
          return state.storeOpen && order.status === 'new' && order.payment === 'unpaid'
            ? { ...order, method: 'COD' } : order;
        case 'finish':
          return order.status === 'delivering' && order.payment === 'paid'
            ? { ...order, status: 'finished' } : order;
        case 'cancel':
          if (state.storeOpen || ['delivering', 'finished', 'cancelled'].includes(order.status)) return order;
          if (!action.contacted || (order.payment === 'paid' && !action.refundConfirmed)) return order;
          return { ...order, status: 'cancelled', payment: order.payment === 'paid' ? 'refunded' : order.payment };
      }
    }),
  };
}
