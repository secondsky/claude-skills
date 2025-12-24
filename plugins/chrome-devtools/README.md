# Chrome DevTools Agent Skill

Browser automation, debugging, and performance analysis using Puppeteer CLI scripts.

## Overview

This skill enables Claude to automate browsers, take screenshots, analyze performance, monitor network traffic, perform web scraping, automate forms, and debug JavaScript through executable Puppeteer scripts.

## Features

- **Browser Navigation** - Navigate to URLs with configurable wait conditions
- **Screenshots** - Capture full pages or specific elements with auto-compression
- **Form Automation** - Fill fields and click buttons with CSS or XPath selectors
- **DOM Inspection** - Extract interactive elements with metadata for debugging
- **Performance Analysis** - Measure Core Web Vitals and record traces
- **Network Monitoring** - Track HTTP requests/responses
- **Console Monitoring** - Capture console messages and errors

## Installation

### 1. System Dependencies (Linux/WSL only)

```bash
cd skills/chrome-devtools/scripts
./install-deps.sh
```

### 2. Node Dependencies

```bash
# Preferred: Using bun (faster)
bun install

# Alternative: Using npm
npm install
```

### 3. Optional: ImageMagick (for auto-compression)

```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick
```

## Quick Start

```bash
# Navigate to URL
bun navigate.js --url https://example.com

# Take screenshot
bun screenshot.js --url https://example.com --output page.png

# Fill form field
bun fill.js --selector "#email" --value "user@example.com"

# Click button
bun click.js --selector "button[type=submit]"

# Discover selectors
bun snapshot.js --url https://example.com | jq '.elements'
```

## Auto-Trigger Keywords

- browser automation
- puppeteer
- web scraping
- screenshot capture
- form automation
- performance analysis
- network monitoring
- JavaScript debugging
- element selectors
- Core Web Vitals

## Source

Adapted from [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills)

## License

Apache-2.0
