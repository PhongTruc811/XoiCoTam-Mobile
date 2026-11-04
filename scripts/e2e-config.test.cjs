const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const baseConfig = require('../app.json').expo;

function loadConfig(relativePath, env) {
  const filename = path.join(__dirname, '..', relativePath);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, process: { env } }, { filename });
  return module.exports;
}

test('regular builds still require a backend URL and normalize its trailing slashes', () => {
  assert.throws(() => loadConfig('src/config/api.ts', {}), /EXPO_PUBLIC_API_URL/);
  assert.throws(() => loadConfig('src/config/api.ts', { EXPO_PUBLIC_E2E_MOCK_BACKEND: 'false' }), /EXPO_PUBLIC_API_URL/);
  const config = loadConfig('src/config/api.ts', { EXPO_PUBLIC_API_URL: 'https://example.com///' });
  assert.equal(config.E2E_MOCK_BACKEND, false);
  assert.equal(config.API_BASE_URL, 'https://example.com');
});

test('an explicitly enabled mock build does not require a backend URL', () => {
  const config = loadConfig('src/config/api.ts', { EXPO_PUBLIC_E2E_MOCK_BACKEND: 'true' });
  assert.equal(config.E2E_MOCK_BACKEND, true);
  assert.equal(config.API_BASE_URL, '');
});

test('E2E app identity is isolated and existing Expo project metadata is preserved', () => {
  const config = { ...baseConfig, extra: { eas: { projectId: 'existing-project' } } };
  const regular = loadConfig('app.config.ts', {}).default({ config });
  assert.equal(regular.name, baseConfig.name);
  assert.equal(regular.ios.bundleIdentifier, 'com.xoicotam.mobile');
  assert.equal(regular.scheme, baseConfig.scheme);
  const e2e = loadConfig('app.config.ts', { EXPO_PUBLIC_E2E_MOCK_BACKEND: 'true' }).default({ config });
  assert.equal(e2e.name, 'XoiCoTam E2E');
  assert.equal(e2e.ios.bundleIdentifier, 'com.xoicotam.mobile.e2e');
  assert.equal(e2e.scheme, 'xoicotam-e2e');
  assert.equal(e2e.slug, config.slug);
  assert.equal(e2e.extra.eas.projectId, 'existing-project');
  assert.equal(e2e.plugins, config.plugins);
});
