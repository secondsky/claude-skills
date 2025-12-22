# Browser Tools Reference for Design Reviews

**Purpose**: Quick reference for browser automation tools used in design reviews
**Tools**: Playwright MCP (recommended) and Chrome DevTools CLI (alternative)

---

## Tool Selection

### Playwright MCP (Recommended)

**Best for:**
- Interactive testing (clicks, typing, navigation)
- Keyboard navigation testing
- Form interaction testing
- Complete design reviews with UX testing

**See the `playwright-testing` skill for:**
- Complete Playwright MCP installation guide
- Configuration and setup
- Advanced testing patterns
- End-to-end test examples

### Chrome DevTools CLI (Alternative)

**Best for:**
- Screenshot capture
- Performance analysis
- Network monitoring
- Visual QA and simpler reviews

**See the `chrome-devtools` skill for:**
- Puppeteer CLI installation and setup
- System dependencies (Linux/WSL)
- Screenshot automation scripts
- Performance auditing tools

---

## Playwright MCP Commands

For complete Playwright documentation, see the `playwright-testing` skill.

### Prerequisites Check

```bash
# Verify Playwright MCP is available
# Should see Playwright tools in MCP tool list
```

### Navigation

**Navigate to URL:**
```bash
mcp__playwright__browser_navigate(url: "https://preview.example.com")
```

**Navigation controls:**
```bash
# Go back
mcp__playwright__browser_navigate_back()

# Go forward
mcp__playwright__browser_navigate_forward()
```

### Viewport Testing (Responsive Design)

**Desktop (1440px):**
```bash
mcp__playwright__browser_resize(width: 1440, height: 900)
mcp__playwright__browser_take_screenshot(fullPage: true)
```

**Tablet (768px):**
```bash
mcp__playwright__browser_resize(width: 768, height: 1024)
mcp__playwright__browser_take_screenshot(fullPage: true)
```

**Mobile (375px):**
```bash
mcp__playwright__browser_resize(width: 375, height: 667)
mcp__playwright__browser_take_screenshot(fullPage: true)
```

### Screenshots

**Full page screenshot:**
```bash
mcp__playwright__browser_take_screenshot(fullPage: true)
```

**Specific element screenshot:**
```bash
mcp__playwright__browser_take_screenshot(
  selector: ".component-class",
  fullPage: false
)
```

**With custom options:**
```bash
mcp__playwright__browser_take_screenshot(
  fullPage: true,
  type: "png",  # or "jpeg"
  quality: 90   # for jpeg only
)
```

### Interaction Testing

**Click element:**
```bash
mcp__playwright__browser_click(selector: "button.submit")

# With options
mcp__playwright__browser_click(
  selector: "button.submit",
  timeout: 5000,
  force: false  # respect visibility checks
)
```

**Type in input:**
```bash
mcp__playwright__browser_type(
  selector: "input[name='email']",
  text: "test@example.com"
)

# With delay (for testing animations)
mcp__playwright__browser_type(
  selector: "input[name='email']",
  text: "test@example.com",
  delay: 100  # milliseconds between keystrokes
)
```

**Hover over element:**
```bash
mcp__playwright__browser_hover(selector: ".card:first-child")
```

**Select from dropdown:**
```bash
mcp__playwright__browser_select_option(
  selector: "select#country",
  value: "US"  # or label: "United States"
)
```

**Press keyboard key:**
```bash
# Press Enter
mcp__playwright__browser_press_key(key: "Enter")

# Press Tab (for focus testing)
mcp__playwright__browser_press_key(key: "Tab")

# Press Escape
mcp__playwright__browser_press_key(key: "Escape")

# Key combinations
mcp__playwright__browser_press_key(key: "Control+A")
```

### Form Testing

**Upload file:**
```bash
mcp__playwright__browser_file_upload(
  selector: "input[type='file']",
  filePath: "/path/to/test-image.png"
)
```

**Drag and drop:**
```bash
mcp__playwright__browser_drag(
  sourceSelector: ".draggable-item",
  targetSelector: ".drop-zone"
)
```

### Console & Network Monitoring

**Check console messages:**
```bash
mcp__playwright__browser_console_messages()
```

Returns JavaScript console logs, warnings, and errors.

**Check network requests:**
```bash
mcp__playwright__browser_network_requests()
```

Returns all network requests made by the page (useful for checking API calls).

### Wait for Elements

**Wait for element to appear:**
```bash
mcp__playwright__browser_wait_for(
  selector: ".loading-spinner",
  state: "hidden",    # Wait for spinner to disappear
  timeout: 5000
)

# Or wait for element to appear
mcp__playwright__browser_wait_for(
  selector: ".success-message",
  state: "visible",
  timeout: 5000
)
```

**Wait states:**
- `visible` - Wait for element to be visible
- `hidden` - Wait for element to be hidden
- `attached` - Wait for element in DOM
- `detached` - Wait for element to be removed

### DOM Inspection

**Get page snapshot:**
```bash
mcp__playwright__browser_snapshot()
```

Returns simplified DOM structure with accessibility tree.

**Evaluate JavaScript:**
```bash
mcp__playwright__browser_evaluate(expression: "document.title")

# Get computed styles
mcp__playwright__browser_evaluate(
  expression: "getComputedStyle(document.querySelector('.button')).color"
)

# Check element properties
mcp__playwright__browser_evaluate(
  expression: "document.querySelector('input[name=\"email\"]').value"
)
```

### Dialog Handling

**Handle alerts/confirms:**
```bash
mcp__playwright__browser_handle_dialog(
  accept: true,      # Accept dialog
  promptText: ""     # Text for prompt dialogs
)
```

### Tab Management

**List open tabs:**
```bash
mcp__playwright__browser_tab_list()
```

**Open new tab:**
```bash
mcp__playwright__browser_tab_new(url: "https://example.com")
```

**Switch to tab:**
```bash
mcp__playwright__browser_tab_select(tabId: "tab-id-from-list")
```

**Close tab:**
```bash
mcp__playwright__browser_tab_close(tabId: "tab-id-from-list")
```

### Browser Management

**Install browsers:**
```bash
mcp__playwright__browser_install()
```

**Close browser:**
```bash
mcp__playwright__browser_close()
```

---

## Chrome DevTools CLI Scripts

For complete Chrome DevTools documentation, see the `chrome-devtools` skill.

### Prerequisites Check

```bash
# Check if Chrome DevTools scripts available
ls ~/.claude/skills/chrome-devtools/scripts/

# Verify Node dependencies installed
cd ~/.claude/skills/chrome-devtools/scripts
bun install  # or npm install
```

### Screenshot Capture

**Basic screenshot:**
```bash
cd ~/.claude/skills/chrome-devtools/scripts
node screenshot.js --url "https://preview.example.com" --output "./screenshot.png"
```

**Full page screenshot:**
```bash
node screenshot.js \
  --url "https://preview.example.com" \
  --output "./screenshot.png" \
  --fullPage
```

**Custom viewport:**
```bash
# Mobile viewport
node screenshot.js \
  --url "https://preview.example.com" \
  --output "./mobile.png" \
  --width 375 \
  --height 667

# Tablet viewport
node screenshot.js \
  --url "https://preview.example.com" \
  --output "./tablet.png" \
  --width 768 \
  --height 1024

# Desktop viewport
node screenshot.js \
  --url "https://preview.example.com" \
  --output "./desktop.png" \
  --width 1440 \
  --height 900
```

### Performance Analysis

**Run performance audit:**
```bash
node performance.js \
  --url "https://preview.example.com" \
  --output "./perf-report.json"
```

Returns metrics:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)

### Network Monitoring

**Capture network requests:**
```bash
node network.js \
  --url "https://preview.example.com" \
  --output "./network-log.json"
```

Returns:
- All HTTP requests
- Request/response headers
- Timing information
- Status codes

---

## Selector Strategies

### CSS Selectors (Recommended)

**By ID:**
```bash
selector: "#submit-button"
```

**By class:**
```bash
selector: ".primary-button"
```

**By attribute:**
```bash
selector: "button[type='submit']"
selector: "input[name='email']"
selector: "a[href='/about']"
```

**Combinators:**
```bash
# Child selector
selector: "form > button"

# Descendant selector
selector: "nav a"

# Adjacent sibling
selector: ".error + .help-text"

# Multiple classes
selector: ".button.primary"
```

**Pseudo-classes:**
```bash
# First child
selector: "li:first-child"

# Last child
selector: "li:last-child"

# Nth child
selector: "li:nth-child(2)"

# Hover (use browser_hover instead)
selector: "button:hover"
```

### Text Content Selectors

**Playwright text selectors:**
```bash
# By exact text
selector: "text=Submit"

# By partial text
selector: "text=/Submit.*/"

# Button with specific text
selector: "button:has-text('Submit')"
```

### Accessibility Selectors (Playwright)

**By role:**
```bash
# Button role
selector: "role=button[name='Submit']"

# Link role
selector: "role=link[name='Home']"

# Textbox role
selector: "role=textbox[name='Email']"
```

**By label:**
```bash
selector: "label:has-text('Email') + input"
```

---

## Common Testing Workflows

### Workflow 1: Complete Responsive Review

```bash
# 1. Navigate to preview
mcp__playwright__browser_navigate(url: "https://preview.example.com")

# 2. Desktop screenshot
mcp__playwright__browser_resize(width: 1440, height: 900)
mcp__playwright__browser_take_screenshot(fullPage: true)

# 3. Tablet screenshot
mcp__playwright__browser_resize(width: 768, height: 1024)
mcp__playwright__browser_take_screenshot(fullPage: true)

# 4. Mobile screenshot
mcp__playwright__browser_resize(width: 375, height: 667)
mcp__playwright__browser_take_screenshot(fullPage: true)

# 5. Check console for errors
mcp__playwright__browser_console_messages()
```

### Workflow 2: Form Interaction Testing

```bash
# 1. Navigate to form page
mcp__playwright__browser_navigate(url: "https://preview.example.com/contact")

# 2. Fill out form
mcp__playwright__browser_type(
  selector: "input[name='name']",
  text: "John Doe"
)
mcp__playwright__browser_type(
  selector: "input[name='email']",
  text: "john@example.com"
)
mcp__playwright__browser_type(
  selector: "textarea[name='message']",
  text: "This is a test message"
)

# 3. Submit form
mcp__playwright__browser_click(selector: "button[type='submit']")

# 4. Wait for success message
mcp__playwright__browser_wait_for(
  selector: ".success-message",
  state: "visible"
)

# 5. Take screenshot of success state
mcp__playwright__browser_take_screenshot()
```

### Workflow 3: Keyboard Navigation Testing

```bash
# 1. Navigate to page
mcp__playwright__browser_navigate(url: "https://preview.example.com")

# 2. Tab through interactive elements
mcp__playwright__browser_press_key(key: "Tab")
mcp__playwright__browser_take_screenshot()  # Verify focus visible

mcp__playwright__browser_press_key(key: "Tab")
mcp__playwright__browser_take_screenshot()  # Next element

# Repeat for all interactive elements

# 3. Activate focused element
mcp__playwright__browser_press_key(key: "Enter")

# 4. Test modal keyboard handling
mcp__playwright__browser_press_key(key: "Escape")  # Close modal
```

### Workflow 4: Interactive State Testing

```bash
# 1. Navigate to page
mcp__playwright__browser_navigate(url: "https://preview.example.com")

# 2. Test hover state
mcp__playwright__browser_hover(selector: ".card:first-child")
mcp__playwright__browser_take_screenshot()  # Capture hover state

# 3. Test focus state
mcp__playwright__browser_click(selector: "button.primary")
# (Focus happens automatically on click)
mcp__playwright__browser_take_screenshot()  # Capture focus state

# 4. Test active/pressed state
# (Requires quick screenshot during click - challenging)

# 5. Test disabled state
# (Check existing disabled elements)
mcp__playwright__browser_take_screenshot(selector: "button:disabled")
```

---

## Troubleshooting

### Playwright MCP Issues

**Problem**: Playwright MCP commands not available

**Solution**:
1. Check if Playwright MCP server is running
2. Verify MCP configuration in Claude Code settings
3. See `playwright-testing` skill for installation guide

**Problem**: Selector not finding element

**Solution**:
```bash
# Use browser_snapshot to see available elements
mcp__playwright__browser_snapshot()

# Try different selector strategies:
# - CSS: "#id", ".class", "tag[attr='value']"
# - Text: "text=exact text" or "text=/regex/"
# - Role: "role=button[name='Submit']"
```

**Problem**: Timeout waiting for element

**Solution**:
```bash
# Increase timeout
mcp__playwright__browser_wait_for(
  selector: ".slow-element",
  timeout: 10000  # 10 seconds instead of default 5
)

# Or wait for network idle
mcp__playwright__browser_wait_for(
  selector: ".dynamic-content",
  state: "visible"
)
```

### Chrome DevTools Issues

**Problem**: Chrome dependencies missing (Linux/WSL)

**Solution**:
```bash
cd ~/.claude/skills/chrome-devtools/scripts
./install-deps.sh  # Auto-installs system dependencies
```

**Problem**: Screenshot file too large

**Solution**:
```bash
# Chrome DevTools auto-compresses with ImageMagick if installed
# Install ImageMagick:
brew install imagemagick  # macOS
sudo apt install imagemagick  # Ubuntu/Debian
```

See `chrome-devtools` skill for complete troubleshooting guide.

---

## Quick Reference Card

| Task | Playwright MCP | Chrome DevTools CLI |
|------|----------------|---------------------|
| **Screenshot** | `browser_take_screenshot()` | `node screenshot.js --url URL` |
| **Resize viewport** | `browser_resize(width, height)` | `--width 375 --height 667` |
| **Click element** | `browser_click(selector)` | N/A (use Playwright) |
| **Type text** | `browser_type(selector, text)` | N/A (use Playwright) |
| **Check console** | `browser_console_messages()` | N/A (use Playwright) |
| **Performance** | N/A (use Chrome DevTools) | `node performance.js --url URL` |

---

## Tool Installation

### Playwright MCP

See the **`playwright-testing` skill** for complete installation instructions:
- MCP server configuration
- Browser installation
- TypeScript/JavaScript setup
- Configuration examples

### Chrome DevTools CLI

See the **`chrome-devtools` skill** for complete installation instructions:
- System dependencies (Linux/WSL)
- Node.js/Bun setup
- Puppeteer installation
- ImageMagick (optional, for compression)
- Script usage examples

---

## Additional Resources

- **Playwright Documentation**: https://playwright.dev/
- **Puppeteer Documentation**: https://pptr.dev/
- **Chrome DevTools Protocol**: https://chromedevtools.github.io/devtools-protocol/

---

**For design review purposes, Playwright MCP is recommended** for its interactive testing capabilities. Use Chrome DevTools CLI as a fallback for simpler visual testing tasks.
