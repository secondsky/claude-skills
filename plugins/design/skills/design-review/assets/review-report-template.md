# Design Review Report Template

**Copy this template for all design reviews.** Replace [bracketed content] with actual findings.

---

## Design Review Summary

[2-3 sentences acknowledging what works well and providing overall assessment. Always start positive!]

**Example:**
> The new checkout flow shows excellent attention to user experience. The step indicator is clear and well-designed, error messages are helpful and actionable, and the overall layout feels spacious and uncluttered. The loading states with skeleton screens are particularly well-executed. Great work on the form validation feedback!

**Review scope:** [What was reviewed - e.g., "PR #234: Redesigned user profile page" or "Complete checkout flow at /checkout"]

**Viewports tested:**
- Desktop: 1440px ✓
- Tablet: 768px ✓
- Mobile: 375px ✓

**Methodology:** 7-phase comprehensive review (Preparation, Interaction, Responsiveness, Visual Polish, Accessibility, Robustness, Content & Console)

**Browser tools:** [Playwright MCP / Chrome DevTools CLI]

**Date:** [YYYY-MM-DD]

---

## Findings

### 🚨 Blockers

[Critical issues that MUST be fixed before merge. These prevent core functionality or create critical accessibility violations.]

**If no blockers, state:** "No blocking issues found."

---

#### [Blocker] [Issue Title]

**Problem:** [Describe the issue and its impact on users or functionality. Be specific about why this is critical.]

**Example:**
> The submit button is completely inaccessible via keyboard. Users who rely on keyboard navigation cannot submit the form, making the entire feature unusable for keyboard-only users. This is a critical WCAG violation.

**Screenshot:** [Attach screenshot or note "No screenshot needed for functionality issue"]

**Phase:** [Which phase caught this - e.g., "Phase 4: Accessibility"]

**How to verify:**
1. [Step to reproduce]
2. [Expected behavior]
3. [Actual behavior]

---

#### [Blocker] [Another Issue Title]

[Repeat format for each blocker]

---

### ⚠️ High-Priority Issues

[Significant issues that SHOULD be fixed before merge. These cause noticeable UX problems or violate design standards.]

**If no high-priority issues, state:** "No high-priority issues found."

---

#### [High] [Issue Title]

**Problem:** [Describe the issue and why it's significant]

**Example:**
> The primary button text has insufficient color contrast (2.8:1) against its background, failing WCAG AA requirements (4.5:1 minimum). Users with low vision or color blindness may have difficulty reading the button label.

**Screenshot:** [Attach screenshot showing the issue]

**Phase:** [Which phase caught this]

**Suggested priority:** Fix before merge

---

#### [High] [Another Issue Title]

[Repeat format for each high-priority issue]

---

### 📋 Medium-Priority / Suggestions

[Improvements that would enhance the experience but can be addressed in a follow-up PR.]

**If no medium-priority issues, state:** "No medium-priority suggestions."

---

#### [Medium] [Issue Title]

**Problem:** [Describe the improvement opportunity]

**Example:**
> The card spacing is inconsistent - some cards use 16px padding while others use 20px. This breaks the visual rhythm. Standardizing to var(--space-4) (16px) would improve consistency.

**Phase:** [Which phase]

**Suggested priority:** Address in follow-up PR or next sprint

---

#### [Medium] [Another Issue Title]

[Repeat format for each medium-priority issue]

---

### ✨ Nitpicks

[Minor aesthetic details and optional refinements. Prefix all nitpicks with "Nit:" to clearly signal low priority.]

**If no nitpicks, you can omit this section entirely.**

- **Nit:** [Brief description] - [Why it might be better, but acknowledge it's subjective]

**Examples:**
- **Nit:** The success message could use a checkmark icon for quicker visual recognition - though the green color is already clear.
- **Nit:** Consider reducing the button border-radius from 8px to 6px for better alignment with the input fields - this is a minor aesthetic preference.
- **Nit:** The heading font-weight could be increased from 600 to 700 for slightly more emphasis - current weight is acceptable.

---

## Testing Evidence

### Screenshots Captured

**Desktop (1440px):**
[Attach or reference desktop screenshot]
- URL: [Preview URL tested]
- Viewport: 1440 × 900
- Notes: [Any relevant observations]

**Tablet (768px):**
[Attach or reference tablet screenshot]
- Viewport: 768 × 1024
- Notes: [Any relevant observations - e.g., "Navigation collapses to hamburger menu"]

**Mobile (375px):**
[Attach or reference mobile screenshot]
- Viewport: 375 × 667
- Notes: [Any relevant observations - e.g., "No horizontal scrolling, forms stack vertically"]

### Console Output

```
[Copy browser console output here]
```

**If console is clean:**
> Console clean - no JavaScript errors or warnings detected.

**If errors present:**
> Console errors found:
> - [Error 1: Description and file/line]
> - [Error 2: Description and file/line]

### Accessibility Testing Results

**Keyboard Navigation:**
- [✓ / ✗] All interactive elements keyboard accessible
- [✓ / ✗] Logical tab order (left-to-right, top-to-bottom)
- [✓ / ✗] Visible focus states on all elements
- [✓ / ✗] Enter/Space activates buttons and links
- [✓ / ✗] Escape closes modals

**Notes:** [Any specific findings - e.g., "Submit button missing focus state"]

**Focus States:**
- [✓ / ✗] All interactive elements have visible focus indicators
- [✓ / ✗] Focus indicators meet 3:1 contrast minimum

**Notes:** [Any specific findings]

**Color Contrast:**
- [✓ / ✗] Body text meets 4.5:1 minimum
- [✓ / ✗] Large text meets 3:1 minimum
- [✓ / ✗] UI components meet 3:1 minimum

**Violations:** [List any contrast failures with ratios]

**Semantic HTML:**
- [✓ / ✗] Proper heading hierarchy (h1 → h2 → h3)
- [✓ / ✗] Landmark regions present (nav, main, aside, footer)
- [✓ / ✗] Form labels associated with inputs
- [✓ / ✗] Buttons are <button>, links are <a>

**Notes:** [Any specific findings]

---

## Phase-by-Phase Summary

**Phase 0: Preparation**
- [✓] PR description reviewed
- [✓] Code diff analyzed
- [✓] Preview environment set up
- [✓] Baseline screenshot captured

**Phase 1: Interaction & User Flow**
- [✓ / ✗] Primary user flow tested
- [✓ / ✗] Interactive states verified (hover, active, focus, disabled)
- [✓ / ✗] Destructive actions have confirmations
- Issues found: [Number] ([Blocker/High/Medium/Nitpick] count)

**Phase 2: Responsiveness**
- [✓ / ✗] Desktop (1440px) tested
- [✓ / ✗] Tablet (768px) tested
- [✓ / ✗] Mobile (375px) tested
- [✓ / ✗] No horizontal scrolling
- [✓ / ✗] Touch targets adequate (44px minimum)
- Issues found: [Number] ([Blocker/High/Medium/Nitpick] count)

**Phase 3: Visual Polish**
- [✓ / ✗] Typography hierarchy clear
- [✓ / ✗] Spacing consistent
- [✓ / ✗] Colors follow design system
- [✓ / ✗] Alignment precise
- [✓ / ✗] Visual hierarchy effective
- Issues found: [Number] ([Blocker/High/Medium/Nitpick] count)

**Phase 4: Accessibility (WCAG 2.1 AA)**
- [✓ / ✗] Keyboard navigation complete
- [✓ / ✗] Focus states visible
- [✓ / ✗] Color contrast meets AA
- [✓ / ✗] Semantic HTML correct
- [✓ / ✗] Form labels present
- [✓ / ✗] Image alt text provided
- Issues found: [Number] ([Blocker/High/Medium/Nitpick] count)

**Phase 5: Robustness**
- [✓ / ✗] Form validation tested
- [✓ / ✗] Content overflow handled
- [✓ / ✗] Loading states present
- [✓ / ✗] Error states clear
- Issues found: [Number] ([Blocker/High/Medium/Nitpick] count)

**Phase 6: Code Health**
- [✓ / ✗] Component reuse appropriate
- [✓ / ✗] Design tokens used
- [✓ / ✗] Follows established patterns
- Issues found: [Number] ([Blocker/High/Medium/Nitpick] count)

**Phase 7: Content & Console**
- [✓ / ✗] Grammar and spelling correct
- [✓ / ✗] Console clean (no errors)
- Issues found: [Number] ([Blocker/High/Medium/Nitpick] count)

---

## Summary Statistics

**Total issues found:** [Number]
- Blockers: [Number]
- High-priority: [Number]
- Medium-priority: [Number]
- Nitpicks: [Number]

**Phases with issues:**
- [List phases that had findings]

**Phases passed completely:**
- [List phases with no issues]

---

## Next Steps

**Immediate actions (before merge):**
1. [Action 1 - usually fixing blockers]
2. [Action 2 - usually fixing high-priority issues]

**Example:**
> 1. Fix keyboard accessibility for submit button (Blocker)
> 2. Improve color contrast on disabled button text (High-priority)
> 3. Add missing alt text to product images (High-priority)

**Follow-up actions (next sprint/PR):**
1. [Action 1 - medium-priority improvements]
2. [Action 2 - enhancements]

**Example:**
> 1. Standardize card spacing to use design tokens (Medium)
> 2. Add loading skeleton for async content (Medium)

**Optional refinements:**
- [List nitpicks that could be addressed if time allows]

**Example:**
> - Consider adding checkmark icon to success messages (Nitpick)
> - Adjust button border-radius for consistency (Nitpick)

---

## Overall Assessment

[Choose one and explain reasoning:]

**✅ Ready to merge** - No blocking issues. All critical functionality works correctly. Minor issues can be addressed in follow-up.

**⚠️ Ready to merge after blockers fixed** - [X] blocking issue(s) must be resolved, then good to merge.

**🛑 Needs revisions** - Multiple high-priority issues require attention before merge. See findings above.

**Reasoning:**
[1-2 sentences explaining the assessment]

**Example (Ready to merge after blockers fixed):**
> The implementation is solid overall with excellent attention to visual detail and user experience. The keyboard accessibility issue is critical and must be fixed, but once resolved, this is ready to ship. The high-priority contrast issue should also be addressed before merge for WCAG compliance.

---

## Reviewer Notes

**Reviewer:** [Your name or "Claude Code design-review skill"]

**Review date:** [YYYY-MM-DD]

**Time spent:** [Approximate time - e.g., "~30 minutes"]

**Additional comments:**
[Any additional context, observations, or recommendations that don't fit the categories above]

**Example:**
> This review focused heavily on accessibility due to the form-heavy nature of the changes. The team has done excellent work maintaining visual consistency with the design system. Consider scheduling a follow-up accessibility audit for the entire checkout flow once these changes are merged.

---

**End of Report**

---

## Template Usage Tips

1. **Always start positive** - Acknowledge what works well before listing issues
2. **Be specific** - Include screenshots and exact steps to reproduce
3. **Describe impact** - Explain why each issue matters to users
4. **Triage clearly** - Use the Blocker/High/Medium/Nitpick system consistently
5. **Provide evidence** - Screenshots, console logs, and test results
6. **Keep nitpicks optional** - Clearly mark subjective preferences as "Nit:"
7. **End constructively** - Clear next steps and overall assessment

**Remember:** The goal is to improve the product while maintaining positive collaboration. Focus on problems and impact, not prescriptive solutions.
