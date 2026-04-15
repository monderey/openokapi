# Security Policy

## Supported Versions

Only the latest release line is supported with security updates.

| Version | Supported |
| ------- | --------- |
| latest  | yes       |

## Reporting a Vulnerability

Please report vulnerabilities privately.

1. Open a private security report to the maintainer.
2. Include a clear impact description, affected component, and reproduction steps.
3. If possible, include proof-of-concept payloads and logs with secrets removed.

Initial response target: 72 hours.

## Disclosure Process

1. Triage and severity assessment.
2. Fix development and validation.
3. Coordinated disclosure after patch availability.

## Security Baseline

The project enforces:

1. API key and User-Agent validation for gateway API access.
2. Rate limiting for API endpoints.
3. Private file and directory permissions for local secrets (`0600` files, `0700` directory).
4. Security response headers for gateway responses.
5. WebSocket origin validation (local-only by default, configurable by `OPENOKAPI_ALLOWED_ORIGINS`).

## Operational Recommendations

1. Set `OPENOKAPI_ALLOWED_ORIGINS` in production to an explicit allowlist.
2. Enable `OPENOKAPI_TRUST_PROXY=true` only behind a trusted reverse proxy.
3. Rotate API keys regularly and after any suspected leak.
4. Keep dependencies updated and run `pnpm audit` in CI.
