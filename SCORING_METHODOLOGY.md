# Scoring Methodology (Version v1)

## Purpose
This document explains exactly how the global security score is computed, including intermediate values, caps, and standard-alignment boundaries.

## Final Equation

```text
Score = clamp(
  round((0.40*Compliance + 0.35*AvgMaturity + 0.25*AvgAssetProtection)
    - RiskPenalty
    + EfficiencyBonus
    - SlaPenalty),
  0,
  100
)
```

## Component Equations (Exact Runtime Logic)

### 1) Governance Base

```text
GovernanceBase =
  (0.40 * Compliance)
  + (0.35 * AvgMaturity)
  + (0.25 * AvgAssetProtection)
```

Where:
- `Compliance` is clamped to `0..100`
- `AvgMaturity` is clamped to `0..100` after legacy normalization (`1..5` -> `20..100`)
- `AvgAssetProtection` is clamped to `0..100`

### 2) Risk Penalty

```text
criticalThreshold = 15
criticalRisks = count(probability * impact >= 15)
openRisks = count(status != "closed")
denominator = max(totalRisks, 1)

RiskPenaltyBeforeCap =
  ((criticalRisks / denominator) * 30)
  + ((openRisks / denominator) * 10)

RiskPenalty = min(40, RiskPenaltyBeforeCap)
```

### 3) Efficiency Bonus

Each KPI is normalized to `0..100`:

```text
if lowerBetter:
  normalized = (actual == 0) ? 100 : clamp((target / actual) * 100, 0, 100)
else:
  normalized = clamp((actual / target) * 100, 0, 100)
```

Then:

```text
AvgEfficiencyAchievement = average(normalizedKpis)
EfficiencyBonusBeforeCap = AvgEfficiencyAchievement * 0.10
EfficiencyBonus = min(10, EfficiencyBonusBeforeCap)
```

### 4) SLA Penalty

```text
target = providedTarget if valid else 24
target = max(target, 1)

deltaOverTarget = max(0, MTTC - target)
overflowRatio = deltaOverTarget / target
SlaPenaltyBeforeCap = overflowRatio * 15

SlaPenalty = (MTTC <= target) ? 0 : min(15, SlaPenaltyBeforeCap)
```

### 5) Final Score Bounds

```text
RawScore = GovernanceBase - RiskPenalty + EfficiencyBonus - SlaPenalty
FinalScore = clamp(round(RawScore), 0, 100)
```

## Standards-to-Implementation Mapping

| Standard | What it supports | Where used in model |
| --- | --- | --- |
| NIST SP 800-30 Rev.1 | Likelihood-impact risk assessment and risk treatment prioritization | `probability * impact` criticality logic and risk concentration penalties |
| NIST CSF 2.0 | Governance-driven measurable cyber risk management | Governance base construction and KPI-based comparability |
| ISO/IEC 27001:2022 | Risk-based ISMS and control effectiveness monitoring | Compliance, maturity, and asset-protection governance inputs |
| FIRST CVSS v4.0 | Structured severity communication and transparent scoring rationale | Severity-minded treatment of high-risk conditions (principle alignment, not direct CVSS math) |

Sources:
- NIST SP 800-30 Rev.1: https://doi.org/10.6028/NIST.SP.800-30r1
- NIST CSF 2.0: https://doi.org/10.6028/NIST.CSWP.29
- FIRST CVSS v4.0: https://www.first.org/cvss/v4.0/specification-document
- ISO/IEC 27001:2022: https://www.iso.org/standard/27001

## Calibration Boundary (Critical Governance Note)
The standards above justify the method family (risk-based, measurable, transparent scoring). They do not prescribe this exact equation or these exact coefficients.

Internal calibration choices in v1:
- Governance weights: `0.40 / 0.35 / 0.25`
- Caps: Risk `40`, Efficiency `10`, SLA `15`
- Critical-risk threshold: `probability * impact >= 15`

These values should be approved and periodically reviewed by security governance (for example, CISO and Risk Committee).

## Audit Fields Available Per Report
The score response includes these auditable objects for traceability:
- `governanceDetails`
- `riskPenaltyDetails`
- `efficiencyBonusDetails` (including per-KPI normalization records)
- `slaPenaltyDetails`

These fields allow reviewers to reproduce each sub-step without re-running code.

## Data Quality and Compatibility Rules
- Legacy maturity values stored as `1..5` are automatically normalized to `20..100`.
- Numeric inputs are clamped to valid bounds before scoring.
- The final score is always constrained to `0..100` for cross-report comparability.

## Change Control
- Formula version: `v1`
- Recommendation: keep formula version and methodology version attached to each report for future recalibration audits.
