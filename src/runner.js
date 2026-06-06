const { chromium, firefox, webkit } = require('playwright');
const { ACTIONS } = require('./actions');

const BROWSERS = { chromium, firefox, webkit };

/**
 * Run a single scenario (array of steps) in its own browser session.
 * Waits for the browser to be closed manually if keepOpen is true.
 */
async function runSteps(steps, opts = {}) {
  const {
    headless = true,
    browser: browserName = 'chromium',
    slowMo = 0,
    viewport = { width: 1280, height: 720 },
    video = false,
    keepOpen = false,
  } = opts;

  const browserType = BROWSERS[browserName];
  if (!browserType) throw new Error(`Unknown browser: ${browserName}`);

  const browser = await browserType.launch({ headless, slowMo });
  const contextOpts = { viewport };
  if (video) contextOpts.recordVideo = { dir: 'videos/' };

  const browserContext = await browser.newContext(contextOpts);
  const page = await browserContext.newPage();
  const context = {};

  let interrupted = false;

  // Detect if user closes the browser window manually
  browser.on('disconnected', () => { interrupted = true; });

  try {
    for (let i = 0; i < steps.length; i++) {
      if (interrupted) {
        console.log('  ⚠ Browser closed by user — stopping scenario');
        break;
      }

      const step = steps[i];
      const actionName = step.action;
      const handler = ACTIONS[actionName];

      if (!handler) {
        throw new Error(`Unknown action: "${actionName}" at step ${i + 1}`);
      }

      const label = `${actionName}${step.selector ? ` → ${step.selector}` : ''}${step.url ? ` → ${step.url}` : ''}`;
      process.stdout.write(`  [${i + 1}/${steps.length}] ${label} ... `);
      const t0 = Date.now();
      await handler(page, step, context);
      console.log(`done (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    }

    if (!interrupted) {
      const result = context.__lastResult ?? 'PASS';
      console.log(`\n  ${result === 'PASS' ? '✓' : '✗'} Scenario ${result}`);

      if (keepOpen) {
        console.log('  Waiting for browser to be closed...');
        await new Promise((resolve) => browser.on('disconnected', resolve));
      }
    }

    return { context, interrupted };
  } finally {
    if (video) {
      const videoPath = await page.video()?.path();
      if (videoPath) console.log(`  Video saved: ${videoPath}`);
    }
    if (!interrupted) await browser.close();
  }
}

/**
 * Run multiple scenarios sequentially.
 * Each scenario gets its own browser session.
 * If a scenario is interrupted (browser closed), remaining scenarios are skipped.
 */
async function runScenarios(scenarios, opts = {}) {
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const name = scenario.name ?? `Scenario ${i + 1}`;
    console.log(`\n── ${name} (${scenario.steps.length} steps) ──`);

    const { interrupted } = await runSteps(scenario.steps, opts);

    if (interrupted) {
      console.log(`\n✗ Stopped at "${name}" — remaining scenarios skipped`);
      return;
    }
  }

  console.log('\n✓ All scenarios completed');
}

module.exports = { runSteps, runScenarios };
