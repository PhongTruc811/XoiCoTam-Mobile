const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const { devices } = JSON.parse(execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], { encoding: 'utf8' }));
const candidates = Object.keys(devices)
  .filter(runtime => runtime.includes('.iOS-'))
  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  .flatMap(runtime => devices[runtime].map(device => ({ ...device, runtime })))
  .filter(device => device.isAvailable && device.name.startsWith('iPhone'));
const selected = candidates.find(device => device.state === 'Booted') ?? candidates[0];
if (!selected) throw new Error('No available iPhone simulator. Check the runner image runtimes.');
if (!process.env.GITHUB_ENV) throw new Error('This helper runs inside GitHub Actions.');
fs.appendFileSync(process.env.GITHUB_ENV, 'SIMULATOR_UDID=' + selected.udid + '\nSIMULATOR_STATE=' + selected.state + '\n');
fs.mkdirSync('.maestro-artifacts', { recursive: true });
fs.writeFileSync('.maestro-artifacts/simulator.json', JSON.stringify(selected, null, 2));
console.log('Selected ' + selected.name + ' / ' + selected.runtime);
