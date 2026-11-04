const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getEntryScreen } = require('../src/features/session/navigation.ts');
const { initialConnectionState, connectionReducer } = require('../src/features/be-connection/model.ts');

test('connection stays visible until the success popup delay has ended', () => {
  let state = connectionReducer(initialConnectionState, { type: 'checking' });
  assert.equal(getEntryScreen(state.brandThemeEnabled, null, null, null), 'index');
  state = connectionReducer(state, { type: 'success' });
  assert.equal(getEntryScreen(state.brandThemeEnabled, null, null, null), 'index');
  state = connectionReducer(state, { type: 'reveal' });
  assert.equal(getEntryScreen(state.brandThemeEnabled, null, null, null), 'roles');
});

test('first selection contains only customer and employee branches', () => {
  assert.equal(getEntryScreen(true, 'customer', null, null), 'customer-options');
  assert.equal(getEntryScreen(true, 'employee', null, null, false, null, true), 'employee-roles');
});

test('customer chooses account UI or immediate guest ordering', () => {
  assert.equal(getEntryScreen(true, 'customer', 'account', null), 'customer-account');
  assert.equal(getEntryScreen(true, 'customer', 'guest', 'customer'), 'customer');
});

test('employee chooses a dedicated staff, shipper or manager workspace', () => {
  for (const role of ['staff', 'boss']) {
    assert.equal(getEntryScreen(true, 'employee', null, role, false, null, true), role);
  }
  assert.equal(getEntryScreen(true, 'employee', null, 'customer', false, null, true), 'employee-roles');
});

test('shipper must choose an identity before entering the workspace', () => {
  assert.equal(getEntryScreen(true, 'employee', null, 'shipper', false, null, true), 'shipper-identity');
  for (const name of ['Bố Khanh', 'Techim (Heo)', 'Bobo']) {
    assert.equal(getEntryScreen(true, 'employee', null, 'shipper', false, name, true), 'shipper');
  }
  assert.equal(getEntryScreen(true, 'employee', null, 'shipper', false, null, true), 'shipper-identity');
  assert.equal(getEntryScreen(false, 'employee', null, 'shipper', false, 'Bobo'), 'index');
});

test('employee routes remain unavailable before a correct six-digit PIN', () => {
  const { isEmployeePinValid } = require('../src/features/session/employee-pin.ts');
  for (const pin of ['', '24681', '2468100', 'abcdef', '000000']) assert.equal(isEmployeePinValid(pin), false);
  assert.equal(isEmployeePinValid('246810'), true);
  for (const role of [null, 'staff', 'boss', 'shipper']) {
    assert.equal(getEntryScreen(true, 'employee', null, role, false, 'Bobo', false), 'roles');
  }
});

test('back to connection keeps the successful check available for continuation', () => {
  assert.equal(getEntryScreen(true, null, null, null, true), 'index');
  assert.equal(getEntryScreen(true, null, null, null, false), 'roles');
});

test('a fresh session requires a new connection check', () => {
  assert.equal(getEntryScreen(false, 'customer', 'guest', 'customer'), 'index');
});
