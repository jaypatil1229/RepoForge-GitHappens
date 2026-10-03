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

### 🔐 Admin — Network Governance

| Field | Value |
|---|---|
| **Email** | `admin@credlink.org` |
| **Password** | `CredLink@2025` |
| **Full Name** | Network Administrator |
| **Role** | `ADMIN` |
| **Organization** | CredLink Network Governance |
| **Access Level** | Full platform administration, trust registry management, issuer authorization |

---

### 🏥 Healthcare Domain — Doctor

| Field | Value |
|---|---|
| **Email** | `doctor@stjude.health` |
| **Password** | `Health@2025` |
| **Full Name** | Dr. Priya Sharma |
| **Role** | `CITIZEN` |
| **Domain** | Healthcare / Hospital |
| **Use Case** | Issue & verify immunization records, health insurance eligibility, medical attestations |

---

### 🎓 Education Domain — Dean

| Field | Value |
|---|---|
| **Email** | `dean@nit.edu` |
| **Password** | `Education@2025` |
| **Full Name** | Prof. Rajesh Kumar |
| **Role** | `CITIZEN` |
| **Domain** | Education / College |
| **Use Case** | Issue & verify academic transcripts, degree certificates, enrollment records |

---

### 🏦 Finance Domain — Bank Manager

| Field | Value |
|---|---|
| **Email** | `manager@apex.bank` |
| **Password** | `Finance@2025` |
| **Full Name** | Anita Desai |
| **Role** | `CITIZEN` |
| **Domain** | Banking / Finance |
| **Use Case** | Issue & verify KYC compliance, income verification, credit standing attestations |

---

### 💼 Employer Domain — HR Manager

| Field | Value |
|---|---|
| **Email** | `hr@globaltech.corp` |
| **Password** | `Employer@2025` |
| **Full Name** | Vikram Singh |
| **Role** | `CITIZEN` |
| **Domain** | Employment / Enterprise |
| **Use Case** | Issue & verify employment certificates, role seniority, clearance certificates |

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
