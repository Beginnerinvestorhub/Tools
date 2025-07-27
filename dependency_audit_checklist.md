## Dependency Audit & Remediation Checklist

- [ ] Proceed to python-engine directory
- [ ] Proceed to tools directory
- [ ] Proceed to ai_microservice directory
- [ ] Audit and remediate all critical/high dependency vulnerabilities (Python & JS/npm)
  - [ ] Identify latest secure versions for vulnerable dependencies
  - [ ] Upgrade/remediate vulnerable dependencies in requirements.txt and lockfiles
  - [ ] Regenerate lockfiles after upgrades (pnpm/npm install)
  - [ ] Document all vulnerability mitigations and risk acceptances
