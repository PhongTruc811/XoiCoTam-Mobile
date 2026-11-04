const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createDemoState, demoReducer, validateCustomer, qrRemainingSeconds, shipperNames, getShipperOrders } = require('../src/features/order/model.ts');
const customer = { name: 'Khách mẫu', phone: '0900000000', address: 'Địa chỉ mẫu', note: '' };
const order = { ...customer, id: 'XCT-1005', price: 25000, status: 'new', payment: 'unpaid', method: 'COD', createdAt: '08:00' };

test('customer must enter valid recipient information and choose a supported meal price', () => {
  assert.deepEqual(validateCustomer(customer), {});
  assert.equal(Object.keys(validateCustomer({ ...customer, name: '', phone: '123', address: '' })).length, 3);
  assert.deepEqual(validateCustomer({ ...customer, phone: '+84900000000' }), {});
  const state = createDemoState();
  assert.equal(demoReducer(state, { type: 'create', order: { ...order, price: 10000 } }), state);
  assert.equal(demoReducer(state, { type: 'create', order: { ...order, phone: '' } }), state);
});

test('boss closing the shop blocks new orders and prepayment; reopening allows orders', () => {
  let state = demoReducer(createDemoState(), { type: 'store', open: false });
  assert.equal(demoReducer(state, { type: 'create', order }), state);
  state = demoReducer(state, { type: 'store', open: true });
  state = demoReducer(state, { type: 'create', order: { ...order, method: 'QR01' } });
  state = demoReducer(state, { type: 'store', open: false });
  state = demoReducer(state, { type: 'pay', id: order.id, method: 'QR01', at: 'now' });
  assert.equal(state.orders.find(item => item.id === order.id).payment, 'unpaid');
});

test('one COD order travels from customer to staff to shipper; payment is required to finish', () => {
  let state = demoReducer(createDemoState(), { type: 'create', order });
  assert.ok(state.customerOrderIds.includes(order.id));
  state = demoReducer(state, { type: 'accept', id: order.id });
  assert.equal(state.orders.find(item => item.id === order.id).status, 'ready');
  state = demoReducer(state, { type: 'handoff', id: order.id, shipper: shipperNames[0] });
  assert.equal(state.orders.find(item => item.id === order.id).status, 'delivering');
  state = demoReducer(state, { type: 'finish', id: order.id });
  assert.equal(state.orders.find(item => item.id === order.id).status, 'delivering');
  state = demoReducer(state, { type: 'pay', id: order.id, method: 'CASH', at: '2026-10-12 08:30' });
  state = demoReducer(state, { type: 'finish', id: order.id });
  const finished = state.orders.find(item => item.id === order.id);
  assert.equal(finished.status, 'finished');
  assert.equal(finished.method, 'CASH');
  assert.equal(finished.paidAt, '2026-10-12 08:30');
});

test('staff waits for prepaid QR success; COD fallback updates the same order', () => {
  let state = demoReducer(createDemoState(), { type: 'create', order: { ...order, method: 'QR01' } });
  state = demoReducer(state, { type: 'accept', id: order.id });
  assert.equal(state.orders.find(item => item.id === order.id).status, 'new');
  state = demoReducer(state, { type: 'cod', id: order.id });
  state = demoReducer(state, { type: 'accept', id: order.id });
  assert.equal(state.orders.find(item => item.id === order.id).status, 'ready');
  assert.equal(state.orders.filter(item => item.id === order.id).length, 1);
});

test('prepaid orders do not collect a second payment on delivery', () => {
  let state = createDemoState();
  state = demoReducer(state, { type: 'pay', id: 'XCT-1003', method: 'CASH', at: 'later' });
  const current = state.orders.find(item => item.id === 'XCT-1003');
  assert.equal(current.method, 'QR01');
  state = demoReducer(state, { type: 'finish', id: current.id });
  assert.equal(state.orders.find(item => item.id === current.id).status, 'finished');
});

test('QR03 and fallback QR02 record their own payment method and timestamp', () => {
  for (const method of ['QR03', 'QR02']) {
    const state = demoReducer(createDemoState(), { type: 'pay', id: 'XCT-1004', method, at: '08:45' });
    const paid = state.orders.find(item => item.id === 'XCT-1004');
    assert.equal(paid.payment, 'paid');
    assert.equal(paid.method, method);
    assert.equal(paid.paidAt, '08:45');
  }
});

test('closed-shop cancellation requires contact and refund confirmation for paid orders', () => {
  let state = demoReducer(createDemoState(), { type: 'store', open: false });
  state = demoReducer(state, { type: 'cancel', id: 'XCT-1001', contacted: false, refundConfirmed: true });
  assert.equal(state.orders[0].status, 'new');
  state = demoReducer(state, { type: 'cancel', id: 'XCT-1001', contacted: true, refundConfirmed: false });
  assert.equal(state.orders[0].status, 'new');
  state = demoReducer(state, { type: 'cancel', id: 'XCT-1001', contacted: true, refundConfirmed: true });
  assert.equal(state.orders[0].status, 'cancelled');
  assert.equal(state.orders[0].payment, 'refunded');
  state = demoReducer(state, { type: 'cancel', id: 'XCT-1002', contacted: true, refundConfirmed: false });
  assert.equal(state.orders[1].status, 'cancelled');
  assert.equal(state.orders[1].payment, 'unpaid');
});

test('closing the shop does not cancel deliveries already in progress', () => {
  let state = demoReducer(createDemoState(), { type: 'store', open: false });
  state = demoReducer(state, { type: 'cancel', id: 'XCT-1004', contacted: true, refundConfirmed: true });
  assert.equal(state.orders[3].status, 'delivering');
  state = demoReducer(state, { type: 'pay', id: 'XCT-1004', method: 'CASH', at: 'now' });
  state = demoReducer(state, { type: 'finish', id: 'XCT-1004' });
  assert.equal(state.orders[3].status, 'finished');
});

test('QR countdown has a strict 15-minute deadline and never goes negative', () => {
  const issuedAt = 1000;
  const expiresAt = issuedAt + 900000;
  assert.equal(qrRemainingSeconds(expiresAt, issuedAt), 900);
  assert.equal(qrRemainingSeconds(expiresAt, expiresAt - 1), 1);
  assert.equal(qrRemainingSeconds(expiresAt, expiresAt), 0);
  assert.equal(qrRemainingSeconds(expiresAt, expiresAt + 1000), 0);
});

test('reset restores fresh demo orders without retaining changes from the last session', () => {
  const initial = createDemoState();
  const changed = demoReducer(initial, { type: 'accept', id: 'XCT-1001' });
  assert.equal(initial.orders[0].status, 'new');
  assert.equal(changed.orders[0].status, 'ready');
  const reset = demoReducer(changed, { type: 'reset' });
  assert.equal(reset.orders[0].status, 'new');
  assert.notEqual(reset.orders[0], initial.orders[0]);
});

test('handoff accepts only the three configured sample shippers', () => {
  assert.deepEqual([...shipperNames], ['Bố Khanh', 'Techim (Heo)', 'Bobo']);
  let state = demoReducer(createDemoState(), { type: 'handoff', id: 'XCT-1001', shipper: shipperNames[1] });
  assert.equal(state.orders[0].shipper, undefined);
  state = demoReducer(state, { type: 'accept', id: 'XCT-1001' });
  state = demoReducer(state, { type: 'handoff', id: 'XCT-1001', shipper: 'Người khác' });
  assert.equal(state.orders[0].shipper, undefined);
  state = demoReducer(state, { type: 'handoff', id: 'XCT-1001', shipper: shipperNames[1] });
  assert.equal(state.orders[0].shipper, shipperNames[1]);
  assert.equal(state.orders[0].status, 'delivering');
  state = demoReducer(state, { type: 'handoff', id: 'XCT-1001', shipper: shipperNames[2] });
  assert.equal(state.orders[0].shipper, shipperNames[1]);
});

test('each shipper sees only their own active and completed orders after handoff', () => {
  let state = createDemoState();
  for (const [index, shipper] of shipperNames.entries()) {
    const id = 'OWN-' + index;
    state = demoReducer(state, { type: 'create', order: { ...order, id } });
    state = demoReducer(state, { type: 'accept', id });
    state = demoReducer(state, { type: 'handoff', id, shipper });
    assert.ok(getShipperOrders(state.orders, shipper, 'delivering').some(item => item.id === id));
    state = demoReducer(state, { type: 'pay', id, method: 'CASH', at: 'now' });
    state = demoReducer(state, { type: 'finish', id });
    assert.ok(!getShipperOrders(state.orders, shipper, 'delivering').some(item => item.id === id));
  }
  for (const [index, shipper] of shipperNames.entries()) {
    assert.deepEqual(getShipperOrders(state.orders, shipper, 'finished').map(item => item.id), ['OWN-' + index]);
    assert.ok(getShipperOrders(state.orders, shipper, 'delivering').every(item => item.shipper === shipper));
  }
  assert.deepEqual(getShipperOrders(state.orders, null, 'delivering'), []);
  assert.deepEqual(getShipperOrders(state.orders, null, 'finished'), []);
});
