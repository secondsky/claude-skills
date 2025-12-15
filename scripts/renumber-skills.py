#!/usr/bin/env python3
"""
Renumber all skills in SKILLS_REVIEW_PROGRESS.md to be sequential 1-169
"""

import re
import sys

def renumber_skills(input_file, output_file):
    with open(input_file, 'r') as f:
        content = f.read()

    # Track which tier we're in to know when to start renumbering
    current_number = 1
    lines = content.split('\n')
    result_lines = []
    in_tier_table = False

    for line in lines:
        # Detect tier headers
        if line.startswith('### Tier'):
            in_tier_table = False

        # Detect table start (header row with |---|)
        if '|---|' in line and 'Skill' in ''.join(result_lines[-3:]):
            in_tier_table = True
            result_lines.append(line)
            continue

        # If we're in a tier table and line starts with | digit(s) |
        if in_tier_table and re.match(r'^\| \d+', line):
            # Extract skill name and rest of row
            match = re.match(r'^\| \d+ \| ([a-z][a-z0-9-]+) \|(.*)$', line)
            if match:
                skill_name = match.group(1)
                rest_of_row = match.group(2)
                # Renumber this skill
                new_line = f'| {current_number} | {skill_name} |{rest_of_row}'
                result_lines.append(new_line)
                current_number += 1
                continue

        # Not a skill row, keep as-is
        result_lines.append(line)

    with open(output_file, 'w') as f:
        f.write('\n'.join(result_lines))

    print(f"Renumbered {current_number - 1} skills")
    return current_number - 1

if __name__ == '__main__':
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'planning/SKILLS_REVIEW_PROGRESS.md'
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file

    count = renumber_skills(input_file, output_file)
    print(f"Successfully renumbered to 1-{count}")
