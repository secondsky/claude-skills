# Design Review Checklist Template

**Copy this checklist at the start of each design review to track progress through all 7 phases.**

---

## Review Information

**PR/Feature:** [PR #XXX or Feature name]
**Preview URL:** [https://preview.example.com]
**Reviewer:** [Your name]
**Date:** [YYYY-MM-DD]

---

## Design Review Progress

```
- [ ] Phase 0: Preparation
- [ ] Phase 1: Interaction & User Flow
- [ ] Phase 2: Responsiveness
- [ ] Phase 3: Visual Polish
- [ ] Phase 4: Accessibility
- [ ] Phase 5: Robustness
- [ ] Phase 6: Code Health
- [ ] Phase 7: Content & Console
```

---

## Phase 0: Preparation

- [ ] Read PR description / review request
- [ ] Analyzed code diff (`git diff origin/main...HEAD`)
- [ ] Set up live preview environment
- [ ] Navigated to preview URL using browser tools
- [ ] Set viewport to 1440×900 (desktop)
- [ ] Captured baseline screenshot

**Notes:**
[Any context or observations from preparation]

---

## Phase 1: Interaction & User Flow

### Primary User Flow
- [ ] Executed primary user flow (based on PR notes)
- [ ] Verified success states and confirmation messages

**Primary flow:** [Describe the flow tested]

### Interactive States
- [ ] **Hover states** - Verified visual feedback on mouse over
- [ ] **Active/Pressed states** - Verified down state when clicking
- [ ] **Focus states** - Verified clear outline for keyboard navigation
- [ ] **Disabled states** - Verified visually distinct, non-interactive

**Elements tested:** [List key interactive elements]

### Other Checks
- [ ] Destructive actions have confirmations
- [ ] Perceived performance feels snappy (<100ms feedback)
- [ ] Loading states shown for async operations

**Issues found:** [Number] - [Brief list]

**Status:** ✅ Pass / ⚠️ Issues found

---

## Phase 2: Responsiveness

### Desktop (1440px)
- [ ] Resized to 1440×900
- [ ] Captured full-page screenshot
- [ ] Verified optimal layout
- [ ] Checked all content accessible without excessive scrolling

**Screenshot:** [Reference or attach]

### Tablet (768px)
- [ ] Resized to 768×1024
- [ ] Captured full-page screenshot
- [ ] Verified layout adapts gracefully
- [ ] Checked touch target sizes (minimum 44px)
- [ ] Verified navigation collapses appropriately

**Screenshot:** [Reference or attach]

### Mobile (375px)
- [ ] Resized to 375×667
- [ ] Captured full-page screenshot
- [ ] **No horizontal scrolling** ✓
- [ ] Text readable (16px minimum for body)
- [ ] Touch targets adequate (44px minimum)
- [ ] Mobile navigation works (hamburger menu, etc.)

**Screenshot:** [Reference or attach]

**Issues found:** [Number] - [Brief list]

**Status:** ✅ Pass / ⚠️ Issues found

---

## Phase 3: Visual Polish

### Typography
- [ ] Clear heading hierarchy (H1 > H2 > H3)
- [ ] Appropriate font sizes and weights
- [ ] Adequate line height (1.5+ for body text)
- [ ] Consistent font families (1-2 max)

### Spacing & Layout
- [ ] Consistent spacing scale (8px multiples)
- [ ] No magic numbers (random pixel values)
- [ ] Design token usage (var(--space-X))
- [ ] Elements aligned precisely (no 1px offsets)
- [ ] Adequate white space

### Color
- [ ] Limited palette (consistent with design system)
- [ ] Semantic color usage (red=error, green=success)
- [ ] Design tokens used (var(--color-X))
- [ ] No hardcoded color values

### Visual Hierarchy
- [ ] Primary actions stand out
- [ ] Eye naturally flows to important elements
- [ ] Related items grouped through proximity
- [ ] Contrast creates focus

### Images
- [ ] High quality (no pixelation)
- [ ] Correct aspect ratios
- [ ] Responsive scaling
- [ ] Alt text present

**Issues found:** [Number] - [Brief list]

**Status:** ✅ Pass / ⚠️ Issues found

---

## Phase 4: Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- [ ] Tabbed through all interactive elements
- [ ] Verified logical tab order (left-to-right, top-to-bottom)
- [ ] **Visible focus states on ALL elements** ✓
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals
- [ ] No keyboard traps

**Elements tested:** [List key elements]

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skipping)
- [ ] Landmark regions present (`<nav>`, `<main>`, `<aside>`, `<footer>`)
- [ ] Form labels associated with inputs
- [ ] Buttons are `<button>`, links are `<a>`
- [ ] Lists use proper structure (`<ul>`/`<ol>` + `<li>`)

### Color Contrast
- [ ] Body text: 4.5:1 minimum ✓
- [ ] Large text: 3:1 minimum ✓
- [ ] UI components: 3:1 minimum ✓
- [ ] Disabled state text visible (3:1 minimum)

**Contrast violations:** [List any with ratios]

### Form Accessibility
- [ ] Every input has associated `<label>`
- [ ] Error messages associated (aria-describedby)
- [ ] Required fields marked (aria-required="true")
- [ ] Fieldsets group related inputs with `<legend>`

### Image Alt Text
- [ ] All meaningful images have descriptive alt text
- [ ] Decorative images use empty alt (`alt=""`)
- [ ] Icon buttons have `aria-label` or visible text

**Issues found:** [Number] - [Brief list]

**Status:** ✅ Pass / ⚠️ Issues found

---

## Phase 5: Robustness

### Form Validation
- [ ] Submitted form with empty required fields
- [ ] Entered invalid data (wrong email format, etc.)
- [ ] Tested field-level validation (real-time feedback)
- [ ] Verified clear error messages with guidance
- [ ] Tested successful submission flow

### Content Overflow
- [ ] Tested with long text strings (names, emails, titles)
- [ ] Tested with many items (large lists, tables)
- [ ] Tested deeply nested content
- [ ] Verified empty states (no data to display)

**Overflow issues:** [List any]

### Loading & Error States
- [ ] Verified loading indicators (skeleton screens, spinners)
- [ ] Tested error messages (clear, actionable)
- [ ] Checked retry mechanisms
- [ ] Verified timeout handling

**Issues found:** [Number] - [Brief list]

**Status:** ✅ Pass / ⚠️ Issues found

---

## Phase 6: Code Health

### Component Reuse
- [ ] No copy-pasted components (DRY principle)
- [ ] Shared components extracted to common location
- [ ] Component composition used appropriately

### Design Token Usage
- [ ] Colors use CSS variables or design tokens
- [ ] Spacing uses design system scale
- [ ] Typography follows type scale
- [ ] Border radii consistent with design system

**Hardcoded values found:** [List any]

### Pattern Consistency
- [ ] Follows established code patterns
- [ ] Naming conventions match existing code
- [ ] File structure consistent with project
- [ ] Similar problems solved similarly

**Issues found:** [Number] - [Brief list]

**Status:** ✅ Pass / ⚠️ Issues found

---

## Phase 7: Content & Console

### Content Review
- [ ] Grammar and spelling correct
- [ ] Labels and instructions clear and unambiguous
- [ ] Tone consistent with brand voice
- [ ] Placeholder text replaced with real content
- [ ] Microcopy helpful (error messages, button labels, tooltips)

**Typos/grammar issues:** [List any]

### Console Check
- [ ] Ran console check using browser tools
- [ ] **Console clean (no errors)** ✓

**Console output:**
```
[Paste console output or note "Clean - no errors or warnings"]
```

**Errors found:** [List JavaScript errors, React warnings, network failures, etc.]

**Issues found:** [Number] - [Brief list]

**Status:** ✅ Pass / ⚠️ Issues found

---

## Summary

### Issues by Priority

**Blockers:** [Number]
- [List blocker titles]

**High-Priority:** [Number]
- [List high-priority titles]

**Medium-Priority:** [Number]
- [List medium-priority titles]

**Nitpicks:** [Number]
- [List nitpick titles]

**Total issues:** [Number]

### Phases Passed Completely
- [List phases with no issues - e.g., "Phase 1: Interaction", "Phase 7: Content & Console"]

### Phases with Issues
- [List phases with findings - e.g., "Phase 2: Responsiveness (3 issues)", "Phase 4: Accessibility (2 issues)"]

---

## Overall Assessment

[Choose one:]

- [ ] ✅ **Ready to merge** - No blocking issues found
- [ ] ⚠️ **Ready to merge after blockers fixed** - [X] blocker(s) must be resolved
- [ ] 🛑 **Needs revisions** - Multiple high-priority issues require attention

**Reasoning:** [1-2 sentences]

---

## Next Steps

**Before merge:**
1. [Action 1]
2. [Action 2]

**Follow-up (next sprint/PR):**
1. [Action 1]
2. [Action 2]

**Optional refinements:**
- [Nitpick 1]
- [Nitpick 2]

---

## Review Complete

**Completed by:** [Your name]
**Date:** [YYYY-MM-DD]
**Time spent:** [Approximate time]

**Additional notes:**
[Any additional context or observations]

---

## Quick Copy-Paste Checklist (Compact Version)

For quick tracking during review:

```
Design Review Progress Tracker:

[ ] Phase 0: Preparation (analyze changes, set up preview)
[ ] Phase 1: Interaction & User Flow (test primary flows)
[ ] Phase 2: Responsiveness (desktop/tablet/mobile)
[ ] Phase 3: Visual Polish (typography, spacing, colors)
[ ] Phase 4: Accessibility (WCAG 2.1 AA)
[ ] Phase 5: Robustness (edge cases, error states)
[ ] Phase 6: Code Health (component reuse, design tokens)
[ ] Phase 7: Content & Console (grammar, errors)

Issues Found:
- Blockers: 0
- High: 0
- Medium: 0
- Nitpicks: 0

Status: [ ] Ready / [ ] After fixes / [ ] Needs work
```

---

**Usage Tips:**

1. **Start each review by copying this checklist** to track progress
2. **Check off items as you complete them** to ensure nothing is missed
3. **Take notes in each section** for reference when writing the full report
4. **Use the compact version** for quick tracking during live reviews
5. **Save the completed checklist** alongside the full design review report

**Remember:** This checklist ensures comprehensive, systematic reviews that catch issues across all 7 phases. Don't skip phases!
