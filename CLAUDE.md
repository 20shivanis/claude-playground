# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Node.js + Playwright web automation utility. Tests are defined as YAML (or JSON) step files and executed via a CLI runner. A JS API is also available for scripted use.

## Setup

```bash
npm install
npx playwright install chromium   # or firefox / webkit
```

## Running tests

```bash
# Run a YAML test file (headless by default)
node src/cli.js examples/login-test.yml

# Run headed (visible browser)
node src/cli.js examples/login-test.yml --headed

# Slow down each action by 500ms (useful for debugging)
node src/cli.js examples/login-test.yml --headed --slow-mo 500

# Record video
node src/cli.js examples/login-test.yml --video

# Use a different browser
node src/cli.js examples/login-test.yml --browser firefox
```

## Architecture

```
src/
  actions.js   — all action handlers (login, click, fill, select, wait, …)
  runner.js    — launches browser, iterates steps, calls action handlers
  cli.js       — parses YAML/JSON test file + CLI flags, calls runner

examples/
  login-test.yml   — YAML config example
  api-demo.js      — programmatic JS API example
```

### Adding a new action

1. Add a handler function `async function myAction(page, step, context)` in `src/actions.js`
2. Register it in the `ACTIONS` map at the bottom of that file
3. Use it in a YAML step as `action: myAction`

### Step shape reference

Every step requires an `action` field. Common fields:

| Action | Required fields | Optional |
|---|---|---|
| `navigate` | `url` | `waitUntil` |
| `login` | `usernameSelector`, `passwordSelector`, `submitSelector`, `username`, `password` | `waitForSelector`, `timeout` |
| `click` | `selector` | `timeout` |
| `fill` | `selector`, `value` | `timeout` |
| `select` | `selector`, one of `value`/`label`/`index` | `timeout` |
| `wait` | one of `selector`, `ms`, `url`, `networkIdle: true` | `state`, `timeout` |
| `screenshot` | — | `path`, `fullPage` |
| `assertText` | `selector`, `contains` | `timeout` |
| `assertUrl` | `contains` | — |
| `storeText` | `selector`, `as` | `timeout` |

`storeText` saves element text into a named key on the shared `context` object, accessible in the JS API return value.
