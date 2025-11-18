#!/usr/bin/env python3
"""
QA Review Script for Phase 1-4 Information Preservation
Compares original backups with current versions and bundled resources
"""
import os
import re
from pathlib import Path

def extract_sections(content):
    """Extract major sections from markdown content"""
    sections = {}
    current_section = "header"
    current_content = []

    lines = content.split('\n')
    for line in lines:
        if line.startswith('## '):
            if current_content:
                sections[current_section] = '\n'.join(current_content)
            current_section = line[3:].strip()
            current_content = []
        else:
            current_content.append(line)

    if current_content:
        sections[current_section] = '\n'.join(current_content)

    return sections

def extract_code_blocks(content):
    """Extract all code blocks"""
    code_blocks = re.findall(r'```[\s\S]*?```', content)
    return code_blocks

def extract_errors(content):
    """Extract error descriptions"""
    # Look for common error patterns
    error_patterns = [
        r'(?:Error|Issue|Problem).*?:.*?(?=\n\n|\n##|$)',
        r'⚠️.*?(?=\n\n|\n##|$)',
        r'❌.*?(?=\n\n|\n##|$)',
    ]
    errors = []
    for pattern in error_patterns:
        errors.extend(re.findall(pattern, content, re.MULTILINE | re.DOTALL))
    return errors

def check_skill(skill_name, skills_dir='/home/user/claude-skills/skills'):
    """Check a single skill for information preservation"""
    skill_path = Path(skills_dir) / skill_name

    backup_file = skill_path / 'SKILL-ORIGINAL-BACKUP.md'
    current_file = skill_path / 'SKILL.md'
    references_dir = skill_path / 'references'
    templates_dir = skill_path / 'templates'

    if not backup_file.exists():
        return None, "No backup file found"

    # Read files
    with open(backup_file, 'r', encoding='utf-8') as f:
        original_content = f.read()

    with open(current_file, 'r', encoding='utf-8') as f:
        current_content = f.read()

    # Read all references and templates
    bundled_content = current_content
    if references_dir.exists():
        for ref_file in references_dir.glob('*.md'):
            with open(ref_file, 'r', encoding='utf-8') as f:
                bundled_content += f.read()

    if templates_dir.exists():
        for tmpl_file in templates_dir.rglob('*'):
            if tmpl_file.is_file():
                try:
                    with open(tmpl_file, 'r', encoding='utf-8') as f:
                        bundled_content += f.read()
                except:
                    pass

    # Extract components
    original_sections = extract_sections(original_content)
    original_code_blocks = extract_code_blocks(original_content)
    original_errors = extract_errors(original_content)

    current_sections = extract_sections(current_content)
    bundled_code_blocks = extract_code_blocks(bundled_content)
    bundled_errors = extract_errors(bundled_content)

    # Analyze
    issues = []

    # Check sections - improved to reduce false positives
    missing_sections = set(original_sections.keys()) - set(current_sections.keys())
    if missing_sections:
        # Check if missing sections are in references/templates
        for section in missing_sections:
            section_content = original_sections[section].strip()
            # Skip very short sections (likely just headers)
            if len(section_content) < 50:
                continue
            # Check if substantial portion of content exists in bundled resources
            # Extract meaningful words (>4 chars) from section
            words = [w for w in section_content.split() if len(w) > 4]
            if len(words) < 5:
                continue
            # Sample 10 random words and check if at least 7 exist in bundled content
            import random
            sample_size = min(10, len(words))
            sample_words = random.sample(words, sample_size)
            found_count = sum(1 for word in sample_words if word in bundled_content)

            # Only flag if less than 70% of sampled words found
            if found_count / sample_size < 0.7:
                issues.append({
                    'severity': 'HIGH',
                    'type': 'missing_section',
                    'details': f"Section '{section}' appears to be missing ({found_count}/{sample_size} sample words found)"
                })

    # Check code blocks (allow for some variation)
    code_block_ratio = len(bundled_code_blocks) / max(len(original_code_blocks), 1)
    if code_block_ratio < 0.8:
        issues.append({
            'severity': 'MEDIUM',
            'type': 'reduced_code_examples',
            'details': f"Code blocks reduced from {len(original_code_blocks)} to {len(bundled_code_blocks)}"
        })

    # Check errors
    error_ratio = len(bundled_errors) / max(len(original_errors), 1)
    if error_ratio < 0.8:
        issues.append({
            'severity': 'HIGH',
            'type': 'reduced_error_coverage',
            'details': f"Error descriptions reduced from {len(original_errors)} to {len(bundled_errors)}"
        })

    # Calculate line reduction
    orig_lines = len(original_content.split('\n'))
    curr_lines = len(current_content.split('\n'))
    reduction = ((orig_lines - curr_lines) / orig_lines) * 100

    result = {
        'skill': skill_name,
        'original_lines': orig_lines,
        'current_lines': curr_lines,
        'reduction_pct': f"{reduction:.1f}%",
        'has_references': references_dir.exists(),
        'has_templates': templates_dir.exists(),
        'issues': issues
    }

    return result, None

if __name__ == '__main__':
    import sys
    from pathlib import Path

    # Find all skills with backups
    skills_dir = Path('/home/user/claude-skills/skills')
    skills_with_backups = []
    for skill_dir in skills_dir.iterdir():
        if skill_dir.is_dir():
            backup_file = skill_dir / 'SKILL-ORIGINAL-BACKUP.md'
            if backup_file.exists():
                skills_with_backups.append(skill_dir.name)

    skills_with_backups.sort()

    print("QA Review - Information Preservation Check")
    print("=" * 80)
    print(f"Total skills with backups: {len(skills_with_backups)}")
    print("=" * 80)

    # Track overall statistics
    total_issues = 0
    critical_issues = 0
    high_issues = 0
    medium_issues = 0
    skills_with_issues = []

    for skill in skills_with_backups:
        result, error = check_skill(skill)
        if error:
            print(f"\n❌ {skill}: ERROR - {error}")
        else:
            status = "✅" if len(result['issues']) == 0 else "⚠️"
            print(f"\n{status} {skill}:")
            print(f"  Lines: {result['original_lines']} → {result['current_lines']} ({result['reduction_pct']} reduction)")
            print(f"  Resources: references/={result['has_references']}, templates/={result['has_templates']}")

            if result['issues']:
                print(f"  Issues: {len(result['issues'])}")
                for issue in result['issues']:
                    severity_symbol = "🔴" if issue['severity'] == 'CRITICAL' else "🟠" if issue['severity'] == 'HIGH' else "🟡"
                    print(f"    {severity_symbol} [{issue['severity']}] {issue['type']}: {issue['details']}")

                    # Count severity
                    if issue['severity'] == 'CRITICAL':
                        critical_issues += 1
                    elif issue['severity'] == 'HIGH':
                        high_issues += 1
                    elif issue['severity'] == 'MEDIUM':
                        medium_issues += 1

                total_issues += len(result['issues'])
                skills_with_issues.append((skill, len(result['issues'])))

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Skills reviewed: {len(skills_with_backups)}")
    print(f"Skills with issues: {len(skills_with_issues)}")
    print(f"Total issues: {total_issues}")
    print(f"  Critical: {critical_issues}")
    print(f"  High: {high_issues}")
    print(f"  Medium: {medium_issues}")

    if skills_with_issues:
        print("\nSkills requiring attention:")
        skills_with_issues.sort(key=lambda x: x[1], reverse=True)
        for skill, count in skills_with_issues[:10]:  # Top 10
            print(f"  - {skill}: {count} issues")
    else:
        print("\n🎉 All skills passed information preservation check!")
