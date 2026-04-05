# Scoring Methodology — Security Posture Index (SPI v2)

## Purpose
This document explains how the global Security Posture Index (SPI) is computed. Every component is scored 0–100, and the final score is a weighted average — no penalty/bonus gymnastics, no clamping surprises.

## Final Equation

```text
SPI = clamp(round(
  0.25 × ComplianceScore
+ 0.20 × MaturityScore
+ 0.15 × AssetProtectionScore
+ 0.25 × RiskPostureScore
+ 0.15 × OperationalScore
), 0, 100)
```

All weights sum to **1.0**. Output is always **0–100**.

---

## Component Equations

### 1) ComplianceScore (weight 25%)

```text
ComplianceScore = clamp(kpiCompliance, 0, 100)
```

Direct ISO 27001 compliance percentage. No transformation needed.

### 2) MaturityScore (weight 20%)

```text
For each domain with score on 1–5 scale:
  normalized = ((score - 1) / 4) × 100
  → 1→0, 2→25, 3→50, 4→75, 5→100

For scores already on 0–100 scale (> 5):
  normalized = clamp(score, 0, 100)

MaturityScore = average(normalizedScores)
```

If no maturity domains exist: **MaturityScore = 50** (neutral default).

### 3) AssetProtectionScore (weight 15%)

```text
AssetProtectionScore = average(asset.protectionLevel for each asset)
```

Each `protectionLevel` is clamped to 0–100. If no assets exist: **AssetProtectionScore = 50** (neutral default).

### 4) RiskPostureScore (weight 25%)

This is the most critical component. It starts at 100 and deducts per-risk based on severity band and status:

```text
RiskPostureScore = max(0, 100 - totalDeduction)
```

#### Risk Severity Bands (probability × impact)

| Band | prob × impact | Description |
| --- | --- | --- |
| Critical | ≥ 15 | Catastrophic exposure |
| High | 10–14 | Serious exposure |
| Medium | 5–9 | Moderate concern |
| Low | 1–4 | Minor issue |

#### Deduction Table

| Severity Band | Open | In-Progress | Closed |
| --- | --- | --- | --- |
| Critical | −25 | −12 | 0 |
| High | −15 | −7 | 0 |
| Medium | −8 | −4 | 0 |
| Low | −3 | −1.5 | 0 |

Key principles:
- **No double-counting**: each risk contributes exactly one deduction
- **In-progress gets partial credit**: reflects active mitigation efforts
- **Closed risks = zero deduction**: resolved means resolved
- **Severity-proportional**: a critical open risk (−25) hurts 8× more than a low open risk (−3)
- If no risks exist: **RiskPostureScore = 100**

### 5) OperationalScore (weight 15%)

Combines KPI achievement and SLA compliance into one coherent metric:

```text
OperationalScore = 0.70 × KPIAchievement + 0.30 × SLACompliance
```

**KPIAchievement** (0–100):
```text
For each KPI:
  if lowerBetter:
    normalized = (actual == 0) ? 100 : clamp((target / actual) × 100, 0, 100)
  else:
    normalized = clamp((actual / target) × 100, 0, 100)

KPIAchievement = average(normalizedKPIs)
```
If no KPIs exist: **KPIAchievement = 50** (neutral default).

**SLACompliance** (0–100):
```text
if MTTC ≤ target:
  SLACompliance = 100
else:
  SLACompliance = max(0, 100 - ((MTTC - target) / target) × 100)
```
At 2× target → 0. At 1.5× target → 50. If no SLA data: **SLACompliance = 50** (neutral default).

---

## Score Interpretation Bands

| Score | Level (Arabic) | Level (English) |
| --- | --- | --- |
| 90–100 | ممتاز | Excellent |
| 75–89 | جيد جداً | Very Good |
| 60–74 | جيد | Good |
| 45–59 | متوسط | Average |
| 30–44 | ضعيف | Weak |
| 0–29 | حرج | Critical |

---

## Worked Example

**Inputs:**
- Compliance: 72%
- Maturity domains: [3, 4, 3, 2, 3, 4, 3, 3] (1–5 scale)
- Assets: protection levels [70, 60, 55]
- Risks:
  - 1 critical open (5×4=20)
  - 2 high open (4×3=12 each)
  - 1 medium in-progress (3×3=9)
  - 1 low closed (2×1=2)
- KPI average achievement: 75%
- MTTC: 30h, target: 24h

**Calculation:**

| Step | Component | Calculation | Score |
| --- | --- | --- | --- |
| 1 | Compliance | 72 | 72.0 |
| 2 | Maturity | avg(50, 75, 50, 25, 50, 75, 50, 50) | 53.1 |
| 3 | Asset Protection | avg(70, 60, 55) | 61.7 |
| 4 | Risk Posture | 100 − (25 + 15 + 15 + 4 + 0) = 100 − 59 | 41.0 |
| 5 | Operational | 0.70×75 + 0.30×75 = 52.5 + 22.5 | 75.0 |

Risk deduction breakdown:
- Critical open (5×4=20): −25
- High open (4×3=12): −15
- High open (4×3=12): −15
- Medium in-progress (3×3=9): −4
- Low closed (2×1=2): 0

SLA compliance: max(0, 100 − ((30−24)/24)×100) = max(0, 100 − 25) = 75

**Final SPI:**
```text
= round(0.25×72 + 0.20×53.1 + 0.15×61.7 + 0.25×41 + 0.15×75)
= round(18.0 + 10.6 + 9.3 + 10.3 + 11.3)
= round(59.5)
= 60 → "Good / جيد"
```

This result makes sense: decent compliance and operations, but dragged down by 3 unresolved high/critical risks and below-average maturity.

---

## Neutral Defaults for Missing Data

| Missing Data | Default | Rationale |
| --- | --- | --- |
| No maturity domains | 50 | Neutral — doesn't help or hurt |
| No assets | 50 | Neutral — doesn't help or hurt |
| No efficiency KPIs | 50 | Neutral — doesn't help or hurt |
| No SLA data | 50 | Neutral — doesn't help or hurt |
| No risks | 100 | No risks = perfect risk posture |

The neutral default of 50 ensures incomplete reports aren't unfairly penalized (0 would punish) or inflated (100 would reward doing nothing).

---

## Standards-to-Implementation Mapping

| Standard | What it supports | Where used in model |
| --- | --- | --- |
| NIST SP 800-30 Rev.1 | Likelihood-impact risk assessment | Probability × impact severity bands and per-risk deductions |
| NIST CSF 2.0 | Governance-driven measurable cyber risk | Weighted component model covering all CSF functions |
| ISO/IEC 27001:2022 | Risk-based ISMS and control effectiveness | Compliance score, maturity domains, asset protection |
| FIRST CVSS v4.0 | Structured severity communication | Severity band approach for risk scoring |

Sources:
- NIST SP 800-30 Rev.1: https://doi.org/10.6028/NIST.SP.800-30r1
- NIST CSF 2.0: https://doi.org/10.6028/NIST.CSWP.29
- FIRST CVSS v4.0: https://www.first.org/cvss/v4.0/specification-document
- ISO/IEC 27001:2022: https://www.iso.org/standard/27001

## Calibration Boundary (Governance Note)

The standards above justify the method family (risk-based, measurable, transparent scoring). They do not prescribe this exact equation or these exact coefficients.

Internal calibration choices in v2:
- Component weights: `0.25 / 0.20 / 0.15 / 0.25 / 0.15`
- Risk deductions: Critical(25/12), High(15/7), Medium(8/4), Low(3/1.5)
- Operational sub-weights: KPI 70%, SLA 30%
- Neutral default: 50

These values should be approved and periodically reviewed by security governance (e.g., CISO and Risk Committee).

---

## Audit Fields Available Per Report

The score response includes these auditable objects for traceability:
- `complianceDetails`
- `maturityDetails` (including per-domain normalized scores)
- `assetProtectionDetails` (including per-asset protection levels)
- `riskPostureDetails` (including per-risk deduction records with band, status, and deduction)
- `operationalDetails` (including per-KPI normalization and SLA compliance)
- `componentScores` (all 5 component scores)
- `weightedContributions` (final weighted value of each component)

These fields allow reviewers to reproduce each sub-step without re-running code.

## Data Quality and Compatibility Rules

- Maturity values stored as `1..5` are normalized to `0..100` using `(score-1)/4 × 100`.
- Numeric inputs are clamped to valid bounds before scoring.
- The final score is always constrained to `0..100` for cross-report comparability.

## Change Control

- Formula version: `v2` (replaces v1)
- Key changes from v1:
  - Replaced penalty/bonus bolt-on model with pure weighted-component average
  - Fixed risk double-counting (critical risks were penalized in both critical ratio and open ratio)
  - Added in-progress risk partial credit
  - Fixed maturity normalization (1→0 instead of 1→20)
  - Added neutral defaults (50) for missing data instead of 0
  - Merged efficiency bonus and SLA penalty into single Operational component
  - All components now scored 0–100 on equal footing
- Recommendation: keep formula version attached to each report for future recalibration audits.
