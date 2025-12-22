# Troubleshooting Guide

## Overview

This reference provides solutions to common issues encountered when using project-workflow commands.

## Planning Command Issues

### /plan-project: "No project description provided"

**Symptom**: Command fails immediately without generating planning docs

**Root Cause**: Claude needs context about your project before generating structured plans

**Solutions**:
1. **Recommended**: Use `/explore-idea` first to create PROJECT_BRIEF.md
2. **Alternative**: Discuss your project with Claude in conversation, then run `/plan-project`
3. **Quick fix**: Provide requirements inline when running command

**Prevention**: Always provide project context before planning

### /plan-feature: "Prerequisites not met"

**Symptom**: Command refuses to run, mentions missing files

**Root Cause**: /plan-feature requires existing planning documents to integrate with

**Solutions**:
1. **First-time setup**: Run `/plan-project` to create SESSION.md and IMPLEMENTATION_PHASES.md
2. **Verify files exist**: `ls SESSION.md IMPLEMENTATION_PHASES.md`
3. **Wrong directory**: Ensure you're in the project root directory

**Prevention**: Only use /plan-feature on projects already initialized with /plan-project

## Session Command Issues

### /wrap-session: "No git repository found"

**Symptom**: Command fails when trying to create checkpoint commit

**Root Cause**: Session commands create git commits for tracking, require git repository

**Solutions**:
```bash
# Initialize git repository
git init

# Create initial commit
git add .
git commit -m "Initial commit"

# Try /wrap-session again
```

**Prevention**: Always work in git-initialized projects

### /continue-session: "SESSION.md not found"

**Symptom**: Command cannot load session context

**Root Cause**: No session tracking file exists

**Solutions**:
1. **New project**: Run `/plan-project` first to create SESSION.md
2. **Existing project**: Manually create SESSION.md or run `/plan-project`
3. **Wrong directory**: Ensure you're in project root where SESSION.md should exist

**Prevention**: Always run /wrap-session at end of sessions to maintain SESSION.md

### /continue-session: "Context incomplete"

**Symptom**: Command loads but shows missing information

**Root Cause**: SESSION.md is outdated or corrupted

**Solutions**:
1. Check SESSION.md contents manually
2. Re-run /wrap-session to update
3. Manually edit SESSION.md to fix missing fields

**Prevention**: Always use /wrap-session properly (don't manually edit SESSION.md)

## Release Command Issues

### /release: "Secrets detected"

**Symptom**: Release blocked due to potential secret leaks

**Root Cause**: gitleaks found patterns matching API keys, tokens, or passwords

**Solutions**:
1. **Review flagged files**: Check what was detected
2. **Add to .gitignore**: Add sensitive files to .gitignore
3. **Remove from history**:
   ```bash
   git filter-branch --index-filter 'git rm --cached --ignore-unmatch path/to/secret' HEAD
   ```
4. **Use environment variables**: Move secrets to .env files (gitignored)

**Prevention**: Always gitignore sensitive files (.env, credentials.json, etc.)

### /release: "LICENSE file missing"

**Symptom**: Release blocked, requires LICENSE

**Root Cause**: GitHub best practices require license

**Solutions**:
- Command will offer to create LICENSE for you
- Accept offer, or create manually with your preferred license

**Prevention**: Include LICENSE in project templates

### /release: "README incomplete"

**Symptom**: Release shows warning about README

**Root Cause**: README doesn't meet minimum standards

**Solutions**:
- Review README and add missing sections (Installation, Usage, etc.)
- Command may offer to enhance README
- Minimum: 100 words, key sections present

**Prevention**: Write README as you build project

### /release: "Branch protection warning"

**Symptom**: Command warns about pushing to main/master

**Root Cause**: Pushing directly to protected branch

**Solutions**:
1. Create feature branch: `git checkout -b release/v1.0.0`
2. Push feature branch: `git push -u origin release/v1.0.0`
3. Create PR through GitHub

**Prevention**: Always work in feature branches

## General Issues

### Command Not Recognized

**Symptom**: "Command /plan-project not found"

**Root Cause**: project-workflow skill not installed or not discovered

**Solutions**:
1. **Check installation**: `ls ~/.claude/skills/ | grep project-workflow`
2. **Reinstall**: `/plugin install project-workflow@claude-skills`
3. **Restart Claude Code**: Exit and restart CLI

**Prevention**: Verify skill installation before using

### Command Hangs or Times Out

**Symptom**: Command starts but never completes

**Root Cause**: Task agent stuck or context too large

**Solutions**:
1. **Cancel command**: Ctrl+C
2. **Reduce context**: Run /wrap-session to clear context
3. **Check file sizes**: Large files may cause slowdown
4. **Retry**: Often works second time

**Prevention**: Regular /wrap-session prevents context bloat

### Generated Files Look Wrong

**Symptom**: IMPLEMENTATION_PHASES.md or SESSION.md format is unexpected

**Root Cause**: Customized templates or skill version mismatch

**Solutions**:
1. **Check templates**: `ls ~/.claude/skills/project-planning/templates/`
2. **Reset to defaults**: `/plugin remove project-planning` (uses built-in)
3. **Update skills**: `/plugin update project-workflow@claude-skills`

**Prevention**: Document any template customizations

## Getting More Help

**Not listed here?**
- Check command-specific reference files (references/command-*.md)
- Review workflow examples (references/workflow-examples.md)
- Check prerequisites (references/setup-prerequisites.md)
- Open issue: https://github.com/secondsky/claude-skills/issues
