const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const file = path.join(path.dirname(require.resolve('../package.json')), 'src/features/session/use-swipe-back.ts');
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleRef = { exports: {} };
vm.runInNewContext(code, {
  module: moduleRef,
  exports: moduleRef.exports,
  require: name => ['react-native', 'react-native-gesture-handler', 'react-native-reanimated', 'react-native-worklets'].includes(name) ? {} : require(name),
}, { filename: file });
const { isRightSwipeComplete } = moduleRef.exports;

test('back navigation requires a completed right swipe and ignores vertical scrolling', () => {
  assert.equal(isRightSwipeComplete(90, 10), true);
  assert.equal(isRightSwipeComplete(50, 0), false);
  assert.equal(isRightSwipeComplete(90, 100), false);
  assert.equal(isRightSwipeComplete(-90, 0), false);
  assert.equal(isRightSwipeComplete(45, 2, 900), true);
  assert.equal(isRightSwipeComplete(20, 0, 1200), false);
  assert.equal(isRightSwipeComplete(90, 0, 0, 768), false);
});

test('gesture handler captures right swipes and never navigates on left swipes', () => {
  const handlers = {};
  const config = {};
  const fakeNative = { useWindowDimensions: () => ({ width: 375 }) };
  const fakeReanimated = {
    useSharedValue: value => ({ get: () => value, set: next => { value = next; } }), useAnimatedStyle: callback => callback(),
    withTiming: (value, _, callback) => { callback?.(true); return value; },
    withSpring: value => value, cancelAnimation: () => {},
    Easing: { out: value => value, cubic: () => {} }, ReduceMotion: { System: 'system' },
  };
  const builder = {};
  for (const name of ['activeOffsetX', 'failOffsetX', 'failOffsetY', 'maxPointers', 'runOnJS', 'simultaneousWithExternalGesture']) {
    builder[name] = value => { config[name] = value; return builder; };
  }
  for (const name of ['onStart', 'onUpdate', 'onEnd', 'onFinalize']) {
    builder[name] = callback => { handlers[name] = callback; return builder; };
  }
  const hookModule = { exports: {} };
  vm.runInNewContext(code, {
    module: hookModule,
    exports: hookModule.exports,
    require: name => name === 'react-native'
      ? fakeNative
      : name === 'react-native-gesture-handler'
        ? { Gesture: { Pan: () => builder, Native: () => ({ nativeScroll: true }) } }
      : name === 'react-native-reanimated' ? fakeReanimated
      : name === 'react-native-worklets' ? { scheduleOnRN: callback => callback() }
      : name === 'react'
        ? { useEffect: callback => callback(), useMemo: initialize => initialize() }
        : require(name),
  }, { filename: file });

  let backs = 0;
  hookModule.exports.useSwipeBack(() => backs++);
  assert.equal(config.activeOffsetX, 14);
  assert.equal(config.failOffsetX, -14);
  assert.equal(config.simultaneousWithExternalGesture.nativeScroll, true);
  handlers.onEnd({ translationX: -90, translationY: 0, velocityX: 0 }, true);
  assert.equal(backs, 0);
  handlers.onEnd({ translationX: 90, translationY: 0, velocityX: 0 }, true);
  assert.equal(backs, 1);
});
