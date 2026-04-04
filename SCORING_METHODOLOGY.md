# Scoring Methodology (Version v1)

## Purpose
This document explains how the global security score is calculated, what standards informed the model, and which parts are organizational calibration choices.

## Final Equation

```
Score = clamp(
  round((0.40*Compliance + 0.35*AvgMaturity + 0.25*AvgAssetProtection)
    - RiskPenalty
    + EfficiencyBonus
    - SlaPenalty),
  0,
  100
)
```

## Inputs Used
- `Compliance`: ISO/KPI compliance percentage (0..100)
- `AvgMaturity`: average maturity score (0..100, legacy 1..5 auto-normalized)
- `AvgAssetProtection`: average protection level for critical assets (0..100)
- `RiskPenalty`: penalty from critical and open risk concentration (capped at 40)
- `EfficiencyBonus`: bonus from KPI achievement (capped at 10)
- `SlaPenalty`: penalty when MTTC exceeds target (capped at 15)

## Why These Components
- Governance base combines compliance, maturity, and asset protection to represent baseline control health.
- Risk penalty enforces risk-first prioritization and prevents high final scores when unresolved critical risks remain.
- Efficiency bonus rewards measurable operational performance.
- SLA penalty captures response discipline and resilience.

## Standards Mapping (Principle-Level)

### 1) NIST SP 800-30 Rev.1 (Risk Assessment)
- Supports likelihood/impact-based risk assessment and risk response.
- Source: https://doi.org/10.6028/NIST.SP.800-30r1

### 2) NIST CSF 2.0 (Enterprise Cyber Risk)
- Supports governance-centered, measurable cyber risk management and continuous improvement.
- Source: https://doi.org/10.6028/NIST.CSWP.29

### 3) FIRST CVSS v4.0 (Vulnerability Severity)
- Supports standardized vulnerability severity characterization and transparent scoring rationale.
- Source: https://www.first.org/cvss/v4.0/specification-document

### 4) ISO/IEC 27001:2022 (ISMS)
- Supports risk-aware ISMS and continuous control improvement.
- Source: https://www.iso.org/standard/27001

## Important Governance Note
The standards above support the method family (risk-based measurement and prioritization). They do **not** prescribe this exact single equation or fixed weights.

The current weights and caps are an internal calibration policy:
- Governance weights: 0.40 / 0.35 / 0.25
- Penalty/bonus caps: Risk 40, Efficiency 10, SLA 15

These values should be approved and reviewed periodically by security governance (e.g., CISO/Risk Committee).

## Data Quality / Compatibility Rules
- Maturity values on legacy 1..5 scale are automatically converted to 20..100.
- Numeric inputs are clamped to valid ranges.
- Final score is bounded to 0..100 for comparability.

## Change Control
- Current formula version: `v1`
- Recommended: track formula and methodology versions in reports to preserve auditability when future recalibration occurs.
