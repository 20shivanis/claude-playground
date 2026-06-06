const { chromium, firefox, webkit } = require('playwright');
const { ACTIONS } = require('./actions');

const BROWSERS = { chromium, firefox, webkit };

/**
 * Run a sequence of steps against a browser page.
 *
 * @param {object[]} steps  - Array of step objects (see actions.js for shapes)
 * @param {object}   opts
 * @param {boolean}  opts.headless   - Run headless (default: true)
 * @param {string}   opts.browser    - 'chromium' | 'firefox' | 'webkit' (default: 'chromium')
 * @param {boolean}  opts.slowMo     - Ms to slow each action by (default: 0)
 * @param {object}   opts.viewport   - { width, height } (default: 1280x720)
 * @param {boolean}  opts.video      - Record video to 'videos/' dir (default: false)
 * @returns {object} context - accumulated stored values from storeText steps
 */
async function runSteps(steps, opts = {}) {
  const {
    headless = true,
    browser: browserName = 'chromium',
    slowMo = 0,
    viewport = { width: 1280, height: 720 },
    video = false,
  } = opts;

  const browserType = BROWSERS[browserName];
  if (!browserType) throw new Error(`Unknown browser: ${browserName}`);

  const browser = await browserType.launch({ headless, slowMo });
  const contextOpts = { viewport };
  if (video) contextOpts.recordVideo = { dir: 'videos/' };

  const browserContext = await browser.newContext(contextOpts);
  const page = await browserContext.newPage();
  const context = {};

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const actionName = step.action;
      const handler = ACTIONS[actionName];

      if (!handler) {
        throw new Error(`Unknown action: "${actionName}" at step ${i + 1}`);
      }

      console.log(`  [${i + 1}/${steps.length}] ${actionName}${step.selector ? ` → ${step.selector}` : ''}${step.url ? ` → ${step.url}` : ''}`);
      await handler(page, step, context);
    }

    console.log('  ✓ All steps completed');
    return context;
  } finally {
    if (video) {
      const videoPath = await page.video()?.path();
      if (videoPath) console.log(`  🎥 Video saved: ${videoPath}`);
    }
    await browser.close();
  }
}

module.exports = { runSteps };
