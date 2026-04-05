# Security Posture Score (SPS) — Methodology v1.0

> **Version:** SPS v1 | **Effective:** April 2026  
> **Standards basis:** NIST CSF 2.0, ISO/IEC 27001:2022, NIST SP 800-30 Rev.1

---

## 1. Overview

The Security Posture Score (SPS) is a single composite metric (0–100) that measures an organisation's current cybersecurity posture across six weighted domains. It replaces the previous SPI v2 formula.

The SPS is a **two-tier weighted average**:

```
SPS = clamp(round(Σ(DomainScore × DomainWeight)), 0, 100)

DomainScore = Σ(subMetric.value × subMetric.weight) / Σ(subMetric.weight)
```

All sub-metric values are direct inputs in the range **0–100**. All sub-metric weights are relative integers (not percentages of a 100 total). All domain weights are decimal fractions that sum to exactly **1.0**.

**Neutral default:** When no sub-metric values have been entered (`spsDomainsJson = '[]'`), every sub-metric defaults to **50**, yielding a neutral SPS of **50**.

---

## 2. Domain Weights

| # | Domain (Arabic) | Domain (English) | ID | Weight |
|---|---|---|---|---|
| 1 | إدارة الثغرات | Vulnerability Management | `vuln-mgmt` | 25% |
| 2 | الاستجابة للحوادث | Incident Response | `incident-response` | 20% |
| 3 | الامتثال | Compliance | `compliance` | 20% |
| 4 | الوعي الأمني | Security Awareness | `security-awareness` | 15% |
| 5 | إدارة المخاطر | Risk Management | `risk-mgmt` | 10% |
| 6 | تعزيز البنية التحتية | Infrastructure Hardening | `infra-hardening` | 10% |
| | **Total** | | | **100%** |

---

## 3. Sub-Metrics per Domain

### 3.1 إدارة الثغرات — Vulnerability Management (25%)

| Sub-Metric | Arabic | Relative Weight |
|---|---|---|
| `sla-compliance` | الامتثال لاتفاقيات SLA | 40 |
| `mean-time-to-patch` | متوسط وقت التصحيح | 30 |
| `vuln-density` | كثافة الثغرات | 15 |
| `scan-coverage` | تغطية المسح الأمني | 15 |

**Scoring guidance:**
- SLA Compliance: % of critical/high vulns patched within agreed SLA window
- Mean Time to Patch: normalised — 0 days = 100, ≥60 days = 0
- Vulnerability Density: inverse of vuln count per asset — lower density = higher score
- Scan Coverage: % of in-scope assets scanned in the last 30 days

### 3.2 الاستجابة للحوادث — Incident Response (20%)

| Sub-Metric | Arabic | Relative Weight |
|---|---|---|
| `mttr-efficiency` | كفاءة MTTR | 35 |
| `mttd` | متوسط وقت الاكتشاف | 25 |
| `incident-recurrence` | تكرار الحوادث | 20 |
| `ir-plan-testing` | اختبار خطة الاستجابة | 20 |

**Scoring guidance:**
- MTTR Efficiency: normalised vs target MTTC — at target = 100, 2× target = 0
- MTTD: normalised — at target = 100, 2× target = 0
- Incident Recurrence: % of incidents that did NOT recur within 90 days
- IR Plan Testing: % of playbooks tested in the last 12 months

### 3.3 الامتثال — Compliance (20%)

| Sub-Metric | Arabic | Relative Weight |
|---|---|---|
| `framework-avg` | متوسط أطر الامتثال | 60 |
| `audit-closure` | إغلاق ملاحظات التدقيق | 25 |
| `policy-currency` | حداثة السياسات | 15 |

**Scoring guidance:**
- Framework Average: average ISO 27001 control implementation % across all 14 domains
- Audit Finding Closure: % of audit findings closed within agreed timeline
- Policy Currency: % of security policies reviewed/updated in the last 12 months

### 3.4 الوعي الأمني — Security Awareness (15%)

| Sub-Metric | Arabic | Relative Weight |
|---|---|---|
| `training-completion` | إتمام التدريب | 30 |
| `phishing-click-rate` | معدل النقر على التصيد | 40 |
| `phishing-report-rate` | معدل الإبلاغ عن التصيد | 30 |

**Scoring guidance:**
- Training Completion: % of staff who completed mandatory security awareness training
- Phishing Click Rate: inverse — 0% click rate = 100, 30%+ click rate = 0
- Phishing Report Rate: % of simulated phishing emails reported by staff

### 3.5 إدارة المخاطر — Risk Management (10%)

| Sub-Metric | Arabic | Relative Weight |
|---|---|---|
| `risk-register` | اكتمال سجل المخاطر | 35 |
| `risk-mitigation` | تقدم معالجة المخاطر | 35 |
| `vendor-risk` | تقييم مخاطر الموردين | 30 |

**Scoring guidance:**
- Risk Register Completeness: % of identified risks with full fields (owner, treatment, date)
- Risk Mitigation Progress: % of accepted/mitigated risks vs total open risks
- Vendor Risk Assessment: % of critical vendors with completed risk assessments

### 3.6 تعزيز البنية التحتية — Infrastructure Hardening (10%)

| Sub-Metric | Arabic | Relative Weight |
|---|---|---|
| `endpoint-protection` | حماية نقاط النهاية | 30 |
| `mfa-adoption` | المصادقة متعددة العوامل | 25 |
| `encryption-compliance` | امتثال التشفير | 25 |
| `cloud-security` | وضع أمان السحابة | 20 |

**Scoring guidance:**
- Endpoint Protection: % of endpoints with active, updated EDR/AV
- MFA Adoption: % of privileged accounts with MFA enforced
- Encryption Compliance: % of data stores (at rest + in transit) meeting encryption policy
- Cloud Security Posture: CSP security score or manual normalised % from cloud assessment

---

## 4. Rating Scale

| SPS Range | Rating | Arabic |
|---|---|---|
| 90–100 | Excellent | ممتاز |
| 80–89 | Strong | قوي |
| 70–79 | Moderate | متوسط |
| 60–69 | Below Average | دون المتوسط |
| 0–59 | Critical | حرج |

---

## 5. Worked Example

**Inputs (illustrative):**

| Domain | Σ(value × weight) / Σ(weights) | DomainScore | DomainWeight | Contribution |
|---|---|---|---|---|
| Vulnerability Management | (80×40 + 65×30 + 70×15 + 85×15) / 100 | 74.8 | 0.25 | 18.7 |
| Incident Response | (70×35 + 60×25 + 80×20 + 50×20) / 100 | 65.5 | 0.20 | 13.1 |
| Compliance | (75×60 + 80×25 + 90×15) / 100 | 78.5 | 0.20 | 15.7 |
| Security Awareness | (90×30 + 85×40 + 70×30) / 100 | 82.0 | 0.15 | 12.3 |
| Risk Management | (60×35 + 55×35 + 65×30) / 100 | 59.8 | 0.10 | 6.0 |
| Infrastructure Hardening | (80×30 + 75×25 + 70×25 + 65×20) / 100 | 73.3 | 0.10 | 7.3 |

```
rawScore = 18.7 + 13.1 + 15.7 + 12.3 + 6.0 + 7.3 = 73.1
SPS = clamp(round(73.1), 0, 100) = 73  →  Rating: Moderate (متوسط)
```

---

## 6. Standards References

| Standard | Relevance |
|---|---|
| **NIST CSF 2.0** (NIST.CSWP.29) | Domain selection and function mapping (Identify, Protect, Detect, Respond, Recover) |
| **ISO/IEC 27001:2022** | Compliance domain sub-metrics, control coverage tracking |
| **NIST SP 800-30 Rev.1** | Risk management scoring principles and likelihood/impact framework |

---

## 7. Governance Notes

- Domain weights (25%/20%/20%/15%/10%/10%) reflect the organisation's risk priorities as of April 2026 and should be reviewed **annually** by the CISO against peer benchmarks.
- Sub-metric relative weights within each domain are fixed but may be adjusted with documented justification.
- The neutral default of **50** for all sub-metrics when no data is entered ensures a mid-range starting SPS that does not artificially inflate or deflate the score before real data is available.
