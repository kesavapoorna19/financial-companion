-- =============================================================================
-- Financial Companion — PostgreSQL Schema (Phase 1)
-- Engine: PostgreSQL 16+
-- Conventions: UUID PKs, timestamps everywhere, soft delete (deleted_at),
--              NUMERIC(14,2) money, multi-currency via currency_code.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('student', 'employee', 'freelancer', 'investor', 'shop_owner');
CREATE TYPE category_type AS ENUM ('income', 'expense', 'both');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other');
CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE project_status AS ENUM ('active', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE investment_type AS ENUM ('stocks', 'mutual_funds', 'fixed_deposits', 'gold', 'crypto', 'real_estate', 'other');
CREATE TYPE risk_tolerance AS ENUM ('low', 'medium', 'high');
CREATE TYPE emi_status AS ENUM ('active', 'closed');

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role NOT NULL,
    avatar_url    VARCHAR(500),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- USER SETTINGS (1:1)
-- ---------------------------------------------------------------------------
CREATE TABLE user_settings (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    currency_code         VARCHAR(3) NOT NULL DEFAULT 'INR',
    theme                 VARCHAR(10) NOT NULL DEFAULT 'light'
                          CHECK (theme IN ('light', 'dark')),
    monthly_income_budget NUMERIC(14,2) CHECK (monthly_income_budget IS NULL OR monthly_income_budget >= 0),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- CATEGORIES (defaults seeded with user_id = NULL)
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,          -- NULL = system default
    name       VARCHAR(60) NOT NULL,
    type       category_type NOT NULL DEFAULT 'both',
    icon       VARCHAR(60),
    color      VARCHAR(9),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (user_id, name)  -- PostgreSQL allows multiple NULLs in unique index
);

-- ---------------------------------------------------------------------------
-- INCOMES
-- ---------------------------------------------------------------------------
CREATE TABLE incomes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
    title          VARCHAR(120) NOT NULL,
    amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency_code  VARCHAR(3) NOT NULL DEFAULT 'INR',
    income_date    DATE NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'cash',
    notes          TEXT,
    attachment_url VARCHAR(500),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- EXPENSES
-- ---------------------------------------------------------------------------
CREATE TABLE expenses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    title               VARCHAR(120) NOT NULL,
    amount              NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency_code       VARCHAR(3) NOT NULL DEFAULT 'INR',
    expense_date        DATE NOT NULL,
    payment_method      payment_method NOT NULL DEFAULT 'cash',
    merchant            VARCHAR(120),
    notes               TEXT,
    is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_frequency recurring_frequency,
    next_due_date       DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT chk_recurring_consistent CHECK (
        (is_recurring AND recurring_frequency IS NOT NULL) OR
        (NOT is_recurring)
    )
);

-- ---------------------------------------------------------------------------
-- SAVINGS GOALS + CONTRIBUTIONS
-- ---------------------------------------------------------------------------
CREATE TABLE savings_goals (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(120) NOT NULL,
    target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    target_date   DATE,
    status        goal_status NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);

CREATE TABLE savings_contributions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id           UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    amount            NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    contribution_date DATE NOT NULL,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- STUDENT
-- ---------------------------------------------------------------------------
CREATE TABLE student_profiles (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    college_name             VARCHAR(120),
    course                   VARCHAR(120),
    year_of_study            SMALLINT CHECK (year_of_study BETWEEN 1 AND 8),
    monthly_pocket_money     NUMERIC(14,2) DEFAULT 0 CHECK (monthly_pocket_money >= 0),
    part_time_income         NUMERIC(14,2) DEFAULT 0 CHECK (part_time_income >= 0),
    monthly_college_expenses NUMERIC(14,2) DEFAULT 0 CHECK (monthly_college_expenses >= 0),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- EMPLOYEE
-- ---------------------------------------------------------------------------
CREATE TABLE employee_profiles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employer_name VARCHAR(120),
    designation   VARCHAR(120),
    monthly_salary NUMERIC(14,2) DEFAULT 0 CHECK (monthly_salary >= 0),
    salary_day    SMALLINT CHECK (salary_day IS NULL OR salary_day BETWEEN 1 AND 31),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE emis (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                VARCHAR(120) NOT NULL,          -- e.g. 'Bike loan', 'Home loan'
    lender              VARCHAR(120),
    total_amount        NUMERIC(14,2) NOT NULL CHECK (total_amount > 0),
    monthly_installment NUMERIC(14,2) NOT NULL CHECK (monthly_installment > 0),
    months_paid         INT NOT NULL DEFAULT 0 CHECK (months_paid >= 0),
    remaining_balance   NUMERIC(14,2) NOT NULL,
    interest_rate       NUMERIC(6,2) DEFAULT 0,
    start_date          DATE,
    end_date            DATE,
    status              emi_status NOT NULL DEFAULT 'active',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT chk_remaining_nonneg CHECK (remaining_balance >= 0)
);

CREATE TABLE salary_history (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount        NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    salary_month  DATE NOT NULL,          -- first of the month it covers
    received_date DATE,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, salary_month)
);

-- ---------------------------------------------------------------------------
-- FREELANCER
-- ---------------------------------------------------------------------------
CREATE TABLE freelancer_profiles (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    skills       TEXT,
    hourly_rate  NUMERIC(14,2) DEFAULT 0 CHECK (hourly_rate >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clients (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(120) NOT NULL,
    email      VARCHAR(255),
    phone      VARCHAR(30),
    company    VARCHAR(120),
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
    title       VARCHAR(120) NOT NULL,
    description TEXT,
    budget      NUMERIC(14,2) CHECK (budget IS NULL OR budget > 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    status      project_status NOT NULL DEFAULT 'active',
    start_date  DATE,
    end_date    DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE project_payments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'INR',
    status       payment_status NOT NULL DEFAULT 'pending',
    payment_date DATE,
    method       payment_method,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INVESTOR
-- ---------------------------------------------------------------------------
CREATE TABLE investor_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    risk_tolerance  risk_tolerance NOT NULL DEFAULT 'medium',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE investments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(120) NOT NULL,
    type           investment_type NOT NULL DEFAULT 'stocks',
    invested_amount NUMERIC(14,2) NOT NULL CHECK (invested_amount >= 0),
    current_value  NUMERIC(14,2) NOT NULL CHECK (current_value >= 0),
    currency_code  VARCHAR(3) NOT NULL DEFAULT 'INR',
    purchase_date  DATE,
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ
);

CREATE TABLE dividends (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id  UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    currency_code  VARCHAR(3) NOT NULL DEFAULT 'INR',
    dividend_date  DATE NOT NULL,
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- SMALL SHOP OWNER (simple words: customers, not debtors)
-- ---------------------------------------------------------------------------
CREATE TABLE shop_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    shop_name       VARCHAR(120),
    business_type   VARCHAR(120),
    address         TEXT,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE customers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(120) NOT NULL,
    phone      VARCHAR(30),
    email      VARCHAR(255),
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE sales (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id    UUID REFERENCES customers(id) ON DELETE SET NULL,
    product_name   VARCHAR(120) NOT NULL,
    quantity       NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price     NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    total          NUMERIC(14,2) NOT NULL CHECK (total >= 0),
    currency_code  VARCHAR(3) NOT NULL DEFAULT 'INR',
    sale_date      DATE NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'cash',
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ,
    CONSTRAINT chk_total_matches CHECK (total = quantity * unit_price)
);

CREATE TABLE purchases (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name   VARCHAR(120) NOT NULL,
    quantity       NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price     NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    total          NUMERIC(14,2) NOT NULL CHECK (total >= 0),
    currency_code  VARCHAR(3) NOT NULL DEFAULT 'INR',
    purchase_date  DATE NOT NULL,
    supplier       VARCHAR(120),
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ,
    CONSTRAINT chk_total_matches CHECK (total = quantity * unit_price)
);

-- ---------------------------------------------------------------------------
-- INDEXES (hot query paths)
-- ---------------------------------------------------------------------------
CREATE INDEX idx_incomes_user_date        ON incomes (user_id, income_date DESC);
CREATE INDEX idx_incomes_category         ON incomes (category_id);
CREATE INDEX idx_expenses_user_date       ON expenses (user_id, expense_date DESC);
CREATE INDEX idx_expenses_category        ON expenses (category_id);
CREATE INDEX idx_expenses_recurring_due   ON expenses (user_id) WHERE is_recurring;
CREATE INDEX idx_goals_user               ON savings_goals (user_id);
CREATE INDEX idx_contributions_goal       ON savings_contributions (goal_id);
CREATE INDEX idx_categories_user          ON categories (user_id);
CREATE INDEX idx_emis_user                ON emis (user_id);
CREATE INDEX idx_salary_history_user      ON salary_history (user_id, salary_month DESC);
CREATE INDEX idx_clients_user             ON clients (user_id);
CREATE INDEX idx_projects_client          ON projects (client_id);
CREATE INDEX idx_projects_user            ON projects (user_id);
CREATE INDEX idx_project_payments_project ON project_payments (project_id);
CREATE INDEX idx_investments_user         ON investments (user_id);
CREATE INDEX idx_dividends_investment     ON dividends (investment_id);
CREATE INDEX idx_customers_user           ON customers (user_id);
CREATE INDEX idx_sales_user_date          ON sales (user_id, sale_date DESC);
CREATE INDEX idx_sales_customer           ON sales (customer_id);
CREATE INDEX idx_purchases_user_date      ON purchases (user_id, purchase_date DESC);

-- ---------------------------------------------------------------------------
-- TRIGGER: keep updated_at fresh on all tables
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users', 'user_settings', 'categories', 'incomes', 'expenses',
                             'savings_goals', 'student_profiles', 'employee_profiles', 'emis',
                             'salary_history', 'freelancer_profiles', 'clients', 'projects',
                             'investor_profiles', 'investments', 'shop_profiles', 'customers',
                             'sales', 'purchases']
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
            t, t
        );
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- SEED: default categories (user_id = NULL → shared by everyone)
-- ---------------------------------------------------------------------------
INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES
    (NULL, 'Food',           'expense', 'utensils',   '#f97316', TRUE),
    (NULL, 'Travel',         'expense', 'plane',      '#3b82f6', TRUE),
    (NULL, 'Entertainment',  'expense', 'film',       '#a855f7', TRUE),
    (NULL, 'Education',      'expense', 'book',       '#14b8a6', TRUE),
    (NULL, 'Medical',        'expense', 'heart-pulse','#ef4444', TRUE),
    (NULL, 'Shopping',       'expense', 'shopping-bag','#ec4899', TRUE),
    (NULL, 'Bills',          'expense', 'receipt',    '#eab308', TRUE),
    (NULL, 'Salary',         'income',  'banknote',   '#22c55e', TRUE),
    (NULL, 'Investment',     'both',    'trending-up','#06b6d4', TRUE),
    (NULL, 'Business',       'both',    'briefcase',  '#6366f1', TRUE),
    (NULL, 'Charity',        'expense', 'heart',      '#fb7185', TRUE),
    (NULL, 'Other',          'both',    'ellipsis',   '#64748b', TRUE);

COMMIT;
