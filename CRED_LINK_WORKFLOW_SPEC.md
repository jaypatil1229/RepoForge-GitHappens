# CredLink 2.0 — End-to-End Workflow & Role Specification

> **Authoritative Specification Document**  
> *This document serves as the permanent system architecture blueprint for CredLink 2.0. All subsequent features, UI screens, API endpoints, and role authorizations strictly adhere to the workflows and access boundaries defined herein.*

---

## 1. Executive Summary & Core Lifecycle

CredLink is a privacy-first, verifiable digital identity and credential network. The platform connects four distinct user archetypes through a cryptographic trust lifecycle:

```
[Issuer Registration] 
       │
       ▼
[Super Admin Review] ──► (Approve / Reject)
       │ (Approved)
       ▼
[Issuer Portal] ──► Issues Verifiable Credentials ──► [Citizen Wallet]
                                                            │
                                                            │ (Stored)
[Requester Portal]                                          ▼
   (Gmail-like multi-citizen request) ────────────► [Citizen Notification]
                                                            │
                                                            ├──► Approved ──► [Requester View & Verify]
                                                            │
                                                            ├──► Rejected ──► [Requester View Declined]
                                                            │
                                                            └──► Revoke Anytime (Access Cut Off)
```

---

## 2. The 4 Distinct Screens & User Personas

### 👑 Persona 1: Super Admin (`ADMIN`)
- **Access Level**: Full unrestricted master control over the entire platform.
- **Dedicated Screen & Capabilities**:
  1. **Organizations Management**: View all pending issuer/organization registration requests. One-click **Approve** (activates issuer status, assigns authorized credential schemas, issues cryptographic DID) or **Reject** (with reason).
  2. **Comprehensive App Logs**: Real-time platform event logs, API activity, errors, and system health metrics.
  3. **User Directory & Logs**: View all registered users across all domains, their roles, registration timestamps, and last active sessions.
  4. **Verification & Request Logs**: Live feed of all verification requests across the network, showing requester, target citizen, requested claims, expiration, and status.
  5. **Universal Override**: Capable of issuing any credential or requesting verification on demand.

---

### 🏫 Persona 2: Issuer (`ISSUER` / Education, Enterprise, Healthcare)
- **Access Level**: Registered institutions authorized to issue verifiable credentials directly to citizens.
- **Dedicated Screen & Capabilities**:
  1. **Registration & Status**: Register organization profile (e.g. NIT Trichy, St. Jude Hospital, GlobalTech Corp). If status is `PENDING`, displays waiting state with submission details. Once `APPROVED` by Super Admin, unlocks issuance tools.
  2. **Credential Issuance Center**: Issue single or batch verifiable credentials to citizens via citizen email/UUID.
     - *Education Institute*: Grade Cards, Degree Certificates, Academic Transcripts.
     - *Company / Employer*: Experience Letters, Recommendation Letters, Relieving Letters.
     - *Healthcare*: Immunization Records, Medical Clearance, Health Insurance Records.
  3. **Issued Credentials Log**: List of all credentials issued by this organization, with issue dates, citizen details, cryptographic presentation QR codes, and status.
  4. **Credential Revocation**: Immediate revocation capability for any credential issued by this organization (e.g. if revoked, updates trust status network-wide).
  5. **Citizen Issuance Requests**: Review incoming requests submitted by citizens asking for specific credentials to be issued.

---

### 🔍 Persona 3: Requester / Verifier (`REQUESTER` / `VERIFIER`)
- **Access Level**: Third-party institutions, trusts, background checkers, scholarship committees, and employers requesting citizen records.
- **Dedicated Screen & Capabilities**:
  1. **Gmail-Style Multi-Recipient Request Composer**:
     - Modern tag/chip-based email input where the requester can type or paste multiple citizen emails (e.g. `student1@college.edu`, `student2@college.edu`).
     - Multi-select of requested document types (e.g., Degree Certificate + Experience Letter).
     - Purpose specification (e.g. "Merit Scholarship 2026 Eligibility Verification" or "Senior Software Engineer Background Check").
     - Dispatch sends individualized verification consent requests to all specified citizens in parallel.
  2. **Request Tracking Dashboard**:
     - Live categorized overview of all outgoing requests: **Pending**, **Approved**, and **Declined/Expired**.
     - Real-time status indicators per recipient.
  3. **Verified Document Viewer**:
     - For requests marked **Approved**, the requester can click to open and view the verified credentials and selective claims disclosed by the citizen.
     - Includes cryptographic proof verification badge (HMAC-SHA256 / DID signature validity, issuer trust check, tamper-evident record).
  4. **Declined & Revoked Status View**: Clear indicators when a citizen has declined a request or revoked access.

---

### 👤 Persona 4: Citizen (`CITIZEN`)
- **Access Level**: Individual digital identity and wallet holder with complete sovereign data ownership.
- **Dedicated Screen & Capabilities**:
  1. **Citizen Wallet (`/credentials` or `/wallet`)**:
     - Visual credential cards showing all issued degrees, certificates, medical records, and employment proofs.
     - Inspect credential details, claims, and issuer cryptographic signatures.
     - Generate secure presentation QR code for in-person or offline verification.
  2. **Incoming Document Requests & Notifications**:
     - Notification badge and incoming requests queue.
     - Inspect who is requesting what (requester name, organization, exact claims requested, stated purpose, expiration).
     - One-click **Approve** (with optional selective disclosure) or **Reject** at the citizen's convenience.
  3. **Active Authorizations & Access Logs**:
     - Transparent ledger of all active requester permissions granted in the past.
     - Immediate **Revoke Access** button on every active authorization, instantly cutting off the requester's access to the document.
  4. **Request Issuance from Issuer**:
     - Simple form allowing the citizen to request their school, employer, or hospital to issue a specific document to their wallet.

---

## 3. Data Flow & Security Rules

1. **Zero-Knowledge / Sovereign Consent**:
   - Requesters NEVER see citizen credentials until the citizen explicitly clicks "Approve".
   - Citizen can revoke consent at any time; revoked consents immediately block the requester from accessing credential payloads.
2. **Cryptographic Integrity**:
   - Credentials contain application-level HMAC-SHA256 signatures bound to issuer DIDs (`did:key:...`).
   - Tamper-evident verification checks ensure credentials have not been modified since issuance.
3. **Role-Based Routing & Screen Protection**:
   - `ADMIN` -> Dedicated Admin Console (Organizations, System Logs, Universal Controls).
   - `ISSUER` -> Issuer Issuance Suite & Registration Queue.
   - `REQUESTER` -> Gmail-Style Document Request Hub & Verification Dashboard.
   - `CITIZEN` -> Citizen Identity Wallet, Incoming Consent Manager & Access Revocation Ledger.

---

## 4. Test Accounts & Credential Matrix

| Role | Email | Password | Full Name | Primary Screen / Function |
|---|---|---|---|---|
| **Super Admin** | `admin@credlink.org` | `CredLink@2025` | Network Administrator | Organizations approval, master audit & user logs |
| **Issuer (Education)** | `dean@nit.edu` | `Education@2025` | Prof. Rajesh Kumar (NIT) | Issue degrees, transcripts, grade cards |
| **Issuer (Hospital)** | `doctor@stjude.health` | `Health@2025` | Dr. Priya Sharma (St. Jude) | Issue health cards, immunization records |
| **Requester (Scholarship Trust)** | `scholarships@apex.bank` | `Finance@2025` | Apex Trust / Bank Verifier | Multi-citizen document request composer |
| **Requester (Enterprise HR)** | `hr@globaltech.corp` | `Employer@2025` | Vikram Singh (GlobalTech HR) | Background check document requests |
| **Citizen (Wallet Holder)** | `citizen@credlink.org` | `Citizen@2025` | Aarav Sharma | Citizen Wallet, approve/reject requests, revoke |
| **Citizen (Student)** | `student@nit.edu` | `Citizen@2025` | Rohan Verma | Secondary citizen for multi-recipient request testing |
