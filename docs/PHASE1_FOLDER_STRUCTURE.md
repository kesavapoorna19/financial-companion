# Financial Companion — Folder Structure (Phase 1)

This document defines the **target** folder structure. Folders are created as their phase lands — this is the map we build toward.

## Top Level

```
FINANCIAL COMPANION/
├── README.md                  # Project overview, phase tracker
├── .gitignore
├── .env.example               # All environment variables (backend + db)
├── docker-compose.yml         # PostgreSQL + backend + frontend (Phase 11)
├── docs/                      # Design documentation
│   ├── PHASE1_FOLDER_STRUCTURE.md
│   ├── DATABASE_DESIGN.md
│   └── wireframes/            # HTML UI mockups
│       ├── dashboard.html
│       └── auth.html
├── backend/                   # FastAPI application
└── frontend/                  # React + Vite application
```

---

## Backend — FastAPI (`backend/`)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app entrypoint, CORS, routers, startup
│   │
│   ├── core/                       # Cross-cutting infrastructure
│   │   ├── __init__.py
│   │   ├── config.py               # Pydantic-settings: env vars, DB URL, JWT keys
│   │   ├── database.py             # SQLAlchemy engine, SessionLocal, Base, get_db
│   │   ├── security.py             # Password hashing, JWT create/verify
│   │   ├── logging.py              # Structured logging setup
│   │   └── exceptions.py           # App-level exception classes + handlers
│   │
│   ├── models/                     # SQLAlchemy ORM models (1 file per domain)
│   │   ├── __init__.py             # Aggregates all models for Alembic
│   │   ├── user.py                 # User + settings (role, currency, theme)
│   │   ├── category.py             # Default + custom categories
│   │   ├── transaction.py          # Income + Expense (single shared base)
│   │   ├── savings_goal.py         # Savings goals + contributions
│   │   ├── student.py              # Student profile
│   │   ├── employee.py             # Employee profile, EMIs, salary history
│   │   ├── freelancer.py           # Freelancer profile, clients, projects, payments
│   │   ├── investor.py             # Investor profile, investments, dividends
│   │   └── shop.py                 # Shop profile, sales, purchases, customers
│   │
│   ├── schemas/                    # Pydantic schemas (request / response)
│   │   ├── __init__.py
│   │   ├── auth.py                 # Register, Login, Token
│   │   ├── user.py                 # User read/update, profile
│   │   ├── category.py
│   │   ├── transaction.py          # IncomeCreate/Update, ExpenseCreate/Update
│   │   ├── savings_goal.py
│   │   └── role_modules.py         # Student/Employee/Freelancer/Investor/Shop DTOs
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                 # get_db, get_current_user, role guard
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py           # Aggregates all v1 endpoints
│   │       └── endpoints/
│   │           ├── auth.py         # /auth/register, /auth/login, /auth/me
│   │           ├── users.py        # profile read/update, logout
│   │           ├── categories.py
│   │           ├── income.py
│   │           ├── expenses.py
│   │           ├── savings.py
│   │           ├── dashboard.py    # aggregated stats for the dashboard
│   │           ├── reports.py      # weekly/monthly/yearly, profit/loss, exports
│   │           ├── student.py
│   │           ├── employee.py
│   │           ├── freelancer.py
│   │           ├── investor.py
│   │           └── shop.py
│   │
│   ├── services/                   # Business logic (keeps endpoints thin)
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── transaction_service.py
│   │   ├── report_service.py       # Aggregations + PDF/CSV generation
│   │   ├── insights_service.py     # Rule-based insights (AI-ready)
│   │   └── role_service.py         # Role-specific helpers
│   │
│   ├── crud/                       # Database operations per model
│   │   ├── __init__.py
│   │   ├── base.py                 # Generic CRUDBase
│   │   ├── user.py
│   │   ├── category.py
│   │   ├── transaction.py
│   │   ├── savings.py
│   │   └── role_modules.py
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── money.py                # Currency formatting helpers
│   │   ├── csv_export.py
│   │   ├── pdf_export.py
│   │   └── pagination.py
│   │
│   └── seed/
│       ├── __init__.py
│       └── seed_data.py            # Default categories for each role
│
├── alembic/                        # DB migrations (Phase 2)
│   ├── env.py
│   └── versions/
│
├── tests/                          # Phase 10
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_transactions.py
│   ├── test_reports.py
│   └── test_roles.py
│
├── requirements.txt
├── Dockerfile                      # Phase 11
└── .env.example                    # Backend env vars
```

### Backend design principles

- **Clean architecture**: `api/` (routes) → `services/` (logic) → `crud/` (data access) → `models/` (DB). No business logic in endpoints.
- **Thin endpoints**: routes validate with Pydantic schemas, call a service, return the result.
- **Soft delete**: deleted rows keep a `deleted_at` timestamp and are filtered out of queries.
- **Role guard**: a dependency that rejects users without the required role for role-specific endpoints.

---

## Frontend — React + Vite (`frontend/`)

```
frontend/
├── index.html
├── package.json
├── vite.config.js                 # Proxy /api → backend
├── tailwind.config.js             # Dark mode config, theme tokens
├── postcss.config.js
├── .env.example                   # VITE_API_URL
├── public/
│   └── favicon.svg
│
└── src/
    ├── main.jsx                   # React root, providers
    ├── App.jsx                    # Router setup, protected routes
    ├── index.css                  # Tailwind base + custom tokens
    │
    ├── assets/                    # Logo, illustrations, static images
    ├── styles/                    # Extra CSS (charts, print styles)
    │
    ├── context/                   # Context API stores
    │   ├── AuthContext.jsx        # user, token, login/logout/register
    │   ├── ThemeContext.jsx       # light/dark mode
    │   ├── CurrencyContext.jsx    # display currency + formatting
    │   └── ToastContext.jsx       # success/error notifications
    │
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useTheme.js
    │   ├── useCurrency.js
    │   ├── useTransactions.js     # fetch/search/filter income + expenses
    │   ├── useBudget.js
    │   └── useLocalStorage.js
    │
    ├── services/                  # Axios API layer
    │   ├── apiClient.js           # axios instance + JWT interceptor
    │   ├── authService.js
    │   ├── transactionService.js
    │   ├── categoryService.js
    │   ├── savingsService.js
    │   ├── reportService.js
    │   └── roleService.js
    │
    ├── utils/
    │   ├── formatters.js          # currency + date formatting (multi-currency)
    │   ├── validators.js
    │   └── exportHelpers.js       # trigger CSV/PDF downloads
    │
    ├── layouts/
    │   └── DashboardLayout.jsx    # Sidebar + topbar + content outlet
    │
    ├── components/
    │   ├── ui/                    # Reusable building blocks
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Input.jsx
    │   │   ├── Select.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Badge.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── ConfirmDialog.jsx
    │   │   └── Spinner.jsx
    │   ├── layout/                # App chrome
    │   │   ├── Sidebar.jsx
    │   │   ├── Topbar.jsx
    │   │   ├── ThemeToggle.jsx
    │   │   └── UserMenu.jsx
    │   ├── dashboard/             # Dashboard widgets
    │   │   ├── StatCard.jsx
    │   │   ├── MonthlySummary.jsx
    │   │   ├── ExpenseBreakdown.jsx   # doughnut chart
    │   │   ├── IncomeBreakdown.jsx
    │   │   ├── CashflowChart.jsx      # line/bar chart
    │   │   ├── RecentTransactions.jsx
    │   │   ├── CalendarView.jsx
    │   │   ├── InsightsPanel.jsx
    │   │   └── QuickActions.jsx
    │   ├── transactions/
    │   │   ├── TransactionForm.jsx    # shared income/expense form
    │   │   ├── TransactionList.jsx
    │   │   ├── TransactionFilters.jsx # date/category/amount/method
    │   │   ├── NotesEditor.jsx
    │   │   └── RecurringToggle.jsx
    │   ├── savings/
    │   │   ├── GoalCard.jsx
    │   │   └── GoalForm.jsx
    │   ├── reports/
    │   │   ├── ReportFilters.jsx
    │   │   ├── ReportTable.jsx
    │   │   └── ExportButtons.jsx     # PDF + CSV
    │   └── role/                  # Role-specific widgets
    │       ├── StudentWidgets.jsx
    │       ├── EmployeeWidgets.jsx
    │       ├── FreelancerWidgets.jsx
    │       ├── InvestorWidgets.jsx
    │       └── ShopWidgets.jsx
    │
    └── pages/
        ├── Landing.jsx            # Public landing page
        ├── auth/
        │   ├── Login.jsx
        │   └── Register.jsx       # role selection during signup
        ├── Dashboard.jsx
        ├── Income.jsx
        ├── Expenses.jsx
        ├── SavingsGoals.jsx
        ├── Reports.jsx
        ├── role/
        │   ├── Student.jsx
        │   ├── Employee.jsx
        │   ├── Freelancer.jsx
        │   ├── Investor.jsx
        │   └── Shop.jsx
        ├── Profile.jsx
        ├── Settings.jsx           # currency, theme, categories
        └── NotFound.jsx
```

### Frontend design principles

- **Context API** for global state (auth, theme, currency, toasts) — no Redux.
- **Reusable UI kit** in `components/ui/` — buttons, cards, inputs, modals used everywhere.
- **Protected routes** — pages behind a `ProtectedRoute` wrapper; role pages behind role guards.
- **One API layer** — all requests go through `apiClient` with the JWT attached automatically.
- **Multi-currency** — `CurrencyContext` drives all formatting; transactions keep their own currency.

---

## Environment Variables (`.env.example`)

```env
# --- Database ---
POSTGRES_USER=financial
POSTGRES_PASSWORD=change-me
POSTGRES_DB=financial_companion
DATABASE_URL=postgresql+psycopg://financial:change-me@localhost:5432/financial_companion

# --- Auth ---
JWT_SECRET=super-secret-change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# --- App ---
BACKEND_CORS_ORIGINS=http://localhost:5173
FRONTEND_API_URL=http://localhost:8000/api/v1
```

---

## Where each phase lands

| Phase | Files created |
| --- | --- |
| 2 — Backend setup | `backend/app/main.py`, `core/*`, `models/*`, `schemas/*`, `alembic/`, `requirements.txt` |
| 3 — Frontend setup | `frontend/` Vite scaffold, Tailwind, router, `layouts/`, `components/ui/`, context stores |
| 4 — Auth | `api/v1/endpoints/auth.py`, `users.py`, `services/auth_service.py`, `pages/auth/*`, `AuthContext.jsx` |
| 5 — Dashboard | `api/v1/endpoints/dashboard.py`, `pages/Dashboard.jsx`, `components/dashboard/*` |
| 6 — Income | `endpoints/income.py`, `pages/Income.jsx`, `components/transactions/*` |
| 7 — Expenses | `endpoints/expenses.py`, `pages/Expenses.jsx`, recurring expense support |
| 8 — Notes | `NotesEditor.jsx`, notes fields wired everywhere |
| 9 — Reports | `endpoints/reports.py`, `services/report_service.py`, PDF/CSV export, `pages/Reports.jsx` |
| 10 — Testing | `backend/tests/*`, frontend test setup |
| 11 — Deployment | `docker-compose.yml`, Dockerfiles, `.env` docs |
