#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { runSteps } = require('./runner');

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: node src/cli.js <test-file.yml> [options]

Options:
  --headed          Run with visible browser (default: headless)
  --browser <name>  chromium | firefox | webkit  (default: chromium)
  --slow-mo <ms>    Slow each action by N ms
  --video           Record video to videos/
  --help            Show this help

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
const headed = args.includes('--headed');
const video = args.includes('--video');
const browserIdx = args.indexOf('--browser');
const browser = browserIdx !== -1 ? args[browserIdx + 1] : (config.browser ?? 'chromium');
const slowMoIdx = args.indexOf('--slow-mo');
const slowMo = slowMoIdx !== -1 ? parseInt(args[slowMoIdx + 1], 10) : (config.slowMo ?? 0);

const steps = config.steps;
if (!Array.isArray(steps) || steps.length === 0) {
  console.error('Config must have a non-empty "steps" array');
  process.exit(1);
}

console.log(`\nRunning: ${path.basename(filePath)} (${steps.length} steps, ${browser}${headed ? ', headed' : ''})\n`);

runSteps(steps, { headless: !headed, browser, slowMo, video })
  .then((ctx) => {
    if (Object.keys(ctx).length > 0) {
      console.log('\nStored values:', ctx);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error(`\n✗ Test failed: ${err.message}`);
    process.exit(1);
  });
