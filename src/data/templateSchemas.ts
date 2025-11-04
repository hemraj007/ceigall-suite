import { Template } from '@/lib/types/document-drafting';

export const templateSchemas: Template[] = [
  {
    id: "sof",
    title: "Statement of Facts (SoF)",
    category: "Dispute Resolution",
    description: "Detailed narration of case facts and supporting chronology.",
    version: "2.1",
    lastUpdated: "2025-01-15",
    createdBy: "Legal Team",
    downloads: 1247,
    fields: [
      { label: "Case ID", type: "text", required: false },
      { label: "Project / Site Name", type: "text", required: true },
      { label: "Date of Incident", type: "date", required: true },
      { label: "Parties Involved", type: "textarea", required: true },
      { label: "Brief Chronology of Events", type: "textarea", required: true },
      { label: "Relevant Clauses / References", type: "textarea", required: false },
      { label: "Attachments / Evidence", type: "file", required: false }
    ],
    structure: `STATEMENT OF FACTS

Matter: [Project / Site Name]
Case No: [Case ID]
Date of Incident: [Date of Incident]

PARTIES INVOLVED:
[Parties Involved]

CHRONOLOGY OF EVENTS:
[Brief Chronology of Events]

RELEVANT CLAUSES / REFERENCES:
[Relevant Clauses / References]

This statement is submitted for record.

Submitted by: [Your Name]
Date: [Current Date]`
  },
  {
    id: "legal_notice",
    title: "Legal Notice",
    category: "Legal Notices",
    description: "Formal notification to the opposing party before legal action.",
    version: "3.0",
    lastUpdated: "2025-01-14",
    createdBy: "Legal Team",
    downloads: 2134,
    fields: [
      { label: "Case ID", type: "text", required: false },
      { label: "Recipient / Party Name", type: "text", required: true },
      { label: "Subject of Notice", type: "text", required: true },
      { label: "Purpose / Reason for Notice", type: "textarea", required: true },
      { label: "Demand / Relief Sought", type: "textarea", required: true },
      { label: "Deadline for Compliance", type: "date", required: true },
      { label: "Reference Clauses / Contract Sections", type: "textarea", required: false }
    ],
    structure: `To,
[Recipient / Party Name]

Subject: Legal Notice - [Subject of Notice]

Dear Sir/Madam,

This is to formally notify you regarding the following matter:

PURPOSE:
[Purpose / Reason for Notice]

DEMAND:
[Demand / Relief Sought]

REFERENCE CLAUSES:
[Reference Clauses / Contract Sections]

You are hereby required to comply with the above demands within [Deadline for Compliance]. Failure to comply will compel us to initiate appropriate legal proceedings without further notice.

Yours faithfully,
[Your Name/Organization]
Case Reference: [Case ID]`
  },
  {
    id: "rejoinder",
    title: "Rejoinder",
    category: "Response Documents",
    description: "Reply to a counter affidavit or opposition, clarifying facts and rebuttals.",
    version: "1.5",
    lastUpdated: "2025-01-13",
    createdBy: "Legal Team",
    downloads: 876,
    fields: [
      { label: "Case ID", type: "text", required: true },
      { label: "Respondent Name", type: "text", required: true },
      { label: "Reference Notice / Reply Date", type: "date", required: true },
      { label: "Points of Clarification", type: "textarea", required: true },
      { label: "Supporting References", type: "textarea", required: false },
      { label: "Attachments (if any)", type: "file", required: false }
    ],
    structure: `REJOINDER

Case No: [Case ID]
Respondent: [Respondent Name]

With reference to the reply dated [Reference Notice / Reply Date], we submit the following clarifications:

POINTS OF CLARIFICATION:
[Points of Clarification]

SUPPORTING REFERENCES:
[Supporting References]

We trust this addresses all concerns raised and request the matter to be decided in our favor.

Respectfully submitted,
[Your Name]
Date: [Current Date]`
  },
  {
    id: "mou",
    title: "Memorandum of Understanding (MoU)",
    category: "Agreements",
    description: "Draft agreement outlining mutual terms between parties.",
    version: "2.3",
    lastUpdated: "2025-01-12",
    createdBy: "Legal Team",
    downloads: 1567,
    fields: [
      { label: "Parties Involved", type: "textarea", required: true },
      { label: "Date of Execution", type: "date", required: true },
      { label: "Purpose / Objective of MoU", type: "textarea", required: true },
      { label: "Scope of Work / Obligations", type: "textarea", required: true },
      { label: "Duration / Validity", type: "text", required: false },
      { label: "Termination Clause", type: "textarea", required: false },
      { label: "Governing Law / Jurisdiction", type: "text", required: false }
    ],
    structure: `MEMORANDUM OF UNDERSTANDING

This MoU is entered into on [Date of Execution] between:

PARTIES:
[Parties Involved]

PURPOSE:
[Purpose / Objective of MoU]

SCOPE OF WORK / OBLIGATIONS:
[Scope of Work / Obligations]

DURATION:
[Duration / Validity]

TERMINATION:
[Termination Clause]

GOVERNING LAW:
[Governing Law / Jurisdiction]

IN WITNESS WHEREOF, the parties have executed this MoU on the date mentioned above.

Party A: _____________    Party B: _____________`
  },
  {
    id: "affidavit",
    title: "Affidavit",
    category: "Legal Declarations",
    description: "Sworn statement submitted before an authorized officer.",
    version: "1.8",
    lastUpdated: "2025-01-11",
    createdBy: "Legal Team",
    downloads: 1923,
    fields: [
      { label: "Deponent Name", type: "text", required: true },
      { label: "Relation to Case", type: "text", required: false },
      { label: "Case ID", type: "text", required: false },
      { label: "Facts / Statements", type: "textarea", required: true },
      { label: "Sworn Before (Authority)", type: "text", required: true },
      { label: "Date of Swearing", type: "date", required: true }
    ],
    structure: `AFFIDAVIT

I, [Deponent Name], [Relation to Case], do hereby solemnly affirm and declare as follows:

Case Reference: [Case ID]

STATEMENT OF FACTS:
[Facts / Statements]

I hereby declare that the contents of this affidavit are true to the best of my knowledge and belief.

DEPONENT

Sworn before: [Sworn Before (Authority)]
Date: [Date of Swearing]

DEPONENT`
  }
];
