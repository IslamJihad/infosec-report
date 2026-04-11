---
mode: agent
description: Full OWASP security audit of a file or module
---

Perform a thorough security audit of ${file}.

### Checklist (check each explicitly):

- [ ] **A01 - Broken Access Control**: Are authorization checks present and correct?
- [ ] **A02 - Cryptographic Failures**: Are secrets hashed/encrypted? TLS enforced?
- [ ] **A03 - Injection**: SQL, command, LDAP injection risks?
- [ ] **A04 - Insecure Design**: Missing rate limiting, no input validation?
- [ ] **A05 - Security Misconfiguration**: Debug mode, verbose errors, default creds?
- [ ] **A06 - Vulnerable Components**: Outdated dependencies with CVEs?
- [ ] **A07 - Auth Failures**: Weak session management, no MFA support?
- [ ] **A08 - Software Integrity**: Unverified dependencies, unsafe deserialization?
- [ ] **A09 - Logging Failures**: Are security events logged? Are logs missing context?
- [ ] **A10 - SSRF**: Can user input trigger server-side requests to internal systems?

### Output:
For each finding:
1. OWASP category and severity (Critical / High / Medium / Low)
2. The vulnerable code with line reference
3. Attack scenario (how an attacker would exploit it)
4. Remediation code example

At the end, provide a **Security Score** (0-10) and a prioritized fix list.
