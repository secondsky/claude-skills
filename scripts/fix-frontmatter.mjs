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
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO_ROOT = '/Users/eddie/github-repos/claude-skills';
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

      if (continuations.length > 0) {
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
            // Content line: add 2-space indent if not already indented enough
            // Original lines like "  Keywords: ..." become "    Keywords: ..."
            if (/^\s{2}/.test(cl)) {
              out.push('  ' + cl); // add 2 more spaces to existing 2-space indent
            } else if (/^\s/.test(cl)) {
              out.push(cl); // already indented enough
            } else {
              out.push('  ' + cl); // no indent, add 2 spaces
            }
          }
        }
        changed = true;
        i = j;
        continue;
      }

      // ── single-line with unquoted colon → wrap in double quotes ──
      if (firstValue.includes(':') && !/^['"]/.test(firstValue)) {
        const escaped = firstValue.replace(/"/g, '\\"');
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

      while (j < lines.length) {
        const next = lines[j];
        if (next.trim() === '') {
          block.push(next);
          j++;
          continue;
        }
        if (next.match(/^\s+-\s/)) {
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
      i = j;
      continue;
    }

    out.push(line);
    i++;
  }

  return { lines: out, changed };
}

// ── main ─────────────────────────────────────────────────────────────────────

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
    writeFileSync(file, newContent, 'utf8');
    fixedCount++;
    fixedNames.push(relative(REPO_ROOT, file));
  }
}

console.log(`Fixed ${fixedCount} file(s):`);
for (const name of fixedNames) console.log(`  ${name}`);
