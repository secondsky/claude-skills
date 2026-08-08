#!/usr/bin/env node
/**
 * Fix broken YAML frontmatter in SKILL.md files.
 *
 * Pattern A: Multiline description with indented "Keywords:" (the YAML parser
 *            sees the indented "Keywords:" as a new mapping key, causing failure).
 *            Fix: use >- folded block scalar for the description value, with
 *            all content properly indented by 2+ spaces.
 *            Also handles single-line descriptions containing colons (wrap in quotes).
 *
 * Pattern B: Inconsistent list indentation in metadata.keywords (tanstack-start).
 *            Fix: normalize all list items to use the same indentation.
 *
 * Safety: before rewriting each SKILL.md whose content actually changes, the
 *         previous content is written to <file>.bak. These .bak files are kept
 *         (not auto-deleted) so changes can be diffed or reverted. Idempotent
 *         runs (no change) do not create .bak files.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const PLUGINS_DIR = join(REPO_ROOT, 'plugins');

// ── helpers ──────────────────────────────────────────────────────────────────

function findSkillFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findSkillFiles(full));
    else if (entry.name === 'SKILL.md') results.push(full);
  }
  return results;
}

/** Return the raw frontmatter string (between the --- delimiters) or null. */
function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? { raw: match[1], end: match[0].length } : null;
}

// ── Pattern A fix ────────────────────────────────────────────────────────────

/**
 * A YAML key at the top level of the frontmatter starts at column 0 (no indent)
 * and matches the pattern: `word:` or `word-with-hyphens:`
 *
 * A continuation line for a description value is any line that does NOT match
 * that top-level key pattern.
 */
function isTopLevelKey(line) {
  // The closing frontmatter delimiter ends the YAML block — it must not be
  // folded into a description value. Without this, a description that is the
  // last frontmatter field swallowed the trailing `---` and corrupted the file.
  if (/^---\s*$/.test(line)) return true;
  // Match YAML keys at column 0: "key: value" or "key:" (no value on same line)
  return /^[a-z][a-z0-9-]*:(\s|$)/.test(line);
}

function fixDescriptionBlock(lines) {
  const out = [];
  let i = 0;
  let changed = false;

  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^description:\s*(.*)/);

    if (m) {
      const firstValue = m[1]; // text after "description: "

      // Idempotency: if the description is already a YAML block scalar header
      // (`>`, `|`, `>-`, `|2`, `>3-`, `| # comment`, etc.) it has already been
      // normalized — leave it untouched. A block-scalar header is `>` or `|`
      // followed by an optional indentation indicator (digit 1-9) and/or a
      // chomping indicator (`-`/`+`) in any order, then an optional comment.
      // Match the header token (before any comment) then allow trailing space
      // + `# ...`.
      const headerCore = /^[>|]([1-9][-+]?|[-+]?[1-9]?|[-+]?)$/;
      const fv = firstValue.trim();
      const headerToken = fv.split(/\s+#/)[0];
      if (headerCore.test(headerToken)) {
        out.push(line);
        i++;
        continue;
      }

      // Gather continuation lines: everything that is NOT a top-level key
      const continuations = [];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        if (isTopLevelKey(next)) {
          break; // new key → stop
        }
        continuations.push(next);
        j++;
      }

      // Only fold into a block scalar if there is non-blank continuation
      // content. A description followed only by blank line(s) and then the next
      // key (or the closing ---) is already valid and must NOT be rewritten —
      // previously such lines were falsely converted to `>-`, corrupting
      // already-correct quoted descriptions.
      const hasNonBlankContinuation = continuations.some(l => l.trim() !== '');

      if (continuations.length > 0 && hasNonBlankContinuation) {
        // ── multiline description → use >- folded block scalar ──
        // All content after >- must be indented by ≥2 spaces
        out.push('description: >-');

        // First value line: indent by 2
        if (firstValue.trim() !== '') {
          out.push('  ' + firstValue);
        }

        for (const cl of continuations) {
          if (cl.trim() === '') {
            // Blank line: keep as-is (YAML folds these)
            out.push('');
          } else {
            // Content line: a `>-` folded block scalar requires every content
            // line indented by ≥2 spaces. Previously a 1-space-indented line
            // was emitted unchanged (the `/^\s/` branch), producing invalid
            // YAML. Normalise: strip existing leading whitespace, then apply a
            // uniform 2-space indent. Deeper relative indentation is not
            // preserved because the original skill descriptions are flat.
            out.push('  ' + cl.trimStart());
          }
        }
        changed = true;
        i = j;
        continue;
      }

      // ── single-line with unquoted colon → wrap in double quotes ──
      if (firstValue.includes(':') && !/^['"]/.test(firstValue)) {
        // Escape backslashes first, then quotes — standard YAML double-quoted
        // scalar order. Skipping the backslash escape produces invalid YAML
        // when a value ends in `\` (e.g. `path\` → `"path\"` is unterminated).
        const escaped = firstValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        out.push(`description: "${escaped}"`);
        changed = true;
        i++;
        continue;
      }
    }

    out.push(line);
    i++;
  }

  return { lines: out, changed };
}

// ── Pattern B fix ────────────────────────────────────────────────────────────

/**
 * Inside a YAML list, if some items are indented differently, normalise every
 * item in that list to the indentation of the *first* item.
 */
function fixListIndentation(lines) {
  const out = [];
  let i = 0;
  let changed = false;

  while (i < lines.length) {
    const line = lines[i];
    const listMatch = line.match(/^(\s+)-\s/);

    if (listMatch) {
      const blockIndent = listMatch[1]; // indentation of first item
      const block = [line];
      let j = i + 1;

      // Consume only the items that belong to THIS list: same indentation as
      // the first item, optionally separated by blank lines. Previously the
      // collector consumed every consecutive `^\s+-\s` line regardless of
      // indentation, which merged separately-indented lists and corrupted
      // nested-list semantics. A list item at a different indentation ends the
      // block (it is a different list). Buffer blank lines so that when the
      // block breaks on a non-matching line, the trailing blanks are preserved
      // in the output rather than silently dropped.
      let pendingBlanks = [];
      while (j < lines.length) {
        const next = lines[j];
        if (next.trim() === '') {
          pendingBlanks.push(next);
          j++;
          continue;
        }
        const nextMatch = next.match(/^(\s+)-\s/);
        if (nextMatch && nextMatch[1] === blockIndent) {
          if (pendingBlanks.length) block.push(''); // single separating blank
          pendingBlanks = [];
          block.push(next);
          j++;
          continue;
        }
        break;
      }

      // Normalise every list item to blockIndent
      const normalised = block.map(l => {
        if (l.trim() === '') return l;
        const itemMatch = l.match(/^(\s+)(-\s.*)$/);
        if (!itemMatch) return l;
        if (itemMatch[1] !== blockIndent) {
          changed = true;
          return blockIndent + itemMatch[2];
        }
        return l;
      });

      out.push(...normalised);
      out.push(...pendingBlanks);
      i = j;
      continue;
    }

    out.push(line);
    i++;
  }

  return { lines: out, changed };
}

// ── main ─────────────────────────────────────────────────────────────────────

if (!existsSync(PLUGINS_DIR)) {
  console.error(`ERROR: plugins directory not found at ${PLUGINS_DIR}`);
  console.error('Run this script from the claude-skills repo.');
  process.exit(1);
}

const files = findSkillFiles(PLUGINS_DIR);
let fixedCount = 0;
const fixedNames = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const fm = extractFrontmatter(content);
  if (!fm) continue;

  const fmLines = fm.raw.split('\n');

  // Apply both fixes in sequence
  const step1 = fixDescriptionBlock(fmLines);
  const step2 = fixListIndentation(step1.lines);

  if (step1.changed || step2.changed) {
    const newContent = '---\n' + step2.lines.join('\n') + '\n---' + content.slice(fm.end);
    // Only write if the content actually changes. On change, preserve the
    // previous content in <file>.bak (kept; not auto-deleted).
    const oldContent = readFileSync(file, 'utf8');
    if (oldContent === newContent) continue;
    writeFileSync(file + '.bak', oldContent, 'utf8');
    writeFileSync(file, newContent, 'utf8');
    fixedCount++;
    fixedNames.push(relative(REPO_ROOT, file));
  }
}

console.log(`Fixed ${fixedCount} file(s):`);
for (const name of fixedNames) console.log(`  ${name}`);
