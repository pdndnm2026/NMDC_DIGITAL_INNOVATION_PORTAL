# NMDC Limited - Problem Statement, Vendor Solution & Project Management Portal
## Python Django Backend & PostgreSQL Architecture Reference (Section 28)

This directory provides the complete enterprise Django backend architecture for NMDC Limited.

### 1. Technology Architecture
- **Framework:** Python Django 5.0 + Django REST Framework (DRF)
- **Database:** PostgreSQL 15 (Relational Data Model with Foreign Keys and Constraints)
- **Real-Time Channels:** Django Channels + Redis (for live notifications and audit feeds)
- **Deployment:** Docker & Docker Compose with Gunicorn & Daphne ASGI

### 2. Relational Schema Overview
- `PortalUser`: Extended AbstractUser supporting all 10 roles (Executive, Dept Head, Approving Authority, Vendor, Technical Evaluator, Commercial Evaluator, PoC Committee, Project Manager, Admin, Public).
- `Vendor`: Registered industrial vendors with CIN, PAN, GSTIN, MSME, Startup certificates, and audit performance scores.
- `ProblemStatement`: 6-stage operational problem lifecycle (`Draft` → `Submitted` → `Department Review` → `Approval` → `Published` → `Vendor Participation` → `Technical Evaluation` → `PoC Underway` → `Award Sanctioned`).
- `VendorProposal`: Part A (Technical), Part B (13-item commercial costing with auto 18% GST), Part C (Commercial Conditions), with proposal revision locking.
- `ClarificationQuery`: Transparent vendor-to-officer query and shared publication.
- `PocRecord`: Proof of Concept field trial supervision with 9 status gates and baseline verification.
- `AwardOfWork`: Statutory records for LOA, PO, GeM custom bids, and Performance Bank Guarantees (PBG).
- `Project` & `ProjectMilestone`: 12-stage project execution tracking with health statuses, milestone dependencies, and SLA records.
- `AuditLog`: Immutable vigilance audit trail capturing IP addresses, timestamps, prior values, and outcome results.

### 3. Quickstart with Docker Compose

To boot up the PostgreSQL database, Redis, and Django Backend with a single command:

```bash
cd backend_django
docker-compose up --build -d
```

Run database migrations:
```bash
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

Create an NMDC Superuser:
```bash
docker-compose exec backend python manage.py createsuperuser
```

The Django REST API is accessible at:
- API Root: `http://localhost:8000/api/`
- Problem Statements: `http://localhost:8000/api/problems/`
- Vendor Directory: `http://localhost:8000/api/vendors/`
- Proposals & Costing: `http://localhost:8000/api/proposals/`
- PoC Trials: `http://localhost:8000/api/pocs/`
- Awards & Contracts: `http://localhost:8000/api/awards/`
- 12-Stage Projects: `http://localhost:8000/api/projects/`
- Vigilance Audit: `http://localhost:8000/api/audit/`
- Django Admin: `http://localhost:8000/admin/`

### 4. Zero-AI Principle
In strict adherence to the MASTER DEVELOPMENT PROMPT, this backend contains **zero AI, zero Gemini SDK, zero machine learning models, and zero automated synthetic reviews**. All evaluations, approvals, and decisions are executed deterministically through human committee workflows and verified authority credentials.
