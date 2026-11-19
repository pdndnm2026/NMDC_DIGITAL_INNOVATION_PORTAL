# NMDC Problem Statement, Vendor Solution & Project Management Portal
## Deployment, Configuration & Operations Guide (Zero-AI Enterprise Architecture)

---

## 1. Architecture Overview

This application implements the **NMDC Problem Statement, Vendor Solution & Project Management Portal** with:
- **Zero-AI Architecture**: All AI, LLM, chatbot, and automated scoring components are completely removed. All evaluations, approvals, and workflow transitions are human-driven with full audit logging.
- **5 DB-Driven Organisational Units**:
  1. **HO** — Head Office – Hyderabad (Corporate Headquarters & Consolidated 5-Unit MIS Access)
  2. **DIOM** — Donimalai Iron Ore Mine (Karnataka)
  3. **KIOM** — Kumaraswamy Iron Ore Mine (Karnataka)
  4. **BCH** — Bacheli Complex (Chhattisgarh)
  5. **KDL** — Kirandul Complex (Chhattisgarh)
- **Clean Empty Live Startup**: Opens with zero live operational records until authorised users create records, except system unit definitions and the secure Initial Portal Administrator setup screen on first launch.
- **Full Dual-Runtime Support**:
  - **Express Server (`server.ts`)** for Node.js full-stack deployment (`npm run build && npm start`).
  - **Static Netlify Adapter (`src/utils/clientApi.ts`)** storing state cleanly in browser storage with identical validation rules, Employee Master verification, Excel import/export, and Demo Showcase isolation.

---

## 2. Local Development & Build

### Prerequisites
- Node.js 20+
- npm 10+

### Commands
```bash
npm install
npm run dev          # Starts Express + Vite dev server on http://localhost:3000
npm run lint         # TypeScript type-check (tsc --noEmit)
npm run build        # Production Vite bundle in dist/
```

### Netlify Static Deployment
1. Run `npm run build` (`dist/` output directory).
2. `netlify.toml` serves the SPA fallback and client-side portal API adapter automatically with zero external server dependency.

---

## 3. PostgreSQL & Django Backend Reference (`backend_django/`)

The `backend_django/portal/` directory provides matching Django ORM models and migrations for enterprise PostgreSQL deployment:
- `MineComplex`: 5 organisational units seeded via `0001_initial.py`.
- `EmployeeMaster` & `EmployeeImportHistory`: 10-column SAP Employee Master table and import history. **Employee Master records never auto-create portal user accounts or passwords.**
- `Vendor` & `VendorDocument`: GST exemption handling, PAN/GSTIN constraints, compulsory verification documents, and `Pending -> Under Verification -> Approved / Rejected -> Active / Suspended` lifecycle.
- `ProblemStatement` & `ProblemStatementAttachment`: Supports documents, images, and uploaded walkthrough videos (`MP4`, `WEBM`, `MOV`).
- `BudgetaryOfferRequest`: Auto-generated `{UNIT}-BOR-2026-0001` codes, deadline extension audit logs, non-binding budgetary disclaimer, and invited vs all-eligible vendor scopes.
- `DiscussionThread` & `DiscussionMessage`: Immutable message records linked to Problem Statements or Budgetary Offer Requests with strict per-vendor private confidentiality vs official common clarifications.
- `is_demo` boolean flag across core operational tables to isolate `[DEMO]` records from Live reporting.

### Applying Django Migrations
```bash
cd backend_django
python manage.py migrate
```

---

## 4. Employee Master Excel Import Format (10 Columns)

Upload `.xlsx` or `.xls` files matching these exact column headers (a ready template is downloadable directly inside **Administration -> Employee Master**):

| Sl. No. | Expected Header Name | Rules |
|---|---|---|
| 1 | `Employee Name` | Mandatory |
| 2 | `SAP Employee ID` | Mandatory, Unique |
| 3 | `Email ID` | Mandatory, Unique valid email |
| 4 | `Mobile Number` | Mandatory (10+ digits) |
| 5 | `Designation` | Mandatory |
| 6 | `Department` | Mandatory |
| 7 | `Area of Work` | Mandatory |
| 8 | `Mine/Complex` | Must match `HO`, `DIOM`, `KIOM`, `BCH`, `KDL` (or full unit name) |
| 9 | `Location` | Mandatory |
| 10 | `Employee Status` | `Active` or `Inactive` |

### Executive Registration Against Employee Master
- When an NMDC officer submits the Executive Registration form, their entered **SAP Employee ID** is verified against active records in Employee Master.
- If no matching record exists, registration is blocked with:
  `"Your employee details are not available in the Employee Master. Please contact the concerned administrator."`
- Matching records auto-bind official Department and Organisational Unit and enter the **Administration** approval queue before login access is granted.

---

## 5. Isolated Demo Showcase Dataset

- On startup, no demo data is preloaded (`Live Only`).
- Authorised Portal Administrators may open **Administration -> Demo Showcase Management** to load 5 complete `[DEMO]` operational workflows spanning `HO`, `DIOM`, `KIOM`, `BCH`, and `KDL`.
- All demo records display `[DEMO]` badges, remain excluded from Live Operational Views unless **Demo Showcase** mode is toggled ON, and remain excluded from **MIS Reports** (`Live Only (Default)`) unless switched explicitly to `Demo Only` or `Combined`.
- Administrators can click **Delete Demo Data Permanently** at any time to purge all `isDemo` records without affecting live data.
