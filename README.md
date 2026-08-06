# Financial Companion

> Your money, managed simply. One place for income, expenses, savings, investments, and shop records — built for everyone, not just businesses.

Financial Companion is a production-ready personal finance platform. Whether you're a student, an employee, a freelancer, an investor, or a small shop owner, the app adapts to your world and helps you understand where your money goes.

## Why this product?

Most finance apps are built for accountants. Financial Companion is built for **people** — using simple, everyday words (like *customer*, not *debtor*) and a clean interface anyone can use.

## Core Features

| Module | What it does |
| --- | --- |
| **Dashboard** | Welcome message, income, expenses, balance, charts, calendar, recent activity, quick actions, insights |
| **Income** | Add / edit / delete / search / filter income entries with notes |
| **Expenses** | Add / edit / delete / search / filter expenses, recurring expenses, notes |
| **Savings Goals** | Set a goal (emergency fund, vacation), add money to it, watch progress |
| **Notes** | Every income and expense record has a notes section |
| **Reports** | Monthly / weekly / yearly, income, expense, profit & loss — export to PDF & CSV |
| **Role Modules** | Student, Employee, Freelancer, Investor, Small Shop Owner — each with its own tools |
| **Multi-currency** | Pick a currency; every transaction remembers its own currency |
| **Auth** | Register, login, JWT, profile editing, secure password hashing |

## Tech Stack

**Frontend** — React, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Chart.js, Context API (state), dark & light mode.

**Backend** — Python, FastAPI, SQLAlchemy, Pydantic, JWT auth, PostgreSQL, structured logging, error handling.

**Infra** — Docker-ready, environment variables, clean architecture, REST API.

## Project Phases

| Phase | Deliverable | Status |
| --- | --- | --- |
| 1 | Folder structure, database design, UI wireframes | ✅ Done |
| 2 | Backend setup (FastAPI skeleton, config, database) | ✅ Done |
| 3 | Frontend setup (Vite, Tailwind, routing, layout) | ✅ Done |
| 4 | Authentication (register / login / JWT / profile) | ✅ Done |
| 5 | Dashboard | ✅ Done |
| — | **Financial Data Export** (added) | ✅ PDF + CSV download by month |
| 6 | Income module | ✅ Done |
| 7 | Expense module | ✅ Done |
| 8 | Notes module | ✅ Done |
| 9 | Reports (weekly/yearly/profit-loss) | ✅ Done |
| 10 | Testing | ✅ 30 pytest tests |
| 11 | Deployment | ✅ Full Docker stack |

## Repository Layout

```
FINANCIAL COMPANION/
├── backend/            # FastAPI application
├── frontend/           # React + Vite application
├── docs/               # Design docs, database design, wireframes
├── docker-compose.yml  # PostgreSQL + app services (Phase 11)
├── .env.example        # Environment variables template
└── README.md
```

See [`docs/PHASE1_FOLDER_STRUCTURE.md`](docs/PHASE1_FOLDER_STRUCTURE.md) for the full tree, [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) for the database, and [`docs/wireframes/`](docs/wireframes/) for the UI mockups.

## How to Run

### 🐳 Full stack (recommended — Docker)

```bash
# 1. Create environment file
cp .env.example .env        # then edit JWT_SECRET with a long random string!

# 2. Build and start everything (db + backend + frontend)
docker compose up -d --build

# 3. Open the app
#    Frontend  → http://localhost
#    API docs  → http://localhost/api/v1/docs
```

The database schema and default categories are applied automatically on first boot. Stop everything with `docker compose down` (add `-v` to wipe data too).

### 🧪 Run the backend tests

```bash
docker compose up -d db
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest -v
```

The suite creates a dedicated `financial_companion_test` database automatically (30 tests).

### 🛠️ Development mode (without Docker)

```bash
# Terminal 1 — database
docker compose up -d db

# Terminal 2 — backend (http://localhost:8000)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 3 — frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

### 📖 Reference docs

- `docs/DATABASE_DESIGN.md` — schema, indexes, triggers
- `docs/PHASE1_FOLDER_STRUCTURE.md` — full file tree
- `docs/wireframes/` — UI mockups (open the HTML files in a browser)

---
Built phase by phase. Every phase is reviewed and approved before the next one starts.
