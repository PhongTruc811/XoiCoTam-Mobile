const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const React = require('react');
const { renderToString } = require('react-dom/server');
const ts = require('typescript');
const babel = require('@babel/core');

const root = path.dirname(require.resolve('../package.json'));
function loadModule(file, code, mocks = {}) {
  const module = { exports: {} };
  const originalRequire = createRequire(file);
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : originalRequire(name),
    process: { env: { ...process.env, NODE_ENV: 'development' } },
  }, { filename: file });
  return module.exports;
}

// Use the installed RN flatten implementation and Expo Router's native Slot guard.
// Host views are stubbed so this native boundary can be exercised without an iOS simulator.
const flattenFile = path.join(root, 'node_modules/react-native/Libraries/StyleSheet/flattenStyle.js');
const flattenCode = babel.transformSync(fs.readFileSync(flattenFile, 'utf8'), {
  filename: flattenFile,
  presets: [require.resolve('@react-native/babel-preset')],
  configFile: false,
  babelrc: false,
}).code;
const flatten = loadModule(flattenFile, flattenCode).default;
const Host = ({ children }) => React.createElement('div', null, children);
let capturedStyles = [];
let capturedStackOptions = [];
const Pressable = ({ style, children }) => {
  capturedStyles.push(style);
  return React.createElement('div', null, children);
};
const native = {
  StyleSheet: { create: styles => styles, flatten },
  Platform: { OS: 'ios' },
  Animated: { View: Host },
  Pressable,
  View: Host,
  ScrollView: Host,
  KeyboardAvoidingView: Host,
};
const slotFile = path.join(root, 'node_modules/expo-router/build/ui/Slot.js');
const { Slot } = loadModule(slotFile, fs.readFileSync(slotFile, 'utf8'), { 'react-native': native });
const Link = ({ children }) => React.createElement(Slot, null, children);

function loadScreen(relativeFile, theme, activeScreen = 'index') {
  const file = path.join(root, relativeFile);
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const model = require('../src/features/order/model.ts');
  const Stack = ({ screenOptions, children }) => {
    capturedStackOptions.push(screenOptions);
    return React.createElement(Host, null, children);
  };
  Stack.Protected = function Protected({ guard, children }) { return guard ? children : null; };
  Stack.Screen = function Screen({ name }) { return React.createElement('div', { 'data-route': name }); };
  return loadModule(file, compiled, {
    'react-native': native,
    'react-native-reanimated': { View: Host },
    'react-native-gesture-handler': { GestureHandlerRootView: Host, GestureDetector: Host },
    'expo-router': { Link, Stack, ThemeProvider: Host, DefaultTheme: { colors: {} }, DarkTheme: { colors: {} }, useLocalSearchParams: () => ({}), router: { setParams: () => {} } },
    'expo-image': { Image: () => null },
    '@/assets/images/logoIcon/logo.png': 1,
    'expo-splash-screen': { preventAutoHideAsync: () => Promise.resolve() },
    'react-native-safe-area-context': { SafeAreaView: Host },
    '@/components/animated-icon': { AnimatedIcon: () => null, AnimatedSplashOverlay: () => null },
    './components/backend-connection-card': { BackendConnectionCard: () => null },
    '@/components/themed-text': { ThemedText: Host },
    '@/components/themed-view': { ThemedView: Host },
    '@/components/ui/demo-display': { Badge: Host, Copy: Host },
    '@/components/web-badge': { WebBadge: () => null },
    '@/constants/theme': { BottomTabInset: 50, MaxContentWidth: 800, Spacing: { one: 4, two: 8, three: 16, four: 24, five: 32 } },
    '@/hooks/use-theme': { useTheme: () => theme },
    '@/hooks/use-color-scheme': { useColorScheme: () => 'light' },
    '@/features/order/provider': { OrderDemoProvider: Host },
    '@/features/order/model': model,
    '@/features/session/navigation': require('../src/features/session/navigation.ts'),
    '@/features/session/model': require('../src/features/session/model.ts'),
    '@/features/be-connection/provider': {
      BackendConnectionProvider: Host,
      useBackendConnection: () => ({ brandThemeEnabled: activeScreen !== 'index', status: 'idle' }),
    },
    '@/features/session/provider': { RoleSessionProvider: Host, useRoleSession: () => ({ activeScreen, shipperIdentity: 'Bố Khanh', goBack: () => {} }) },
    '@/features/session/role/back-button': { BackButton: () => null },
    '@/features/session/role/employee-pin-modal': { EmployeePinModal: () => null },
    '@/features/session/use-swipe-back': { useSwipeBack: () => ({ panHandlers: {}, swipeStyle: {} }) },
    './back-button': { BackButton: () => null },
    '../use-swipe-back': { useSwipeBack: () => ({ panHandlers: {}, swipeStyle: {} }) },
    './provider': { useOrderDemo: () => ({ ...model.createDemoState(), dispatch: () => {} }), useBackendConnection: () => ({ status: 'idle', brandThemeEnabled: false }) },
    '../provider': { useRoleSession: () => ({ goBack: () => {}, chooseAudience: () => {} }) },
    '../model': require('../src/features/session/model.ts'),
    './model': model,
    './ui': {
      Button: () => null, Badge: Host, Card: Host, Choice: () => null, Copy: Host,
      Dialog: () => null, Empty: Host, Notice: Host, OrderSummary: () => null,
      QrPreview: () => null, SectionTitle: () => null,
      styles: { gap: {}, row: {}, flex: {}, button: { minHeight: 48, borderRadius: 14 } },
    },
  });
}

test('native Slot rejects the original array-style shape in development', () => {
  assert.throws(() => renderToString(React.createElement(Slot, null,
    React.createElement(Host, { style: [{ minHeight: 48 }, { borderColor: '#ddd' }] })
  )), /passing an array of styles/);
});

for (const theme of [
  { border: '#E0E1E6', background: '#ffffff' },
  { border: '#EDDCC3', background: '#FFFBF2' },
  { border: '#503B27', background: '#1D140C' },
]) {
  test('connection screen has no link bypassing the connection gate with palette ' + theme.background, () => {
    capturedStyles = [];
    const { ConnectionScreen: HomeScreen } = loadScreen('src/features/be-connection/screen.tsx', theme);
    assert.doesNotThrow(() => renderToString(React.createElement(HomeScreen)));
    assert.equal(capturedStyles.length, 0);
  });

  test('shipper map links render for assigned deliveries with palette ' + theme.background, () => {
    const { ShipperView } = loadScreen('src/features/order/shipper.tsx', theme);
    for (const page of ['delivering']) {
      capturedStyles = [];
      assert.doesNotThrow(() => renderToString(React.createElement(ShipperView, { page })));
      assert.equal(capturedStyles.length, 2);
      for (const style of capturedStyles) {
        assert.equal(style.borderColor, theme.border);
        assert.equal(style.backgroundColor, theme.background);
        assert.equal(style.minHeight, 48);
        assert.equal(Array.isArray(style), false);
      }
    }
  });
}

test('root navigator exposes only the current connection, selection or role screen', () => {
  const { entryScreens } = require('../src/features/session/navigation.ts');
  capturedStackOptions = [];
  for (const activeScreen of entryScreens) {
    const { default: RootLayout } = loadScreen('src/app/_layout.tsx', { border: '#ddd', background: '#fff' }, activeScreen);
    const html = renderToString(React.createElement(RootLayout));
    const exposed = [...html.matchAll(/data-route="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(exposed, [activeScreen]);
  }
  assert.ok(capturedStackOptions.every(options => options.gestureEnabled === false));
});

test('entry screens present only the choices for their current branch', () => {
  const { RoleSelectionScreen, CustomerOptionsScreen, EmployeeRoleScreen } = loadScreen(
    'src/features/session/role/role-selection.tsx', { border: '#ddd', background: '#fff' }
  );
  const first = renderToString(React.createElement(RoleSelectionScreen));
  assert.ok(first.includes('Khách hàng') && first.includes('Nhân viên'));
  assert.ok(!first.includes('Quay lại'));
  assert.ok(!first.includes('Shipper') && !first.includes('Quản lý'));
  const customer = renderToString(React.createElement(CustomerOptionsScreen));
  assert.ok(customer.includes('Đăng ký / Đăng nhập'));
  assert.ok(customer.includes('Đặt món ngay (khách)'));
  assert.ok(!customer.includes('Shipper'));
  const employee = renderToString(React.createElement(EmployeeRoleScreen));
  assert.ok(employee.includes('Shipper') && employee.includes('Quản lý'));
  assert.ok(!employee.includes('Đặt món ngay (khách)'));
});

test('role workspaces do not include the connection screen or a shared role picker', () => {
  const { roles } = require('../src/features/session/model.ts');
  const { RoleWorkspace } = loadScreen('src/features/order/screen.tsx', { border: '#ddd', background: '#fff' });
  for (const role of roles) {
    const html = renderToString(React.createElement(RoleWorkspace, { role: role.id },
      page => React.createElement('span', null, page)
    ));
    assert.ok(html.includes(role.label));
    for (const other of roles.filter(item => item.id !== role.id)) assert.ok(!html.includes(other.label));
    assert.ok(!html.includes('Kiểm tra kết nối'));
    assert.ok(!html.includes('Bản phác thảo tương tác'));
  }
});
