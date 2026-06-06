/**
 * Programmatic API usage example.
 * Run: node examples/api-demo.js
 */
const { runSteps } = require('../src/runner');

const steps = [
  { action: 'navigate', url: 'https://example.com/login' },

  {
    action: 'login',
    usernameSelector: '#username',
    passwordSelector: '#password',
    submitSelector: 'button[type=submit]',
    username: 'user@example.com',
    password: 'secret',
    waitForSelector: '.dashboard',
  },

  { action: 'wait', ms: 500 },

  { action: 'select', selector: '#report-type', label: 'Monthly Summary' },

  { action: 'click', selector: '#generate-btn' },

  { action: 'wait', selector: '.report-ready', state: 'visible' },

  { action: 'storeText', selector: '.report-title', as: 'reportTitle' },

  { action: 'screenshot', path: 'screenshots/report.png' },
];

runSteps(steps, { headless: true, browser: 'chromium' })
  .then((ctx) => {
    console.log('Report title:', ctx.reportTitle);
  })
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
  });
