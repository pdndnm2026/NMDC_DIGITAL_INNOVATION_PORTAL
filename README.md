# NMDC AI & Digital Innovation, Problem Statement, Vendor Solution & Project Management Portal

> **Client:** NMDC Limited (Navratna PSU under Ministry of Steel, Government of India)  
> **Core Domain:** Enterprise Innovation Management, Industrial Problem Statement Registry, Vendor Technical & Budgetary Offers, Weighted Technical-Commercial Evaluation, PoC/Pilot Tracking, Interactive Gantt Scheduling, and Gemini AI Analytics.

---

## 1. Executive Summary & Purpose

The NMDC AI & Digital Innovation Portal is a full-stack, enterprise-grade web application built to govern the end-to-end lifecycle of innovation across NMDC's headquarters and operating complexes (Bailadila Deposit 5, Bailadila Deposit 14/11C, Donimalai, Kumaraswamy, Bacheli, and Panna).

### Core Workflow:
```text
NMDC Field Problem / Idea
          ↓
Problem Statement Published as Open Challenge
          ↓
Registered Vendors View Opportunities & Specs
          ↓
Vendor Submits Technical Proposal + 7-Head Budgetary Offer (with GST)
          ↓
Dual Evaluation (Technical 70% + Commercial 30% Configurable Scoring)
          ↓
Technical Committee Recommendation & AI Risk Assessment
          ↓
PoC Sanction & Conversion to Active Project
          ↓
Milestone Execution & Interactive Gantt Tracking (Planned vs Actual)
          ↓
Benefits Realisation (Projected vs Realised ₹ Cr Savings)
          ↓
Executive Management Analytics & Organization-Wide Scaling
```

---

## 2. User Roles & Demo Credentials

| Role | Name | Email | Designation & Complex | Default Access |
|---|---|---|---|---|
| **Admin** | Shri R. K. Sharma | `admin@nmdc.co.in` | Executive Director (Digital & IT), Corporate Office | Full system governance, challenge publishing, PoC sanction, config |
| **Executive** | Dr. Amitabh Verma | `executive@nmdc.co.in` | General Manager (Mining), Bailadila Deposit 5 | Idea submission, problem logging, status tracking |
| **Vendor** | Ananya Deshmukh | `vendor@miningtech.in` | Head of Industrial AI, MiningTech Dynamics | 7-step proposal wizard, budgetary offers, document uploads |
| **Reviewer** | Shri S. K. Nayak | `reviewer@nmdc.co.in` | Chief General Manager (R&D), R&D Centre Hyderabad | Weighted technical & commercial proposal evaluation, AI analysis |
| **Project Manager**| V. Rajeshwar Rao | `pm@nmdc.co.in` | Deputy General Manager (Projects), Donimalai | Gantt milestone updates, KPI logging, risk mitigations |
| **Public User** | Citizen / Prospective Partner | `public@citizen.in` | General Public | Challenge browsing, public project tracking, registration |

*Note: In the live portal, you can switch personas in 1-click via the top navigation bar or the "Sign In" modal.*

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans, JetBrains Mono (for tabular figures).
- **Backend:** Node.js, Express, TypeScript (`tsx`), Server-Sent Events (SSE) for real-time live admin monitoring.
- **AI Integration:** `@google/genai` TypeScript SDK using `gemini-3.8-flash` on server-side with `process.env.GEMINI_API_KEY`.
- **Database Architecture:** Relational schema with DDL definitions for PostgreSQL (with in-memory persistence and audit logging).

---

## 4. PostgreSQL Relational Database Schema

```sql
-- 1. Users & Roles
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('public', 'executive', 'vendor', 'reviewer', 'project_manager', 'admin')),
    department VARCHAR(255),
    employee_id VARCHAR(64),
    designation VARCHAR(128),
    project_complex VARCHAR(128),
    vendor_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vendors & Documents
CREATE TABLE vendors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    legal_entity VARCHAR(64) NOT NULL,
    cin VARCHAR(32) NOT NULL,
    pan VARCHAR(16) NOT NULL,
    gstin VARCHAR(20) NOT NULL,
    registered_address TEXT NOT NULL,
    website VARCHAR(255),
    year_established INTEGER NOT NULL,
    company_size VARCHAR(32) NOT NULL,
    msme_status BOOLEAN DEFAULT FALSE,
    startup_status BOOLEAN DEFAULT FALSE,
    contact_person VARCHAR(128) NOT NULL,
    designation VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(32) NOT NULL,
    capabilities TEXT[] NOT NULL,
    mining_experience_years INTEGER NOT NULL,
    status VARCHAR(32) DEFAULT 'Active' CHECK (status IN ('Pending', 'Under Verification', 'Approved', 'Active', 'Suspended')),
    performance_score NUMERIC(5,2) DEFAULT 80.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Problem Statements / Innovation Challenges
CREATE TABLE problem_statements (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL, -- e.g. PS-001
    title VARCHAR(512) NOT NULL,
    department VARCHAR(255) NOT NULL,
    project_complex VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    sub_category VARCHAR(128),
    problem_description TEXT NOT NULL,
    current_process TEXT,
    current_difficulties TEXT,
    root_cause TEXT,
    expected_outcome TEXT NOT NULL,
    submission_deadline DATE NOT NULL,
    budgetary_indication VARCHAR(64),
    budget_numeric NUMERIC(10,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'Open' CHECK (status IN ('Open', 'Under Evaluation', 'PoC Awarded', 'Closed')),
    responded_vendors_count INTEGER DEFAULT 0,
    published_date DATE NOT NULL,
    created_by VARCHAR(128) NOT NULL,
    equipment_affected VARCHAR(255),
    cost_impact TEXT
);

-- 4. Employee Ideas
CREATE TABLE ideas (
    id VARCHAR(64) PRIMARY KEY,
    idea_code VARCHAR(32) UNIQUE NOT NULL, -- e.g. IDEA-2025-001
    title VARCHAR(512) NOT NULL,
    submitter_name VARCHAR(128) NOT NULL,
    submitter_email VARCHAR(255) NOT NULL,
    employee_id VARCHAR(64) NOT NULL,
    designation VARCHAR(128) NOT NULL,
    department VARCHAR(255) NOT NULL,
    project_complex VARCHAR(255) NOT NULL,
    problem_statement TEXT NOT NULL,
    existing_process TEXT,
    proposed_innovation TEXT NOT NULL,
    ai_digital_technology VARCHAR(255),
    expected_benefit TEXT,
    estimated_cost VARCHAR(64),
    estimated_annual_savings VARCHAR(64),
    expected_roi_years NUMERIC(4,2),
    expected_implementation_months INTEGER,
    status VARCHAR(32) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Screening', 'Under Evaluation', 'Approved', 'Rejected', 'PoC Approved')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Vendor Proposals & Budgetary Offers
CREATE TABLE proposals (
    id VARCHAR(64) PRIMARY KEY,
    proposal_code VARCHAR(32) UNIQUE NOT NULL, -- e.g. PROP-2025-001
    problem_statement_id VARCHAR(64) REFERENCES problem_statements(id),
    vendor_id VARCHAR(64) REFERENCES vendors(id),
    solution_description TEXT NOT NULL,
    architecture_type VARCHAR(64) NOT NULL,
    technology_stack TEXT[] NOT NULL,
    ai_ml_models TEXT[],
    hardware_specs TEXT,
    timeline_months INTEGER NOT NULL,
    warranty_period_years INTEGER NOT NULL,
    
    -- Itemized Costs (₹)
    poc_cost NUMERIC(14,2) NOT NULL,
    pilot_cost NUMERIC(14,2) NOT NULL,
    hardware_cost NUMERIC(14,2) NOT NULL,
    software_cost NUMERIC(14,2) NOT NULL,
    integration_cost NUMERIC(14,2) NOT NULL,
    licence_cost NUMERIC(14,2) NOT NULL,
    training_cost NUMERIC(14,2) NOT NULL,
    amc_cost_per_year NUMERIC(14,2) NOT NULL,
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    total_cost_incl_gst NUMERIC(14,2) NOT NULL,
    
    -- Business Case
    expected_savings_annual NUMERIC(14,2) NOT NULL,
    availability_improvement_pct NUMERIC(5,2),
    payback_period_months NUMERIC(5,1),
    roi_years NUMERIC(4,2),
    
    -- Scores & Recommendations
    technical_score NUMERIC(5,2),
    commercial_score NUMERIC(5,2),
    composite_score NUMERIC(5,2),
    committee_recommendation VARCHAR(64),
    status VARCHAR(32) DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Technical Review', 'Technical Shortlisted', 'Commercial Review', 'PoC Recommended', 'PoC Approved', 'Rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Configurable Evaluation Parameters
CREATE TABLE evaluation_parameters (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('technical', 'commercial')),
    weight_pct NUMERIC(5,2) NOT NULL,
    description TEXT,
    max_marks INTEGER DEFAULT 100
);

-- 7. Projects & Gantt Milestones
CREATE TABLE projects (
    id VARCHAR(64) PRIMARY KEY,
    project_code VARCHAR(32) UNIQUE NOT NULL, -- e.g. NMDC-PRJ-2025-01
    name VARCHAR(512) NOT NULL,
    problem_statement_id VARCHAR(64) REFERENCES problem_statements(id),
    vendor_id VARCHAR(64) REFERENCES vendors(id),
    nmdc_department VARCHAR(255) NOT NULL,
    nmdc_complex VARCHAR(255) NOT NULL,
    project_manager VARCHAR(128) NOT NULL,
    approved_budget_cr NUMERIC(8,2) NOT NULL,
    actual_expenditure_cr NUMERIC(8,2) DEFAULT 0,
    start_date DATE NOT NULL,
    target_completion_date DATE NOT NULL,
    current_stage VARCHAR(64) NOT NULL,
    health VARCHAR(32) DEFAULT 'On Track' CHECK (health IN ('On Track', 'At Risk', 'Delayed', 'Completed')),
    progress_pct INTEGER DEFAULT 0
);

CREATE TABLE project_milestones (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(512) NOT NULL,
    stage VARCHAR(64) NOT NULL,
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_end_date DATE,
    progress_pct INTEGER DEFAULT 0,
    status VARCHAR(32) DEFAULT 'On Track',
    responsible_person VARCHAR(128),
    deliverables TEXT
);

-- 8. Immutable Audit Trail
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    result VARCHAR(16) NOT NULL,
    ip_address VARCHAR(45) NOT NULL
);
```

---

## 5. REST API Endpoints

### Statistics & Overview
- `GET /api/stats`: Returns portal-wide metrics (Ideas, Vendors, PoCs, Realised Savings).

### Authentication & Profiles
- `POST /api/auth/login`: Authenticate as any role persona.
- `POST /api/auth/register-executive`: Executive signup and automatic profile setup.
- `POST /api/auth/register-vendor`: Vendor signup with MSME/CIN validation.

### Problem Statements & Challenges
- `GET /api/problems`: List open challenges with search/category/dept filters.
- `GET /api/problems/:id`: Get detailed problem specs and equipment impact.
- `POST /api/problems`: Admin creates and publishes new challenge.

### Employee Ideas
- `GET /api/ideas`: List submitted ideas.
- `POST /api/ideas`: Submit new employee idea with automatic ID and Gemini classification.
- `PATCH /api/ideas/:id/status`: Update idea review status and comments.
- `POST /api/ideas/:id/classify`: Trigger Gemini classification.

### Vendor Proposals & Budgetary Offers
- `GET /api/proposals`: List submitted vendor proposals.
- `POST /api/proposals`: Submit 7-step technical & budgetary offer with automatic cost calculation.
- `POST /api/proposals/:id/evaluate`: Reviewer submits technical and commercial marks.
- `PATCH /api/proposals/:id/status`: Update proposal status.
- `POST /api/proposals/:id/analyze-ai`: Run Gemini deep proposal analysis.

### Project & Gantt Management
- `GET /api/projects`: List active implementation projects with milestones, KPIs, and benefits.
- `POST /api/projects/convert-proposal`: Convert approved proposal into active PoC Project.
- `PATCH /api/projects/:id/milestones/:mId`: Update milestone progress and health status.

### Real-Time Monitoring & Audit
- `GET /api/activities`: Fetch live activity feed.
- `GET /api/realtime/stream`: Server-Sent Events (SSE) live event push.
- `GET /api/audit-logs`: Immutable audit log query.

### Gemini AI Features
- `POST /api/ai/classify`: Classify ideas and suggest technical approaches.
- `POST /api/ai/analyze-proposal`: Generate executive summary, strengths, gaps, risks, and questions.
- `POST /api/ai/document-extract`: Extract structured procurement parameters from vendor PDF text.
- `GET /api/ai/management-insights`: Generate facts vs AI strategic recommendations for leadership.
- `POST /api/ai/chat`: Context-aware NMDC Innovation Assistant.

---

## 6. Local Development & Installation

### Prerequisites:
- Node.js 20+
- npm or bun

### Commands:
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Express API + Vite)
npm run dev

# Server runs at http://localhost:3000
```

### Production Build:
```bash
# Compile client bundle into dist
npm run build

# Start production server
npm start
```

---

## 7. Security Checklist for PSU Deployment

1. **Role-Based Access Control (RBAC):** Strict segregation between public users, employees, vendors, reviewers, and administrators.
2. **Environment Variable Protection:** Zero API keys or secrets exposed in frontend bundles; all Gemini calls proxied through server-side endpoints.
3. **Statutory Non-Delegation Principle:** AI is explicitly constrained to recommendations and summaries; all statutory procurement approvals require authorized NMDC personnel action.
4. **Immutable Audit Trail:** All state transitions (`USER_LOGIN`, `IDEA_CREATED`, `PROPOSAL_SUBMITTED`, `EVALUATION_COMPLETED`, `POC_APPROVED`) recorded with user ID and client IP.
5. **Air-Gapped & Sovereign Data Architecture:** Designed to support on-premise NMDC data center deployment with MeitY Cert-In compliance.
