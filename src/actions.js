/**
 * Action handlers — each receives (page, step, context) and mutates `context` as needed.
 * `context` is a plain object shared across all steps in a run (stores variables, etc).
 */

async function navigate(page, step) {
  await page.goto(step.url, { waitUntil: step.waitUntil ?? 'domcontentloaded' });
}

async function click(page, step) {
  const locator = page.locator(step.selector);
  await locator.waitFor({ state: 'visible', timeout: step.timeout ?? 30000 });
  await locator.click();
}

async function fill(page, step) {
  const locator = page.locator(step.selector);
  await locator.waitFor({ state: 'visible', timeout: step.timeout ?? 30000 });
  await locator.fill(step.value);
}

async function login(page, step) {
  await fill(page, { selector: step.usernameSelector, value: step.username });
  await fill(page, { selector: step.passwordSelector, value: step.password });
  await click(page, { selector: step.submitSelector, timeout: step.timeout });
  if (step.waitForSelector) {
    await page.waitForSelector(step.waitForSelector, { timeout: step.timeout ?? 15000 });
  }
}

async function select(page, step) {
  const locator = page.locator(step.selector);
  await locator.waitFor({ state: 'visible', timeout: step.timeout ?? 30000 });
  if (step.value !== undefined) {
    await locator.selectOption({ value: step.value });
  } else if (step.label !== undefined) {
    await locator.selectOption({ label: step.label });
  } else if (step.index !== undefined) {
    await locator.selectOption({ index: step.index });
  } else {
    throw new Error('select step requires one of: value, label, or index');
  }
}

async function wait(page, step) {
  if (step.selector) {
    const state = step.state ?? 'visible';
    await page.waitForSelector(step.selector, { state, timeout: step.timeout ?? 15000 });
  } else if (step.ms) {
    await page.waitForTimeout(step.ms);
  } else if (step.url) {
    await page.waitForURL(step.url, { timeout: step.timeout ?? 15000 });
  } else if (step.networkIdle) {
    await page.waitForLoadState('networkidle', { timeout: step.timeout ?? 15000 });
  } else {
    throw new Error('wait step requires one of: selector, ms, url, or networkIdle: true');
  }
}

async function screenshot(page, step) {
  const path = step.path ?? `screenshot-${Date.now()}.png`;
  await page.screenshot({ path, fullPage: step.fullPage ?? false });
  console.log(`  📸 Screenshot saved: ${path}`);
}

async function assertText(page, step) {
  const locator = page.locator(step.selector);
  await locator.waitFor({ state: 'visible', timeout: step.timeout ?? 30000 });
  const text = await locator.innerText();
  if (!text.includes(step.contains)) {
    throw new Error(`assertText failed: expected "${step.contains}" in "${text}"`);
  }
}

async function assertUrl(page, step) {
  const current = page.url();
  if (!current.includes(step.contains)) {
    throw new Error(`assertUrl failed: expected URL to contain "${step.contains}", got "${current}"`);
  }
}

async function storeText(page, step, context) {
  const locator = page.locator(step.selector);
  await locator.waitFor({ state: 'visible', timeout: step.timeout ?? 30000 });
  context[step.as] = await locator.innerText();
}

const ACTIONS = {
  navigate,
  click,
  fill,
  login,
  select,
  wait,
  screenshot,
  assertText,
  assertUrl,
  storeText,
};

module.exports = { ACTIONS };
