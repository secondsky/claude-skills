# Security Policy

## Supported Versions

Currently supported versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. **DO NOT** Open a Public Issue

Security vulnerabilities should be reported privately to avoid exploitation before a fix is available.

### 2. Report via GitHub Security Advisories

1. Go to the [Security tab](../../security)
2. Click "Report a vulnerability"
3. Fill out the advisory form with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

### 3. Alternative: Email

If GitHub Security Advisories are unavailable, email us at:
- **Email**: security@your-domain.com
- **PGP Key**: [Optional: Link to PGP key]

### What to Include

Please include as much of the following information as possible:

- **Type of vulnerability** (e.g., XSS, SQLi, CSRF, etc.)
- **Full paths** of source files related to the vulnerability
- **Location** of the affected code (tag/branch/commit)
- **Step-by-step instructions** to reproduce
- **Proof-of-concept** or exploit code (if available)
- **Impact** of the vulnerability
- **Suggested remediation** (if you have ideas)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Fix Timeline**:
  - Critical: 7 days
  - High: 30 days
  - Medium: 90 days
  - Low: Next release

## Disclosure Policy

- We follow **coordinated disclosure**
- We'll work with you to understand and fix the issue
- We'll credit you in the security advisory (unless you prefer anonymity)
- We'll publish a security advisory after the fix is released

## Security Best Practices

If you're contributing code, please follow these guidelines:

### Input Validation

- Validate all user input
- Use allowlists over denylists
- Sanitize data before processing

### Authentication & Authorization

- Use established authentication libraries
- Implement proper session management
- Check permissions at every access point

### Data Protection

- Encrypt sensitive data at rest and in transit
- Never log sensitive information
- Use environment variables for secrets

### Dependencies

- Keep dependencies up to date
- Review Dependabot alerts
- Run `npm audit` regularly

## Security Features

This project uses:

- [x] Dependabot for dependency updates
- [x] CodeQL for security scanning
- [x] Branch protection rules
- [x] Required code reviews
- [ ] SAST (Static Application Security Testing)
- [ ] DAST (Dynamic Application Security Testing)

## Bug Bounty Program

<!-- Update if you have a bug bounty program -->

We currently **do not** have a formal bug bounty program. However, we deeply appreciate security researchers who report vulnerabilities responsibly and will acknowledge them publicly (with permission).

## Past Security Advisories

View all published security advisories: [Security Advisories](../../security/advisories)

## Contact

- **Security Email**: security@your-domain.com
- **General Contact**: support@your-domain.com
- **Website**: https://your-domain.com

## Attribution

We appreciate the following security researchers who have helped make this project more secure:

<!-- List contributors here -->
- [Name] - [Vulnerability type] - [Date]

Thank you for helping keep our project and our users safe!
