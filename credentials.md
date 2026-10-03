# CredLink — User Credentials Reference

> **⚠️ CONFIDENTIAL** — This file contains login credentials for testing and development purposes only.
> Do NOT commit this file to a public repository.

## Backend API

| Endpoint | URL |
|---|---|
| Local Dev | `http://localhost:5000` |
| Production (Railway) | `https://credlink-20-production.up.railway.app` |

## Supabase Project

| Key | Value |
|---|---|
| Project URL | `https://frbmdqtbsedimggqqson.supabase.co` |
| Publishable Key | `sb_publishable_d48bzRwTMli-4v93SdUx8Q__Dsnmw9q` |
| Secret Key | *(see backend/.env — not committed for security)* |

---

## User Accounts

### 👑 Super Admin — Network Governance
| Field | Value |
|---|---|
| **Email** | `admin@credlink.org` |
| **Password** | `CredLink@2025` |
| **Role / Persona** | **Super Admin** |
| **Capabilities** | Approve/reject issuer organizations, view full platform logs, user directory, request logs, universal issuance/request override |

---

### 🏫 Issuer 1 — Education Institution (NIT)
| Field | Value |
|---|---|
| **Email** | `dean@nit.edu` |
| **Password** | `Education@2025` |
| **Full Name** | Prof. Rajesh Kumar |
| **Role / Persona** | **Issuer (College / Education)** |
| **Organization** | National Institute of Technology |
| **Capabilities** | Issue Grade Cards, Degree Certificates, Transcripts directly to citizens |

---

### 🏥 Issuer 2 — Healthcare Institution (AIIMS / Hospital)
| Field | Value |
|---|---|
| **Email** | `doctor@stjude.health` |
| **Password** | `Health@2025` |
| **Full Name** | Dr. Priya Sharma |
| **Role / Persona** | **Issuer (Healthcare / Hospital)** |
| **Organization** | All India Institute of Medical Sciences |
| **Capabilities** | Issue Immunization Records, Health Attestations directly to citizens |

---

### 🔍 Requester 1 — Scholarship Trust & Finance Verifier
| Field | Value |
|---|---|
| **Email** | `manager@apex.bank` |
| **Password** | `Finance@2025` |
| **Full Name** | Anita Desai |
| **Role / Persona** | **Requester (Trust / Bank Verifier)** |
| **Organization** | Apex Global Bank / Scholarship Foundation |
| **Capabilities** | Gmail-style multi-citizen document request composer, status tracker, verified document viewer |

---

### 🔍 Requester 2 — Enterprise Employer (Background Checks)
| Field | Value |
|---|---|
| **Email** | `hr@globaltech.corp` |
| **Password** | `Employer@2025` |
| **Full Name** | Vikram Singh |
| **Role / Persona** | **Requester (Employer Background Check)** |
| **Organization** | TechCorp Solutions |
| **Capabilities** | Request experience letters, degree verification from multiple citizens at once |

---

### 👤 Citizen 1 — Primary Digital Wallet Holder
| Field | Value |
|---|---|
| **Email** | `citizen@credlink.org` |
| **Password** | `Citizen@2025` |
| **Full Name** | Aarav Sharma |
| **Role / Persona** | **Citizen** |
| **Capabilities** | Citizen Wallet, presentation QR, receive request notifications, approve/decline, instant access revocation |

---

### 👤 Citizen 2 — Secondary Student Wallet
| Field | Value |
|---|---|
| **Email** | `student@nit.edu` |
| **Password** | `Citizen@2025` |
| **Full Name** | Rohan Verma |
| **Role / Persona** | **Citizen (Student)** |
| **Capabilities** | Multi-recipient request testing, receive grade cards, grant/decline consent |

---

## Quick Login Test (cURL)

```bash
# Admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@credlink.org","password":"CredLink@2025"}'

# Doctor login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@stjude.health","password":"Health@2025"}'
```

## Frontend Login URL

- **Local**: http://localhost:3000/login
- **Production**: https://cred-link-connect.vercel.app/login
