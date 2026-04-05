import type { ClauseData, ControlData } from "@/types/isms";

type DocumentRegisterItem = {
  ref: string;
  title: string;
  clause: string;
};

type RoadmapPhase = {
  id: number;
  title: string;
  weeks: string;
  status: "done" | "active" | "pending";
  items: string[];
};

type DailyChecklistGroup = {
  category: string;
  items: Array<{ id: string; label: string }>;
};

export const ISO_CLAUSES: ClauseData[] = [
  {
    "id": "4",
    "title": "Context of the Organisation",
    "requirements": [
      {
        "id": "4.1",
        "title": "Understanding the organisation and its context",
        "description": "Determine external and internal issues relevant to the organisation's purpose that affect the ISMS.",
        "guidance": "Use PESTLE/SWOT. Document legal, regulatory, technological, competitive and cultural issues affecting information security. This forms the ISMS foundation. Brief your board on the key business drivers for information security — regulators, customers, contracts."
      },
      {
        "id": "4.2",
        "title": "Understanding needs and expectations of interested parties",
        "description": "Identify interested parties relevant to the ISMS and their requirements.",
        "guidance": "Customers, regulators, suppliers, employees, shareholders. Map to legal, contractual and regulatory obligations. Map every regulator who can audit you to specific controls. This becomes your compliance argument in the boardroom."
      },
      {
        "id": "4.3",
        "title": "Determining the scope of the ISMS",
        "description": "Determine the boundaries and applicability of the ISMS.",
        "guidance": "Scope must consider context, interested party requirements, interfaces and dependencies. Be precise — auditors test boundaries. Too broad = impossible to certify on time. Too narrow = not credible. Include all systems handling your most sensitive data."
      },
      {
        "id": "4.4",
        "title": "Information security management system",
        "description": "Establish, implement, maintain and continually improve an ISMS.",
        "guidance": "Top-level requirement. All other clauses feed into this. The ISMS must be a living, operational system — not just documentation. Auditors check that your ISMS is OPERATIONAL, not just documented. Meeting minutes, logs, review records are your evidence."
      }
    ]
  },
  {
    "id": "5",
    "title": "Leadership",
    "requirements": [
      {
        "id": "5.1",
        "title": "Leadership and commitment",
        "description": "Top management shall demonstrate leadership and commitment to the ISMS.",
        "guidance": "Allocate resources, set direction, promote improvement, integrate ISMS into business processes, direct and support. CRITICAL: Without genuine CEO/board commitment, certification will fail. Get written endorsement AND budget sign-off BEFORE starting."
      },
      {
        "id": "5.2",
        "title": "Information security policy",
        "description": "Top management shall establish an information security policy.",
        "guidance": "Policy must include IS objectives, commitment to requirements and continual improvement. Must be communicated and available. One page is better than ten. The signature must be CEO/MD. Auditors check the signatory level. Keep it principles-based."
      },
      {
        "id": "5.3",
        "title": "Organisational roles, responsibilities and authorities",
        "description": "Top management shall assign and communicate ISMS roles and responsibilities.",
        "guidance": "Who is responsible for ISMS? Who manages controls? Who reports performance? RACI matrix recommended. Your RACI is exhibit A in every audit. Every finding traces back to role clarity. Update it whenever the organisation changes."
      }
    ]
  },
  {
    "id": "6",
    "title": "Planning",
    "requirements": [
      {
        "id": "6.1.1",
        "title": "General – actions to address risks and opportunities",
        "description": "Determine risks and opportunities to ensure the ISMS achieves intended outcomes.",
        "guidance": "Systematic approach. Document risks and opportunities register. Drives the planning process."
      },
      {
        "id": "6.1.2",
        "title": "Information security risk assessment",
        "description": "Define and apply an information security risk assessment process.",
        "guidance": "Methodology FIRST — document it before doing assessments. Likelihood × Impact (1–5 scale) is auditor-friendly. Results must be consistent and reproducible. Auditors review the methodology before the results. Weak methodology = audit finding before they even look at your risks."
      },
      {
        "id": "6.1.3",
        "title": "Information security risk treatment",
        "description": "Define and apply an information security risk treatment process.",
        "guidance": "Select treatment options (mitigate/accept/transfer/avoid), determine controls, compare with Annex A, produce SoA and treatment plan. The SoA is arguably the most important certification document — it connects your risks to Annex A. Align with your CB before finalising."
      },
      {
        "id": "6.2",
        "title": "Information security objectives and planning",
        "description": "Establish IS objectives at relevant functions and levels.",
        "guidance": "SMART objectives. Consistent with policy, measurable, communicated, monitored, updated. Plans must include what/resources/responsibility/timeline. Tie these to your KPI Metrics page. These are what you present at management reviews — they demonstrate the ISMS is working."
      },
      {
        "id": "6.3",
        "title": "Planning of changes",
        "description": "Carry out changes to the ISMS in a planned manner.",
        "guidance": "When changes are needed: consider purpose, consequences, integrity and resources. No ad-hoc ISMS changes. NEW in 2022. NEW in 2022. Shows auditors your ISMS adapts in a controlled way. Link to your existing change management process."
      }
    ]
  },
  {
    "id": "7",
    "title": "Support",
    "requirements": [
      {
        "id": "7.1",
        "title": "Resources",
        "description": "Provide resources for ISMS establishment and operation.",
        "guidance": "Budget, people, technology, tools. Document management approval. Retain records. The board-approved budget IS your evidence for this clause. Keep the approval records carefully."
      },
      {
        "id": "7.2",
        "title": "Competence",
        "description": "Determine and ensure competence of persons affecting IS performance.",
        "guidance": "Education, training or experience. Take action where gaps exist. Retain evidence. A simple skills matrix with evidence of certifications/training covers this well."
      },
      {
        "id": "7.3",
        "title": "Awareness",
        "description": "Persons shall be aware of the IS policy, their contribution and implications of non-compliance.",
        "guidance": "Annual training, phishing simulations, policy acknowledgement, onboarding. Track completion rates. Completion rates are your evidence. 95%+ is the target. Report these at every management review."
      },
      {
        "id": "7.4",
        "title": "Communication",
        "description": "Determine internal and external IS communications.",
        "guidance": "Who communicates what, to whom, when and how. Define escalation procedures for security events."
      },
      {
        "id": "7.5.1",
        "title": "Documented information – General",
        "description": "ISMS shall include required documented information.",
        "guidance": "Balance adequacy with practical overhead. Quality over quantity."
      },
      {
        "id": "7.5.2",
        "title": "Creating and updating documented information",
        "description": "Ensure appropriate identification, format, review and approval.",
        "guidance": "Version control, naming convention, review cycle, approval authority documented. Every document needs: version number, review date, approval signature at the right authority level."
      },
      {
        "id": "7.5.3",
        "title": "Control of documented information",
        "description": "Documented information shall be controlled.",
        "guidance": "Distribution, access, storage, preservation, change, retention, disposal."
      }
    ]
  },
  {
    "id": "8",
    "title": "Operation",
    "requirements": [
      {
        "id": "8.1",
        "title": "Operational planning and control",
        "description": "Plan, implement and control processes to meet IS requirements.",
        "guidance": "Operational processes must meet security requirements. Control outsourced processes."
      },
      {
        "id": "8.2",
        "title": "IS risk assessment (operational)",
        "description": "Perform IS risk assessments at planned intervals or upon significant changes.",
        "guidance": "Trigger assessments on system changes, new projects, threat changes, or scheduled intervals. Show auditors risk assessments happen in response to changes — this demonstrates a mature, living process."
      },
      {
        "id": "8.3",
        "title": "IS risk treatment (operational)",
        "description": "Implement the IS risk treatment plan.",
        "guidance": "All treatment actions implemented, documented and evidenced."
      }
    ]
  },
  {
    "id": "9",
    "title": "Performance Evaluation",
    "requirements": [
      {
        "id": "9.1",
        "title": "Monitoring, measurement, analysis and evaluation",
        "description": "Determine what to monitor and measure, methods and who analyses.",
        "guidance": "Define KPIs. Document who monitors, when, how results are analysed. Retain evidence. Your KPI dashboard IS this evidence. Present it at every management review. Track trends not just point-in-time values."
      },
      {
        "id": "9.2",
        "title": "Internal audit",
        "description": "Conduct internal audits at planned intervals.",
        "guidance": "Programme considers process importance and previous results. Auditors must be objective. Results reported to management. MANDATORY: You must complete at least ONE full internal audit cycle before Stage 2 CB audit. Plan 3 months ahead. Use objective auditors."
      },
      {
        "id": "9.3",
        "title": "Management review",
        "description": "Top management shall review the ISMS at planned intervals.",
        "guidance": "Must include: previous actions, context changes, IS performance, NCA status, audit results, objectives, improvement opportunities. Quarterly mini-reviews + comprehensive annual review. Your Board Report page is designed as the management review input document."
      }
    ]
  },
  {
    "id": "10",
    "title": "Improvement",
    "requirements": [
      {
        "id": "10.1",
        "title": "Continual improvement",
        "description": "Continually improve the suitability, adequacy and effectiveness of the ISMS.",
        "guidance": "PDCA cycle in operation. Improvements flow from audits, incidents, management reviews, risk assessments. Document improvements made. Show the PDCA cycle is real. Auditors love seeing how you learn from incidents and audits."
      },
      {
        "id": "10.2",
        "title": "Nonconformity and corrective action",
        "description": "React to nonconformities, evaluate cause and implement corrective actions.",
        "guidance": "Process: detect → contain → root cause → CA → effectiveness review → close. Retain all records. A closed NCA with good root cause analysis demonstrates ISMS maturity. Auditors prefer organisations that find and fix their own problems."
      }
    ]
  }
];

export const ANNEX_A_CONTROLS: ControlData[] = [
  {
    "id": "5.1",
    "theme": "5",
    "title": "Policies for information security",
    "description": "Policies for information security",
    "type": "Preventive"
  },
  {
    "id": "5.2",
    "theme": "5",
    "title": "Information security roles and responsibilities",
    "description": "Information security roles and responsibilities",
    "type": "Preventive"
  },
  {
    "id": "5.3",
    "theme": "5",
    "title": "Segregation of duties",
    "description": "Segregation of duties",
    "type": "Preventive"
  },
  {
    "id": "5.4",
    "theme": "5",
    "title": "Management responsibilities",
    "description": "Management responsibilities",
    "type": "Preventive"
  },
  {
    "id": "5.5",
    "theme": "5",
    "title": "Contact with authorities",
    "description": "Contact with authorities",
    "type": "Preventive"
  },
  {
    "id": "5.6",
    "theme": "5",
    "title": "Contact with special interest groups",
    "description": "Contact with special interest groups",
    "type": "Preventive"
  },
  {
    "id": "5.7",
    "theme": "5",
    "title": "Threat intelligence",
    "description": "Threat intelligence",
    "type": "Detective"
  },
  {
    "id": "5.8",
    "theme": "5",
    "title": "Information security in project management",
    "description": "Information security in project management",
    "type": "Preventive"
  },
  {
    "id": "5.9",
    "theme": "5",
    "title": "Inventory of information and other associated assets",
    "description": "Inventory of information and other associated assets",
    "type": "Preventive"
  },
  {
    "id": "5.10",
    "theme": "5",
    "title": "Acceptable use of information and other assets",
    "description": "Acceptable use of information and other assets",
    "type": "Preventive"
  },
  {
    "id": "5.11",
    "theme": "5",
    "title": "Return of assets",
    "description": "Return of assets",
    "type": "Preventive"
  },
  {
    "id": "5.12",
    "theme": "5",
    "title": "Classification of information",
    "description": "Classification of information",
    "type": "Preventive"
  },
  {
    "id": "5.13",
    "theme": "5",
    "title": "Labelling of information",
    "description": "Labelling of information",
    "type": "Preventive"
  },
  {
    "id": "5.14",
    "theme": "5",
    "title": "Information transfer",
    "description": "Information transfer",
    "type": "Preventive"
  },
  {
    "id": "5.15",
    "theme": "5",
    "title": "Access control",
    "description": "Access control",
    "type": "Preventive"
  },
  {
    "id": "5.16",
    "theme": "5",
    "title": "Identity management",
    "description": "Identity management",
    "type": "Preventive"
  },
  {
    "id": "5.17",
    "theme": "5",
    "title": "Authentication information",
    "description": "Authentication information",
    "type": "Preventive"
  },
  {
    "id": "5.18",
    "theme": "5",
    "title": "Access rights",
    "description": "Access rights",
    "type": "Preventive"
  },
  {
    "id": "5.19",
    "theme": "5",
    "title": "Information security in supplier relationships",
    "description": "Information security in supplier relationships",
    "type": "Preventive"
  },
  {
    "id": "5.20",
    "theme": "5",
    "title": "Addressing IS within supplier agreements",
    "description": "Addressing IS within supplier agreements",
    "type": "Preventive"
  },
  {
    "id": "5.21",
    "theme": "5",
    "title": "Managing IS in the ICT supply chain",
    "description": "Managing IS in the ICT supply chain",
    "type": "Preventive"
  },
  {
    "id": "5.22",
    "theme": "5",
    "title": "Monitoring, review and change management of supplier services",
    "description": "Monitoring, review and change management of supplier services",
    "type": "Detective"
  },
  {
    "id": "5.23",
    "theme": "5",
    "title": "Information security for use of cloud services",
    "description": "Information security for use of cloud services",
    "type": "Preventive"
  },
  {
    "id": "5.24",
    "theme": "5",
    "title": "IS incident management planning and preparation",
    "description": "IS incident management planning and preparation",
    "type": "Corrective"
  },
  {
    "id": "5.25",
    "theme": "5",
    "title": "Assessment and decision on IS events",
    "description": "Assessment and decision on IS events",
    "type": "Detective"
  },
  {
    "id": "5.26",
    "theme": "5",
    "title": "Response to information security incidents",
    "description": "Response to information security incidents",
    "type": "Corrective"
  },
  {
    "id": "5.27",
    "theme": "5",
    "title": "Learning from information security incidents",
    "description": "Learning from information security incidents",
    "type": "Corrective"
  },
  {
    "id": "5.28",
    "theme": "5",
    "title": "Collection of evidence",
    "description": "Collection of evidence",
    "type": "Detective"
  },
  {
    "id": "5.29",
    "theme": "5",
    "title": "Information security during disruption",
    "description": "Information security during disruption",
    "type": "Preventive"
  },
  {
    "id": "5.30",
    "theme": "5",
    "title": "ICT readiness for business continuity",
    "description": "ICT readiness for business continuity",
    "type": "Preventive"
  },
  {
    "id": "5.31",
    "theme": "5",
    "title": "Legal, statutory, regulatory and contractual requirements",
    "description": "Legal, statutory, regulatory and contractual requirements",
    "type": "Preventive"
  },
  {
    "id": "5.32",
    "theme": "5",
    "title": "Intellectual property rights",
    "description": "Intellectual property rights",
    "type": "Preventive"
  },
  {
    "id": "5.33",
    "theme": "5",
    "title": "Protection of records",
    "description": "Protection of records",
    "type": "Preventive"
  },
  {
    "id": "5.34",
    "theme": "5",
    "title": "Privacy and protection of PII",
    "description": "Privacy and protection of PII",
    "type": "Preventive"
  },
  {
    "id": "5.35",
    "theme": "5",
    "title": "Independent review of information security",
    "description": "Independent review of information security",
    "type": "Detective"
  },
  {
    "id": "5.36",
    "theme": "5",
    "title": "Compliance with IS policies, rules and standards",
    "description": "Compliance with IS policies, rules and standards",
    "type": "Detective"
  },
  {
    "id": "5.37",
    "theme": "5",
    "title": "Documented operating procedures",
    "description": "Documented operating procedures",
    "type": "Preventive"
  },
  {
    "id": "6.1",
    "theme": "6",
    "title": "Screening",
    "description": "Screening",
    "type": "Preventive"
  },
  {
    "id": "6.2",
    "theme": "6",
    "title": "Terms and conditions of employment",
    "description": "Terms and conditions of employment",
    "type": "Preventive"
  },
  {
    "id": "6.3",
    "theme": "6",
    "title": "IS awareness, education and training",
    "description": "IS awareness, education and training",
    "type": "Preventive"
  },
  {
    "id": "6.4",
    "theme": "6",
    "title": "Disciplinary process",
    "description": "Disciplinary process",
    "type": "Corrective"
  },
  {
    "id": "6.5",
    "theme": "6",
    "title": "Responsibilities after termination or change of employment",
    "description": "Responsibilities after termination or change of employment",
    "type": "Preventive"
  },
  {
    "id": "6.6",
    "theme": "6",
    "title": "Confidentiality or non-disclosure agreements",
    "description": "Confidentiality or non-disclosure agreements",
    "type": "Preventive"
  },
  {
    "id": "6.7",
    "theme": "6",
    "title": "Remote working",
    "description": "Remote working",
    "type": "Preventive"
  },
  {
    "id": "6.8",
    "theme": "6",
    "title": "IS event reporting",
    "description": "IS event reporting",
    "type": "Detective"
  },
  {
    "id": "7.1",
    "theme": "7",
    "title": "Physical security perimeters",
    "description": "Physical security perimeters",
    "type": "Preventive"
  },
  {
    "id": "7.2",
    "theme": "7",
    "title": "Physical entry",
    "description": "Physical entry",
    "type": "Preventive"
  },
  {
    "id": "7.3",
    "theme": "7",
    "title": "Securing offices, rooms and facilities",
    "description": "Securing offices, rooms and facilities",
    "type": "Preventive"
  },
  {
    "id": "7.4",
    "theme": "7",
    "title": "Physical security monitoring",
    "description": "Physical security monitoring",
    "type": "Detective"
  },
  {
    "id": "7.5",
    "theme": "7",
    "title": "Protecting against physical and environmental threats",
    "description": "Protecting against physical and environmental threats",
    "type": "Preventive"
  },
  {
    "id": "7.6",
    "theme": "7",
    "title": "Working in secure areas",
    "description": "Working in secure areas",
    "type": "Preventive"
  },
  {
    "id": "7.7",
    "theme": "7",
    "title": "Clear desk and clear screen",
    "description": "Clear desk and clear screen",
    "type": "Preventive"
  },
  {
    "id": "7.8",
    "theme": "7",
    "title": "Equipment siting and protection",
    "description": "Equipment siting and protection",
    "type": "Preventive"
  },
  {
    "id": "7.9",
    "theme": "7",
    "title": "Security of assets off-premises",
    "description": "Security of assets off-premises",
    "type": "Preventive"
  },
  {
    "id": "7.10",
    "theme": "7",
    "title": "Storage media",
    "description": "Storage media",
    "type": "Preventive"
  },
  {
    "id": "7.11",
    "theme": "7",
    "title": "Supporting utilities",
    "description": "Supporting utilities",
    "type": "Preventive"
  },
  {
    "id": "7.12",
    "theme": "7",
    "title": "Cabling security",
    "description": "Cabling security",
    "type": "Preventive"
  },
  {
    "id": "7.13",
    "theme": "7",
    "title": "Equipment maintenance",
    "description": "Equipment maintenance",
    "type": "Preventive"
  },
  {
    "id": "7.14",
    "theme": "7",
    "title": "Secure disposal or re-use of equipment",
    "description": "Secure disposal or re-use of equipment",
    "type": "Preventive"
  },
  {
    "id": "8.1",
    "theme": "8",
    "title": "User endpoint devices",
    "description": "User endpoint devices",
    "type": "Preventive"
  },
  {
    "id": "8.2",
    "theme": "8",
    "title": "Privileged access rights",
    "description": "Privileged access rights",
    "type": "Preventive"
  },
  {
    "id": "8.3",
    "theme": "8",
    "title": "Information access restriction",
    "description": "Information access restriction",
    "type": "Preventive"
  },
  {
    "id": "8.4",
    "theme": "8",
    "title": "Access to source code",
    "description": "Access to source code",
    "type": "Preventive"
  },
  {
    "id": "8.5",
    "theme": "8",
    "title": "Secure authentication",
    "description": "Secure authentication",
    "type": "Preventive"
  },
  {
    "id": "8.6",
    "theme": "8",
    "title": "Capacity management",
    "description": "Capacity management",
    "type": "Preventive"
  },
  {
    "id": "8.7",
    "theme": "8",
    "title": "Protection against malware",
    "description": "Protection against malware",
    "type": "Preventive"
  },
  {
    "id": "8.8",
    "theme": "8",
    "title": "Management of technical vulnerabilities",
    "description": "Management of technical vulnerabilities",
    "type": "Preventive"
  },
  {
    "id": "8.9",
    "theme": "8",
    "title": "Configuration management",
    "description": "Configuration management",
    "type": "Preventive"
  },
  {
    "id": "8.10",
    "theme": "8",
    "title": "Information deletion",
    "description": "Information deletion",
    "type": "Preventive"
  },
  {
    "id": "8.11",
    "theme": "8",
    "title": "Data masking",
    "description": "Data masking",
    "type": "Preventive"
  },
  {
    "id": "8.12",
    "theme": "8",
    "title": "Data leakage prevention",
    "description": "Data leakage prevention",
    "type": "Preventive"
  },
  {
    "id": "8.13",
    "theme": "8",
    "title": "Information backup",
    "description": "Information backup",
    "type": "Corrective"
  },
  {
    "id": "8.14",
    "theme": "8",
    "title": "Redundancy of information processing facilities",
    "description": "Redundancy of information processing facilities",
    "type": "Preventive"
  },
  {
    "id": "8.15",
    "theme": "8",
    "title": "Logging",
    "description": "Logging",
    "type": "Detective"
  },
  {
    "id": "8.16",
    "theme": "8",
    "title": "Monitoring activities",
    "description": "Monitoring activities",
    "type": "Detective"
  },
  {
    "id": "8.17",
    "theme": "8",
    "title": "Clock synchronisation",
    "description": "Clock synchronisation",
    "type": "Detective"
  },
  {
    "id": "8.18",
    "theme": "8",
    "title": "Use of privileged utility programs",
    "description": "Use of privileged utility programs",
    "type": "Preventive"
  },
  {
    "id": "8.19",
    "theme": "8",
    "title": "Installation of software on operational systems",
    "description": "Installation of software on operational systems",
    "type": "Preventive"
  },
  {
    "id": "8.20",
    "theme": "8",
    "title": "Networks security",
    "description": "Networks security",
    "type": "Preventive"
  },
  {
    "id": "8.21",
    "theme": "8",
    "title": "Security of network services",
    "description": "Security of network services",
    "type": "Preventive"
  },
  {
    "id": "8.22",
    "theme": "8",
    "title": "Segregation of networks",
    "description": "Segregation of networks",
    "type": "Preventive"
  },
  {
    "id": "8.23",
    "theme": "8",
    "title": "Web filtering",
    "description": "Web filtering",
    "type": "Preventive"
  },
  {
    "id": "8.24",
    "theme": "8",
    "title": "Use of cryptography",
    "description": "Use of cryptography",
    "type": "Preventive"
  },
  {
    "id": "8.25",
    "theme": "8",
    "title": "Secure development life cycle",
    "description": "Secure development life cycle",
    "type": "Preventive"
  },
  {
    "id": "8.26",
    "theme": "8",
    "title": "Application security requirements",
    "description": "Application security requirements",
    "type": "Preventive"
  },
  {
    "id": "8.27",
    "theme": "8",
    "title": "Secure system architecture and engineering principles",
    "description": "Secure system architecture and engineering principles",
    "type": "Preventive"
  },
  {
    "id": "8.28",
    "theme": "8",
    "title": "Secure coding",
    "description": "Secure coding",
    "type": "Preventive"
  },
  {
    "id": "8.29",
    "theme": "8",
    "title": "Security testing in development and acceptance",
    "description": "Security testing in development and acceptance",
    "type": "Detective"
  },
  {
    "id": "8.30",
    "theme": "8",
    "title": "Outsourced development",
    "description": "Outsourced development",
    "type": "Preventive"
  },
  {
    "id": "8.31",
    "theme": "8",
    "title": "Separation of development, test and production",
    "description": "Separation of development, test and production",
    "type": "Preventive"
  },
  {
    "id": "8.32",
    "theme": "8",
    "title": "Change management",
    "description": "Change management",
    "type": "Preventive"
  },
  {
    "id": "8.33",
    "theme": "8",
    "title": "Test information",
    "description": "Test information",
    "type": "Preventive"
  },
  {
    "id": "8.34",
    "theme": "8",
    "title": "Protection of IS during audit testing",
    "description": "Protection of IS during audit testing",
    "type": "Preventive"
  }
];

export const MANDATORY_DOCUMENTS: DocumentRegisterItem[] = [
  {
    "ref": "IS-DOC-001",
    "title": "ISMS Scope",
    "clause": "Clause 4.3"
  },
  {
    "ref": "IS-DOC-002",
    "title": "Information Security Policy",
    "clause": "Clause 5.2"
  },
  {
    "ref": "IS-DOC-003",
    "title": "Risk Assessment Methodology",
    "clause": "Clause 6.1.2"
  },
  {
    "ref": "IS-DOC-004",
    "title": "Risk Assessment Results",
    "clause": "Clause 6.1.2"
  },
  {
    "ref": "IS-DOC-005",
    "title": "Risk Treatment Plan",
    "clause": "Clause 6.1.3"
  },
  {
    "ref": "IS-DOC-006",
    "title": "Statement of Applicability",
    "clause": "Clause 6.1.3"
  },
  {
    "ref": "IS-DOC-007",
    "title": "Information Security Objectives",
    "clause": "Clause 6.2"
  },
  {
    "ref": "IS-DOC-008",
    "title": "Competence Records",
    "clause": "Clause 7.2"
  },
  {
    "ref": "IS-DOC-009",
    "title": "Awareness Programme Evidence",
    "clause": "Clause 7.3"
  },
  {
    "ref": "IS-DOC-010",
    "title": "Monitoring & Measurement Results",
    "clause": "Clause 9.1"
  },
  {
    "ref": "IS-DOC-011",
    "title": "Internal Audit Programme",
    "clause": "Clause 9.2"
  },
  {
    "ref": "IS-DOC-012",
    "title": "Internal Audit Reports",
    "clause": "Clause 9.2"
  },
  {
    "ref": "IS-DOC-013",
    "title": "Management Review Minutes",
    "clause": "Clause 9.3"
  },
  {
    "ref": "IS-DOC-014",
    "title": "Nonconformity & Corrective Action Records",
    "clause": "Clause 10.2"
  }
];

export const SUPPORTING_DOCUMENTS: DocumentRegisterItem[] = [
  {
    "ref": "IS-DOC-015",
    "title": "Asset Register",
    "clause": "A.5.9"
  },
  {
    "ref": "IS-DOC-016",
    "title": "Acceptable Use Policy",
    "clause": "A.5.10"
  },
  {
    "ref": "IS-DOC-017",
    "title": "Access Control Procedure",
    "clause": "A.5.15"
  },
  {
    "ref": "IS-DOC-018",
    "title": "Supplier Security Policy",
    "clause": "A.5.19"
  },
  {
    "ref": "IS-DOC-019",
    "title": "Incident Response Procedure",
    "clause": "A.5.24"
  },
  {
    "ref": "IS-DOC-020",
    "title": "Business Continuity Plan",
    "clause": "A.5.29"
  },
  {
    "ref": "IS-DOC-021",
    "title": "Legal & Regulatory Register",
    "clause": "A.5.31"
  },
  {
    "ref": "IS-DOC-022",
    "title": "HR Security Policy",
    "clause": "A.6.1"
  },
  {
    "ref": "IS-DOC-023",
    "title": "Remote Working Policy",
    "clause": "A.6.7"
  },
  {
    "ref": "IS-DOC-024",
    "title": "Physical Security Policy",
    "clause": "A.7.1"
  },
  {
    "ref": "IS-DOC-025",
    "title": "Backup & Recovery Procedure",
    "clause": "A.8.13"
  },
  {
    "ref": "IS-DOC-026",
    "title": "Change Management Procedure",
    "clause": "A.8.32"
  },
  {
    "ref": "IS-DOC-027",
    "title": "RACI Matrix",
    "clause": "Clause 5.3"
  }
];

export const POLICY_DOCUMENTS: DocumentRegisterItem[] = [
  {
    "ref": "IS-POL-001",
    "title": "Information Classification Policy",
    "clause": "A.5.12"
  },
  {
    "ref": "IS-POL-002",
    "title": "Cryptography Policy",
    "clause": "A.8.24"
  },
  {
    "ref": "IS-POL-003",
    "title": "Password / Authentication Policy",
    "clause": "A.8.5"
  },
  {
    "ref": "IS-POL-004",
    "title": "Network Security Policy",
    "clause": "A.8.20"
  },
  {
    "ref": "IS-POL-005",
    "title": "Vulnerability Management Policy",
    "clause": "A.8.8"
  },
  {
    "ref": "IS-POL-006",
    "title": "Data Retention & Disposal Policy",
    "clause": "A.5.33"
  },
  {
    "ref": "IS-POL-007",
    "title": "Secure Development Policy",
    "clause": "A.8.25"
  },
  {
    "ref": "IS-POL-008",
    "title": "Privacy & PII Policy",
    "clause": "A.5.34"
  },
  {
    "ref": "IS-POL-009",
    "title": "Supplier Management Policy",
    "clause": "A.5.19"
  },
  {
    "ref": "IS-POL-010",
    "title": "Cloud Security Policy",
    "clause": "A.5.23"
  }
];

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    "id": 1,
    "title": "Initiation & Scoping",
    "weeks": "Weeks 1–4",
    "status": "done",
    "items": [
      "Secure top management commitment — written mandate & budget",
      "Define ISMS scope precisely — all critical systems & processes",
      "Appoint ISMS Manager / CISO and build implementation team",
      "Select certification body and align on their audit approach",
      "Establish project plan, RACI matrix and communication schedule",
      "Conduct baseline gap analysis against ISO 27001:2022",
      "Register ISMS project as business initiative with board"
    ]
  },
  {
    "id": 2,
    "title": "Context & Leadership",
    "weeks": "Weeks 3–8",
    "status": "done",
    "items": [
      "Complete context analysis — PESTLE/SWOT (Clause 4.1)",
      "Map all interested parties and their IS requirements (Clause 4.2)",
      "Draft and obtain CEO/MD sign-off on IS Policy (Clause 5.2)",
      "Define and publish RACI matrix for all ISMS roles (Clause 5.3)",
      "Establish IS objectives and link to KPI measurement framework",
      "Complete communication plan and change management procedure",
      "Deliver leadership awareness briefing to executive team"
    ]
  },
  {
    "id": 3,
    "title": "Risk Assessment & SoA",
    "weeks": "Weeks 6–14",
    "status": "active",
    "items": [
      "Document risk assessment methodology before assessments (Cl 6.1.2)",
      "Complete asset inventory for all in-scope assets (A.5.9)",
      "Identify all information security threats and vulnerabilities",
      "Assess and score all risks — Likelihood × Impact matrix",
      "Determine treatment options for each identified risk",
      "Draft SoA covering all 93 Annex A controls (Clause 6.1.3)",
      "Complete Risk Treatment Plan with owners, dates & control mapping"
    ]
  },
  {
    "id": 4,
    "title": "Controls Implementation",
    "weeks": "Weeks 10–28",
    "status": "pending",
    "items": [
      "Implement all applicable Annex A controls (track via SoA)",
      "Create and approve all mandatory policies and procedures",
      "Deploy technical controls: MFA, EDR, DLP, SIEM, encryption",
      "Establish supplier security programme (A.5.19–5.23)",
      "Launch security awareness training programme (A.6.3)",
      "Implement incident management process and test it",
      "Complete all 14 mandatory documents (IS-DOC-001 to IS-DOC-014)"
    ]
  },
  {
    "id": 5,
    "title": "Internal Audit & Review",
    "weeks": "Weeks 26–36",
    "status": "pending",
    "items": [
      "Plan and execute full internal audit programme (Clause 9.2)",
      "Record all findings, observations and nonconformities",
      "Implement corrective actions for ALL NCAs before Stage 1 CB",
      "Conduct comprehensive management review meeting (Clause 9.3)",
      "Update all ISMS documentation based on audit findings",
      "Verify evidence is complete and properly referenced",
      "Document ISMS effectiveness review and improvement actions"
    ]
  },
  {
    "id": 6,
    "title": "Certification",
    "weeks": "Weeks 34–44",
    "status": "pending",
    "items": [
      "Stage 1: CB documentation review — all 14 mandatory docs ready",
      "Address all Stage 1 NCAs within agreed correction timeframe",
      "Stage 2: On-site implementation audit — evidence ready per control",
      "Respond to all CB findings within agreed correction period",
      "Receive ISO 27001:2022 certification decision",
      "Plan surveillance audits (Year 1, 2) and recertification (Year 3)",
      "Embed ISMS as business-as-usual — post-certification mode"
    ]
  }
];

export const DAILY_CHECKLIST: DailyChecklistGroup[] = [
  {
    "category": "Morning Security Operations",
    "items": [
      {
        "id": "d1",
        "label": "Review overnight security alerts"
      },
      {
        "id": "d2",
        "label": "Check open critical & high incidents"
      },
      {
        "id": "d3",
        "label": "Review vulnerability and patching status"
      },
      {
        "id": "d4",
        "label": "Monitor privileged access changes"
      },
      {
        "id": "d5",
        "label": "Confirm backup and BCM status"
      }
    ]
  },
  {
    "category": "Implementation Progress",
    "items": [
      {
        "id": "d6",
        "label": "Update task board status"
      },
      {
        "id": "d7",
        "label": "Team stand-up / check-in"
      },
      {
        "id": "d8",
        "label": "Document today's evidence collected"
      },
      {
        "id": "d9",
        "label": "Review clause/control milestones"
      },
      {
        "id": "d10",
        "label": "Supplier and third-party follow-ups"
      }
    ]
  },
  {
    "category": "Governance & Reporting",
    "items": [
      {
        "id": "d11",
        "label": "Update risk register if changes occurred"
      },
      {
        "id": "d12",
        "label": "Review upcoming audit activities"
      },
      {
        "id": "d13",
        "label": "Check awareness programme completion"
      },
      {
        "id": "d14",
        "label": "Management communications needed?"
      },
      {
        "id": "d15",
        "label": "Log today's key decisions below"
      }
    ]
  }
];

export const RISK_CATEGORIES = [
  "Cyber Threat",
  "Compliance",
  "Operational",
  "Physical",
  "Third Party",
  "Human Error",
  "Business Continuity",
  "Data Privacy",
  "Financial",
  "Reputational"
];

export const INCIDENT_CATEGORIES = [
  "Data Breach",
  "Malware",
  "Phishing",
  "Ransomware",
  "Unauthorised Access",
  "Insider Threat",
  "System Failure",
  "Physical Security",
  "Other"
];
