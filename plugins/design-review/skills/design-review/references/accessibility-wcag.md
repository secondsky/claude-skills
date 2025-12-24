# WCAG 2.1 AA Accessibility Checklist

**Standard**: Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
**Target**: Inclusive design for users with disabilities
**Reference**: https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa

This comprehensive checklist covers all WCAG 2.1 AA success criteria organized by the four principles: **Perceivable, Operable, Understandable, Robust** (POUR).

---

## Principle 1: Perceivable

Information and user interface components must be presentable to users in ways they can perceive.

### 1.1 Text Alternatives

#### 1.1.1 Non-text Content (Level A)

**Requirement**: All non-text content has a text alternative that serves the equivalent purpose.

**Testing procedure:**
```bash
# Check for images without alt text
grep -r '<img' . | grep -v 'alt='

# Verify alt text is descriptive
# - Meaningful images: Describe what the image conveys
# - Decorative images: Use empty alt (alt="")
# - Functional images (buttons, links): Describe function
```

**Common violations:**
- `<img src="logo.png">` - Missing alt attribute
- `<img src="chart.png" alt="image">` - Non-descriptive alt text
- `<img src="decoration.svg" alt="Decorative image">` - Should be `alt=""`
- Icon buttons without accessible names

**How to fix:**
```html
<!-- ❌ Bad -->
<img src="logo.png">
<button><img src="trash.svg"></button>

<!-- ✅ Good -->
<img src="logo.png" alt="Company name logo">
<img src="decoration.svg" alt="" role="presentation">
<button aria-label="Delete item"><img src="trash.svg" alt=""></button>
```

---

### 1.3 Adaptable

#### 1.3.1 Info and Relationships (Level A)

**Requirement**: Information, structure, and relationships can be programmatically determined.

**Testing procedure:**
- Verify semantic HTML usage (`<nav>`, `<main>`, `<header>`, `<footer>`, `<aside>`)
- Check heading hierarchy (h1 → h2 → h3, no skipping)
- Validate form labels are associated with inputs
- Ensure lists use `<ul>`/`<ol>` + `<li>` structure
- Tables use `<table>`, `<th>`, `<caption>` appropriately

**Common violations:**
- Skipping heading levels (h1 → h3)
- Using `<div>` instead of semantic elements
- Form inputs without associated labels
- Presentational tables missing proper structure

**How to fix:**
```html
<!-- ❌ Bad: Non-semantic, skipped heading, unassociated label -->
<div class="page-header">
  <h1>Dashboard</h1>
  <h3>Settings</h3>
</div>
<div>
  <span>Email</span>
  <input type="email">
</div>

<!-- ✅ Good: Semantic HTML, proper hierarchy, associated labels -->
<header>
  <h1>Dashboard</h1>
  <h2>Settings</h2>
</header>
<form>
  <label for="email">Email</label>
  <input type="email" id="email" name="email">
</form>
```

#### 1.3.2 Meaningful Sequence (Level A)

**Requirement**: Content order makes sense when linearized.

**Testing procedure:**
- Disable CSS and read page top-to-bottom
- Tab through page - does focus order make sense?
- Use screen reader to verify reading order

**Common violations:**
- CSS positioning breaks logical flow
- Tab order jumps around page illogically
- Mobile menu appearing before main content in DOM

#### 1.3.4 Orientation (Level AA)

**Requirement**: Content not restricted to a single display orientation (portrait or landscape).

**Testing procedure:**
- Rotate device/browser to portrait and landscape
- Verify all content and functionality accessible in both orientations

**Common violations:**
- Forced landscape orientation with CSS/JS
- Features only work in one orientation

#### 1.3.5 Identify Input Purpose (Level AA)

**Requirement**: Input fields collecting user information have autocomplete attributes.

**Testing procedure:**
- Check form inputs have appropriate `autocomplete` attributes

**How to fix:**
```html
<!-- ✅ Good: Autocomplete attributes for common fields -->
<input type="text" name="name" autocomplete="name">
<input type="email" name="email" autocomplete="email">
<input type="tel" name="phone" autocomplete="tel">
<input type="text" name="address" autocomplete="street-address">
<input type="text" name="zip" autocomplete="postal-code">
```

---

### 1.4 Distinguishable

#### 1.4.3 Contrast (Minimum) (Level AA)

**Requirement**: Text and images of text have contrast ratio of at least:
- **4.5:1** for normal text
- **3:1** for large text (18pt+ or 14pt+ bold)

**Testing procedure:**
1. Take screenshots of all text content
2. Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
3. Test foreground/background combinations
4. Verify UI components meet 3:1 minimum

**Common violations:**
- Gray text on gray background (2.5:1 ratio)
- Light text on white background
- Disabled state text too faint (<3:1)
- Placeholder text with poor contrast
- Link text not sufficiently distinct

**How to test:**
```bash
# Using browser DevTools
# 1. Inspect element
# 2. Check computed colors
# 3. Use Lighthouse accessibility audit
# 4. Or use online contrast checker
```

**Triage:** [High-Priority] - WCAG AA violations

#### 1.4.4 Resize Text (Level AA)

**Requirement**: Text can be resized up to 200% without loss of content or functionality.

**Testing procedure:**
```bash
# Browser zoom to 200%
Cmd/Ctrl + Plus (+) to 200%

# Verify:
# - All text remains readable
# - No content hidden or cut off
# - All functionality still works
```

**Common violations:**
- Fixed pixel font sizes that don't scale
- Containers with `overflow: hidden` cutting off text
- Breakpoints that fail at zoom levels

#### 1.4.5 Images of Text (Level AA)

**Requirement**: Use actual text rather than images of text (except for logos).

**Testing procedure:**
- Identify any text rendered as images
- Verify it's necessary (e.g., logo, specific presentation)

**Common violations:**
- Headings as images instead of styled text
- Buttons using image sprites instead of CSS/SVG
- Decorative text as images

#### 1.4.10 Reflow (Level AA)

**Requirement**: Content reflows without requiring horizontal scrolling at:
- 320px width for vertical scrolling content
- 256px height for horizontal scrolling content

**Testing procedure:**
```bash
# Resize browser to 320px width
# Zoom to 400%
# Verify no horizontal scrolling required
```

**Common violations:**
- Fixed-width containers causing horizontal scroll
- Data tables without responsive design
- Wide images not scaling down

#### 1.4.11 Non-text Contrast (Level AA)

**Requirement**: UI components and graphical objects have contrast ratio of at least **3:1**.

**Testing procedure:**
- Check buttons, form inputs, icons against background
- Verify active/focus states have sufficient contrast
- Test charts and graphs for distinguishability

**Common violations:**
- Light gray borders on white background
- Subtle icons without sufficient contrast
- Focus indicators too faint (<3:1)

#### 1.4.12 Text Spacing (Level AA)

**Requirement**: No loss of content when user adjusts text spacing.

**Testing procedure:**
```css
/* Apply these overrides via browser DevTools */
* {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p {
  margin-bottom: 2em !important;
}

/* Verify content still readable and accessible */
```

**Common violations:**
- Containers with fixed heights cutting off text
- Overlapping elements when spacing increased

#### 1.4.13 Content on Hover or Focus (Level AA)

**Requirement**: Additional content appearing on hover/focus must be:
- **Dismissible**: Can be closed without moving pointer/focus
- **Hoverable**: Pointer can move over additional content
- **Persistent**: Remains visible until dismissed

**Testing procedure:**
- Test all tooltips, dropdowns, popovers
- Verify ESC key dismisses content
- Check if mouse can move to additional content without it disappearing

**Common violations:**
- Tooltips that disappear immediately when mouse moves
- Hover content with no keyboard dismiss option
- Popovers that can't be accessed by keyboard users

---

## Principle 2: Operable

User interface components and navigation must be operable.

### 2.1 Keyboard Accessible

#### 2.1.1 Keyboard (Level A)

**Requirement**: All functionality available via keyboard alone.

**Testing procedure:**
```bash
# Disconnect mouse
# Tab through entire page
# Verify:
# - All interactive elements reachable
# - Enter/Space activates buttons and links
# - Arrow keys work in custom controls
# - Escape closes modals
```

**Common violations:**
- Clickable divs without keyboard support
- Custom dropdowns not keyboard navigable
- Drag-and-drop with no keyboard alternative
- Hover-only content

**How to fix:**
```html
<!-- ❌ Bad: div with onClick, no keyboard support -->
<div onClick={handleClick}>Click me</div>

<!-- ✅ Good: button element, keyboard accessible -->
<button onClick={handleClick}>Click me</button>

<!-- ✅ Good: Custom component with keyboard -->
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```

#### 2.1.2 No Keyboard Trap (Level A)

**Requirement**: Keyboard focus can be moved away from any component.

**Testing procedure:**
- Tab through page
- Verify never "stuck" in any component
- Check modals allow ESC or Tab to exit

**Common violations:**
- Modal dialogs trapping focus with no escape
- Custom inputs preventing Tab navigation
- Infinite loops in tab order

#### 2.1.4 Character Key Shortcuts (Level A)

**Requirement**: Single character shortcuts can be turned off, remapped, or only active on focus.

**Testing procedure:**
- Identify keyboard shortcuts (especially single letters)
- Verify they can be disabled or customized

### 2.2 Enough Time

#### 2.2.1 Timing Adjustable (Level A)

**Requirement**: Time limits can be turned off, adjusted, or extended.

**Testing procedure:**
- Identify any time limits (session timeouts, auto-advancing carousels)
- Verify user can disable, extend, or get warnings

**Common violations:**
- 30-second timeout with no warning
- Auto-advancing carousel with no pause button
- Forced redirects without user control

#### 2.2.2 Pause, Stop, Hide (Level A)

**Requirement**: Moving, blinking, or auto-updating content can be paused, stopped, or hidden.

**Testing procedure:**
- Find auto-playing videos, carousels, scrolling text
- Verify pause/stop controls present

**Common violations:**
- Auto-playing video with no pause button
- Carousel with no stop control
- Live-updating content with no pause

### 2.3 Seizures and Physical Reactions

#### 2.3.1 Three Flashes or Below Threshold (Level A)

**Requirement**: No content flashes more than three times per second.

**Testing procedure:**
- Identify any flashing or rapidly changing content
- Verify flashes less than 3 per second

### 2.4 Navigable

#### 2.4.1 Bypass Blocks (Level A)

**Requirement**: Mechanism to skip repeated blocks (navigation, headers).

**Testing procedure:**
- Tab to first interactive element
- Verify "Skip to main content" link present
- Check it focuses main content when activated

**How to fix:**
```html
<!-- ✅ Good: Skip link (visually hidden until focused) -->
<a href="#main-content" class="skip-link">Skip to main content</a>
<nav>...</nav>
<main id="main-content">...</main>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
</style>
```

#### 2.4.2 Page Titled (Level A)

**Requirement**: Web pages have descriptive and unique titles.

**Testing procedure:**
- Check `<title>` element exists
- Verify title describes page purpose
- Ensure titles unique across site

**Common violations:**
- Missing or empty `<title>`
- Generic titles ("Dashboard" on every page)
- Title doesn't reflect page content

#### 2.4.3 Focus Order (Level A)

**Requirement**: Focusable components receive focus in logical order.

**Testing procedure:**
- Tab through page
- Verify focus moves in reading order (left-to-right, top-to-bottom)
- Check no illogical jumps

**Common violations:**
- Tab order jumps to footer before main content
- Focus moves backwards unexpectedly
- CSS positioning breaks DOM order

#### 2.4.4 Link Purpose (In Context) (Level A)

**Requirement**: Purpose of each link can be determined from link text or context.

**Testing procedure:**
- Read all link text out of context
- Verify each link's purpose is clear

**Common violations:**
- Multiple "Click here" or "Read more" links
- Generic "Learn more" without context
- Links without text (icon-only)

**How to fix:**
```html
<!-- ❌ Bad: Generic link text -->
<a href="/article1">Click here</a> for more information.

<!-- ✅ Good: Descriptive link text -->
<a href="/article1">Read the full article about design systems</a>

<!-- ✅ Good: Icon button with aria-label -->
<a href="/article1" aria-label="Read article about design systems">
  <svg>...</svg>
</a>
```

#### 2.4.5 Multiple Ways (Level AA)

**Requirement**: Multiple ways to locate pages (navigation, search, sitemap).

**Testing procedure:**
- Verify navigation menu present
- Check for search functionality
- Verify sitemap or alternative navigation method

#### 2.4.6 Headings and Labels (Level AA)

**Requirement**: Headings and labels describe topic or purpose.

**Testing procedure:**
- Review all headings and form labels
- Verify they clearly describe content

**Common violations:**
- Generic headings like "Content" or "Information"
- Form labels like "Field 1" instead of "Email address"

#### 2.4.7 Focus Visible (Level AA)

**Requirement**: Keyboard focus indicator is visible.

**Testing procedure:**
```bash
# Tab through entire page
# Verify every interactive element shows visible focus indicator
# - Outline, border, background change, or glow
# - Must be clearly visible (contrast 3:1 minimum)
```

**Common violations:**
- `outline: none` with no alternative focus style
- Focus indicator too subtle (light gray border)
- No focus indicator on custom components

**How to fix:**
```css
/* ❌ Bad: Removes focus with no alternative */
button:focus {
  outline: none;
}

/* ✅ Good: Custom focus indicator */
button:focus {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}

/* ✅ Good: Visible focus with contrast */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.5);
}
```

---

## Principle 3: Understandable

Information and user interface operation must be understandable.

### 3.1 Readable

#### 3.1.1 Language of Page (Level A)

**Requirement**: Default human language of page is programmatically determined.

**Testing procedure:**
```html
<!-- ✅ Verify <html> has lang attribute -->
<html lang="en">
```

#### 3.1.2 Language of Parts (Level AA)

**Requirement**: Language of passages or phrases can be programmatically determined.

**Testing procedure:**
```html
<!-- ✅ Mark foreign language content -->
<p>The French phrase <span lang="fr">mise en place</span> means "putting in place".</p>
```

### 3.2 Predictable

#### 3.2.1 On Focus (Level A)

**Requirement**: Receiving focus does not initiate a change of context.

**Testing procedure:**
- Tab through page
- Verify no unexpected actions on focus (page redirects, modal opens, form submits)

**Common violations:**
- Form submits when last field receives focus
- Dropdown opens automatically on focus (without user action)

#### 3.2.2 On Input (Level A)

**Requirement**: Changing input settings does not cause unexpected change of context.

**Testing procedure:**
- Interact with all form controls
- Verify no automatic submissions or navigation

**Common violations:**
- Form auto-submits when dropdown changed
- Page redirects when checkbox checked
- Modal opens when radio button selected

#### 3.2.3 Consistent Navigation (Level AA)

**Requirement**: Navigation mechanisms repeated on multiple pages occur in same relative order.

**Testing procedure:**
- Navigate between pages
- Verify navigation menu in same location and order

#### 3.2.4 Consistent Identification (Level AA)

**Requirement**: Components with same functionality are identified consistently.

**Testing procedure:**
- Find repeated components (search button, login link)
- Verify same labels and icons used consistently

**Common violations:**
- "Sign in" on homepage, "Log in" on other pages
- Search icon different across pages

### 3.3 Input Assistance

#### 3.3.1 Error Identification (Level A)

**Requirement**: Input errors are identified and described in text.

**Testing procedure:**
- Submit forms with invalid data
- Verify clear error messages
- Check errors described in text (not just red border)

**Common violations:**
- Red border only (no text explanation)
- Generic error ("Invalid input")
- Error not programmatically associated with input

**How to fix:**
```html
<!-- ✅ Good: Error associated with input -->
<label for="email">Email</label>
<input
  type="email"
  id="email"
  aria-invalid="true"
  aria-describedby="email-error"
>
<span id="email-error" class="error">Please enter a valid email address</span>
```

#### 3.3.2 Labels or Instructions (Level A)

**Requirement**: Labels or instructions provided when content requires user input.

**Testing procedure:**
- Check all form inputs have labels
- Verify required fields marked
- Ensure format instructions provided (e.g., "MM/DD/YYYY")

**Common violations:**
- Inputs with placeholder only (no label)
- Required fields not indicated
- Expected format not explained

#### 3.3.3 Error Suggestion (Level AA)

**Requirement**: Suggestions for correcting input errors are provided.

**Testing procedure:**
- Submit form with errors
- Verify error messages include guidance

**Common violations:**
- "Invalid password" (no hint about requirements)
- "Date format error" (no format shown)

**How to fix:**
```html
<!-- ✅ Good: Helpful error with suggestion -->
<span id="password-error" class="error">
  Password must be at least 8 characters and include a number.
</span>
```

#### 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)

**Requirement**: Submissions that cause legal/financial commitments are:
- Reversible, or
- Checked for errors, or
- Confirmed before submission

**Testing procedure:**
- Test purchase/delete/submit flows
- Verify confirmation step or ability to review/edit

**Common violations:**
- Delete button with no confirmation
- Purchase with no review step
- Data submission with no preview

---

## Principle 4: Robust

Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

### 4.1 Compatible

#### 4.1.1 Parsing (Level A)

**Requirement**: HTML markup is valid and properly nested.

**Testing procedure:**
```bash
# Use W3C HTML Validator
# https://validator.w3.org/

# Check for:
# - Properly closed tags
# - No duplicate IDs
# - Valid attribute values
```

#### 4.1.2 Name, Role, Value (Level A)

**Requirement**: For all UI components:
- **Name** can be programmatically determined
- **Role** can be programmatically determined
- **States/properties** can be programmatically set

**Testing procedure:**
- Inspect custom components
- Verify appropriate ARIA attributes
- Test with screen reader

**Common violations:**
- Custom checkbox without `role="checkbox"` and `aria-checked`
- Expandable sections without `aria-expanded`
- Toggle buttons without state indication

**How to fix:**
```html
<!-- ✅ Good: Custom checkbox with ARIA -->
<div
  role="checkbox"
  aria-checked="false"
  aria-labelledby="checkbox-label"
  tabindex="0"
>
  <span id="checkbox-label">Agree to terms</span>
</div>

<!-- ✅ Good: Expandable section -->
<button aria-expanded="false" aria-controls="details">
  Show details
</button>
<div id="details" hidden>...</div>
```

#### 4.1.3 Status Messages (Level AA)

**Requirement**: Status messages can be programmatically determined through role or properties.

**Testing procedure:**
- Test success messages, error alerts, progress notifications
- Verify `role="status"`, `role="alert"`, or `aria-live` used

**Common violations:**
- Toast notifications without ARIA live regions
- Success messages not announced to screen readers
- Loading states not programmatically indicated

**How to fix:**
```html
<!-- ✅ Good: Live region for status messages -->
<div role="status" aria-live="polite">
  Your changes have been saved.
</div>

<!-- ✅ Good: Alert for errors -->
<div role="alert" aria-live="assertive">
  Error: Unable to process payment.
</div>
```

---

## Testing Tools

### Automated Tools

1. **Lighthouse** (Chrome DevTools)
   - Built into Chrome DevTools
   - Comprehensive accessibility audit
   - Provides specific issues and recommendations

2. **axe DevTools** (Browser Extension)
   - Free browser extension
   - Catches ~57% of WCAG issues automatically
   - Detailed violation explanations

3. **WAVE** (WebAIM)
   - Browser extension and online tool
   - Visual feedback on accessibility
   - https://wave.webaim.org/

4. **Pa11y** (Command Line)
   ```bash
   npm install -g pa11y
   pa11y https://your-site.com
   ```

### Manual Testing Tools

1. **WebAIM Contrast Checker**
   - https://webaim.org/resources/contrastchecker/
   - Test foreground/background color combinations

2. **Keyboard Only Navigation**
   - Disconnect mouse
   - Tab through entire interface
   - Verify all functionality accessible

3. **Screen Readers**
   - **macOS**: VoiceOver (Cmd+F5)
   - **Windows**: NVDA (free) or JAWS
   - **Mobile**: VoiceOver (iOS), TalkBack (Android)

4. **Browser Zoom**
   - Test at 200% zoom
   - Verify reflow without horizontal scrolling

---

## Quick Reference: Most Common Violations

Based on WebAIM Million Report, these are the most common accessibility issues:

| Issue | Percentage | WCAG Criterion | Fix |
|-------|------------|----------------|-----|
| Low contrast text | 86.4% | 1.4.3 | Ensure 4.5:1 minimum |
| Missing alt text | 55.4% | 1.1.1 | Add descriptive alt attributes |
| Empty links | 50.7% | 2.4.4 | Provide link text or aria-label |
| Missing form labels | 46.1% | 3.3.2 | Associate label with input |
| Empty buttons | 28.2% | 4.1.2 | Provide button text or aria-label |
| Missing document language | 22.1% | 3.1.1 | Add lang="en" to <html> |

---

## Triage Priorities

**[Blocker]** - Critical WCAG violations that prevent access:
- No keyboard access to core functionality
- Critical color contrast failures (<3:1)
- Missing form labels on required inputs
- Keyboard traps

**[High-Priority]** - WCAG AA violations that impact experience:
- Poor contrast (3:1 to 4.4:1 for text)
- Missing focus indicators
- Unlabeled interactive elements
- Non-semantic HTML breaking screen readers

**[Medium-Priority]** - Violations that affect some users:
- Minor semantic HTML issues
- Missing skip links
- Inconsistent navigation
- Generic link text ("Click here")

**[Nitpick]** - AAA or enhanced accessibility:
- Contrast ratios above 7:1 (AAA level)
- Additional ARIA landmarks
- Enhanced keyboard shortcuts

---

**For questions on specific WCAG criteria, see the official quick reference:**
https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa
