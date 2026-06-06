#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { runSteps, runScenarios } = require('./runner');

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: node src/cli.js <test-file.yml> [options]

Options:
  --headed          Run with visible browser (default: headless)
  --browser <name>  chromium | firefox | webkit  (default: chromium)
  --slow-mo <ms>    Slow each action by N ms
  --video           Record video to videos/
  --keep-open       Keep browser open after scenario completes
  --help            Show this help

File format — single scenario (steps at top level):
  steps:
    - action: navigate
      ...

File format — multiple scenarios (run sequentially):
  scenarios:
    - name: "Scenario 1"
      steps: [...]
    - name: "Scenario 2"
      steps: [...]

Example:
  node src/cli.js examples/login-test.yml --headed
`);
  process.exit(0);
}

const filePath = path.resolve(args[0]);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const ext = path.extname(filePath).toLowerCase();
let config;
try {
  const raw = fs.readFileSync(filePath, 'utf8');
  config = ext === '.json' ? JSON.parse(raw) : yaml.load(raw);
} catch (err) {
  console.error(`Failed to parse ${filePath}: ${err.message}`);
  process.exit(1);
}

// Parse CLI flags
const headed   = args.includes('--headed');
const video    = args.includes('--video');
const keepOpen = args.includes('--keep-open');
const browserIdx = args.indexOf('--browser');
const browser  = browserIdx !== -1 ? args[browserIdx + 1] : (config.browser ?? 'chromium');
const slowMoIdx = args.indexOf('--slow-mo');
const slowMo   = slowMoIdx !== -1 ? parseInt(args[slowMoIdx + 1], 10) : (config.slowMo ?? 0);

const runOpts = { headless: !headed, browser, slowMo, video, keepOpen };

console.log(`\nFile: ${path.basename(filePath)} | Browser: ${browser}${headed ? ' (headed)' : ''}${keepOpen ? ' | keep-open' : ''}\n`);

// Multi-scenario mode
if (Array.isArray(config.scenarios)) {
  if (config.scenarios.length === 0) {
    console.error('No scenarios defined');
    process.exit(1);
  }
  console.log(`${config.scenarios.length} scenario(s) queued\n`);
  runScenarios(config.scenarios, runOpts)
    .then(() => process.exit(0))
    .catch((err) => { console.error(`\n✗ ${err.message}`); process.exit(1); });

// Single-scenario mode
} else if (Array.isArray(config.steps)) {
  if (config.steps.length === 0) {
    console.error('steps array is empty');
    process.exit(1);
  }
  runSteps(config.steps, runOpts)
    .then(({ context }) => {
      if (Object.keys(context).length > 0) console.log('\nStored values:', context);
      process.exit(0);
    })
    .catch((err) => { console.error(`\n✗ ${err.message}`); process.exit(1); });

} else {
  console.error('Config must have either a "steps" array or a "scenarios" array');
  process.exit(1);
}
