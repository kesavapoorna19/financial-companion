# Financial Companion — Database Design (Phase 1)

**Engine:** PostgreSQL 16 · **Primary keys:** `UUID` · **Timestamps:** every table gets `created_at` and `updated_at` · **Soft delete:** every user-owned table gets `deleted_at` (filtered from all queries; nothing is hard-deleted).

All money is stored as `NUMERIC(14,2)` (avoids the floating-point rounding bugs you get with FLOAT). Because the app is **multi-currency**, every transaction records the `currency_code` it was entered in. The user's *display* currency lives on the user record; reports group amounts by currency. No live FX conversion in Phase 1 (kept intentionally simple — a currency table still lets us add it later).

---

## Design Goals

1. **Normalized** — no duplicated data; each fact lives in one place.
2. **Role-ready** — a shared `users` table plus focused tables per role, so a student's data never mixes with a shop owner's.
3. **Multi-currency** — `currency_code` on every money row.
4. **Future-proof** — soft delete, timestamps, and a seed of default categories for each role.
5. **Simple English** — table names stay clear; app copy (not the DB) uses everyday words like *customer*.

---

## Entity Relationship Overview

```
users ──┬── user_settings (1:1)
        ├── categories (1:N)          ── default categories are user_id = NULL
        ├── incomes (1:N)
        ├── expenses (1:N)
        ├── savings_goals (1:N) ──── savings_contributions (1:N)
        ├── budgets (1:N) ............ [phase-9 add-on, reserved]
        │
        ├── student_profiles (1:1)
        ├── employee_profiles (1:1) ── emis (1:N)
        │                          └─ salary_history (1:N)
        ├── freelancer_profiles (1:1) ─ clients (1:N) ── projects (1:N) ── project_payments (1:N)
        ├── investor_profiles (1:1) ── investments (1:N) ── dividends (1:N)
        └── shop_profiles (1:1) ──── customers (1:N) ── sales (1:N)
                                └─ purchases (1:N)

categories <── incomes.category_id
categories <── expenses.category_id
```

Every money record (income, expense, sale, purchase, investment, dividend, EMI payment, project payment) belongs to exactly one user and is filtered through that user's `id` — there is no cross-user data leakage.

---

## Table Details

### 1. `users`

Core identity row for every account.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | default `gen_random_uuid()` |
| `full_name` | VARCHAR(120) | required |
| `email` | VARCHAR(255) UNIQUE NOT NULL | lowercased at write time |
| `password_hash` | VARCHAR(255) | bcrypt hash, never plain text |
| `role` | ENUM | `student` · `employee` · `freelancer` · `investor` · `shop_owner` |
| `avatar_url` | VARCHAR(500) | nullable |
| `is_active` | BOOLEAN | default `true` |
| `created_at` | TIMESTAMPTZ | default now |
| `updated_at` | TIMESTAMPTZ | auto-updated |
| `deleted_at` | TIMESTAMPTZ | NULL = active (soft delete) |

> Only one role per user, chosen at registration. The dashboard and available features adapt to it.

### 2. `user_settings`

1:1 with users — preferences the app needs on every screen.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID FK UNIQUE → users | one settings row per user |
| `currency_code` | VARCHAR(3) | default `INR` — the *display* currency |
| `theme` | VARCHAR(10) | `light` / `dark` (default `light`) |
| `monthly_income_budget` | NUMERIC(14,2) | optional headline budget |
| `created_at` / `updated_at` | | |

### 3. `categories`

Income/expense groupings. **Default categories** are seeded with `user_id = NULL` and shared by everyone; users can also create **custom** ones (with their `user_id` set).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID FK → users | NULL = system default category |
| `name` | VARCHAR(60) | e.g. Food, Travel, Salary, Business |
| `type` | ENUM | `income` / `expense` / `both` |
| `icon` | VARCHAR(60) | icon key used by frontend |
| `color` | VARCHAR(9) | hex color for charts |
| `is_default` | BOOLEAN | true for seeded rows |
| `created_at` / `updated_at` / `deleted_at` | | |

Default seeds (all roles get these): Food, Travel, Entertainment, Education, Medical, Shopping, Bills, Salary, Investment, Business, Charity, Other.

### 4. `incomes`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID FK NOT NULL → users | indexed |
| `category_id` | UUID FK → categories | |
| `title` | VARCHAR(120) | |
| `amount` | NUMERIC(14,2) | > 0 |
| `currency_code` | VARCHAR(3) | currency this income was received in |
| `income_date` | DATE | |
| `payment_method` | ENUM | `cash` · `bank_transfer` · `upi` · `card` · `cheque` · `other` |
| `notes` | TEXT | free-form notes — the Notes module lives here |
| `attachment_url` | VARCHAR(500) | future-ready file attachment |
| `created_at` / `updated_at` / `deleted_at` | | |

### 5. `expenses`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID FK NOT NULL → users | indexed |
| `category_id` | UUID FK → categories | |
| `title` | VARCHAR(120) | |
| `amount` | NUMERIC(14,2) | > 0 |
| `currency_code` | VARCHAR(3) | |
| `expense_date` | DATE | |
| `payment_method` | ENUM | same as incomes |
| `merchant` | VARCHAR(120) | where the money went |
| `notes` | TEXT | Notes module |
| `is_recurring` | BOOLEAN | default false |
| `recurring_frequency` | ENUM NULL | `daily` · `weekly` · `monthly` · `yearly` |
| `next_due_date` | DATE NULL | used by the recurring scheduler |
| `created_at` / `updated_at` / `deleted_at` | | |

### 6. `savings_goals`

Added per your request. Users set a target and add money over time.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `user_id` | UUID FK → users | |
| `name` | VARCHAR(120) | e.g. Emergency fund, Vacation |
| `target_amount` | NUMERIC(14,2) | |
| `currency_code` | VARCHAR(3) | |
| `target_date` | DATE NULL | |
| `status` | ENUM | `active` · `completed` · `archived` |
| `created_at` / `updated_at` / `deleted_at` | | |

`current_amount` is **not stored** — it is always the SUM of `savings_contributions.amount`, so it can never drift out of sync.

### 7. `savings_contributions`

Money added toward a goal.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID PK | |
| `goal_id` | UUID FK → savings_goals | indexed |
| `amount` | NUMERIC(14,2) | |
| `contribution_date` | DATE | |
| `notes` | TEXT | |
| `created_at` / `updated_at` | | |

---

## Role-Specific Tables

### Student (`student_profiles`)

| Column | Notes |
| --- | --- |
| `id`, `user_id` FK UNIQUE, `college_name`, `course`, `year_of_study` | 1:1 with users |
| `monthly_pocket_money` NUMERIC | pocket money tracking |
| `part_time_income` NUMERIC | per-month part-time earning |
| `monthly_college_expenses` NUMERIC | rough budget for fees/mess/travel |

Student savings tracking reuses `savings_goals` — no duplicate table.

### Employee (`employee_profiles`, `emis`, `salary_history`)

**`employee_profiles`** — `employer_name`, `designation`, `monthly_salary` (NUMERIC), `salary_day` (SMALLINT, e.g. 1 = 1st of month).

**`emis`** — loan/EMI tracking: `name` (e.g. Bike loan), `lender`, `total_amount`, `monthly_installment`, `months_paid` (INT), `remaining_balance`, `interest_rate` (NUMERIC), `start_date`, `end_date`, `status` (`active`/`closed`), `notes`.

**`salary_history`** — every salary received: `amount`, `currency_code`, `salary_month` (DATE, first of month), `received_date`, `notes`.

### Freelancer (`freelancer_profiles`, `clients`, `projects`, `project_payments`)

**`freelancer_profiles`** — `skills` (TEXT), `hourly_rate` (NUMERIC), `currency_code`.

**`clients`** — `name`, `email`, `phone`, `company`, `notes`.

**`projects`** — `client_id` FK, `title`, `description`, `budget` NUMERIC, `currency_code`, `status` (`active`/`in_progress`/`completed`/`cancelled`), `start_date`, `end_date`.

**`project_payments`** — `project_id` FK, `amount`, `currency_code`, `status` (`pending`/`partial`/`paid`), `payment_date`, `method`, `notes`. Payment status is exactly what the spec asks for.

### Investor (`investor_profiles`, `investments`, `dividends`)

**`investor_profiles`** — `risk_tolerance` (`low`/`medium`/`high`), `notes`.

**`investments`** — `name`, `type` (`stocks`/`mutual_funds`/`fixed_deposits`/`gold`/`crypto`/`real_estate`/`other`), `invested_amount` NUMERIC, `current_value` NUMERIC, `currency_code`, `purchase_date`, `notes`. Profit/loss = `current_value − invested_amount` (computed, not stored).

**`dividends`** — `investment_id` FK, `amount`, `currency_code`, `dividend_date`, `notes`.

### Small Shop Owner (`shop_profiles`, `customers`, `sales`, `purchases`)

Per your note: the app uses **simple, everyday words** — a customer is a `customer`, not a debtor.

**`shop_profiles`** — `shop_name`, `business_type`, `address`, `default_currency`.

**`customers`** — `name`, `phone`, `email`, `notes` (customer notes per spec — e.g. *"Prefers Sundays, buys on credit, usually pays in a week"*).

**`sales`** — `customer_id` FK NULL, `product_name`, `quantity` (NUMERIC), `unit_price` NUMERIC, `total` NUMERIC, `currency_code`, `sale_date`, `payment_method`, `notes`. `total` is stored (fast reporting) but validated against quantity × unit_price on write.

**`purchases`** — `product_name`, `quantity`, `unit_price`, `total`, `currency_code`, `purchase_date`, `supplier`, `notes`. No inventory management, per spec.

---

## Conventions

| Rule | Detail |
| --- | --- |
| UUIDs | All PKs use `gen_random_uuid()` (PG13+ built-in) |
| Timestamps | `created_at`/`updated_at` everywhere; updated via trigger |
| Soft delete | `deleted_at` on user-owned tables; queries filter `WHERE deleted_at IS NULL` |
| Money | `NUMERIC(14,2)` + `currency_code`; no floats |
| Indexes | `user_id`, `category_id`, `income_date`, `expense_date`, `created_at` on all high-traffic columns |
| Enums | Native PG enums for roles, payment methods, recurring frequency, statuses |
| Uniqueness | `email`, `user_settings.user_id`, `(user_id, name)` for custom categories |
| Constraints | CHECK `amount > 0` on every money column |

## Reports mapping

| Report | Where it comes from |
| --- | --- |
| Weekly / Monthly / Yearly | SUM of `incomes` + `expenses` grouped by `income_date`/`expense_date` within the period |
| Income report | `incomes` filtered + grouped by category |
| Expense report | `expenses` filtered + grouped by category |
| Profit/Loss | `(income total) − (expense total)`; for shop owners `(sales) − (purchases + expenses)` |

## Next steps for Phase 2

- Generate the full `schema.sql` migration (already provided below).
- Wire `alembic` migrations on top.
- Seed default categories per role in `app/seed/seed_data.py`.
