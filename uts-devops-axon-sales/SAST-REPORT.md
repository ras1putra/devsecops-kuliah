# SAST Security Scan Report

**Tool:** Semgrep (248 rules)
**Date:** 2026-10-12
**Project:** axon-sales-dashboard

## Summary

| Metric | Value |
|--------|-------|
| Rules executed | 248 |
| Files scanned | 71 |
| Total findings | 8 |
| Blocking | 8 |

## Findings

| # | Severity | File | Rule | Description |
|---|----------|------|------|-------------|
| 1 | WARNING | .github/workflows/deploy.yml:15 | github-actions-mutable-action-tag | Mutable action tag reference |
| 2 | WARNING | .github/workflows/deploy.yml:18 | github-actions-mutable-action-tag | Mutable action tag reference |
| 3 | WARNING | .github/workflows/deploy.yml:43 | github-actions-mutable-action-tag | Mutable action tag reference |
| 4 | WARNING | .github/workflows/sast.yml:18 | github-actions-mutable-action-tag | Mutable action tag reference |
| 5 | WARNING | .github/workflows/sast.yml:34 | github-actions-mutable-action-tag | Mutable action tag reference |
| 6 | WARNING | nginx/nginx.conf:8 | request-host-used | Host header injection risk |
| 7 | WARNING | nginx/nginx.conf:17 | possible-nginx-h2c-smuggling | H2C smuggling vulnerability |
| 8 | WARNING | nginx/nginx.conf:20 | request-host-used | Host header injection risk |

## Security Features Implemented

| Feature | Status |
|---------|--------|
| JWT Auth (login/register/me) | Done |
| bcrypt password hashing (12 rounds) | Done |
| Security headers (CSP, HSTS, X-Frame-Options) | Done |
| Input validation (email format, password length) | Done |
| Parameterized SQL queries | Done |
| Auto-init DB via Docker entrypoint | Done |
| SAST in CI/CD (Semgrep) | Done |

## Auth Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| /api/auth/register | POST | No | Create new user |
| /api/auth/login | POST | No | Get JWT token |
| /api/auth/me | GET | Yes (Bearer) | Get current user |

## Evidence

- SAST results: `semgrep-results.json`
- CI workflow: `.github/workflows/sast.yml`
- Scan command: `semgrep --config p/security-audit --config p/owasp-top-ten --config p/typescript --config p/react --config p/nodejsscan`
