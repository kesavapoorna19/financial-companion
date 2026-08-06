"""Python enums mirroring the PostgreSQL enum types created in schema.sql.

Member values equal the database values (lowercase), so values round-trip
cleanly between the API, Pydantic, and the database. The ``str`` mixin makes
them JSON-serializable out of the box.
"""

import enum


class UserRole(str, enum.Enum):
    student = "student"
    employee = "employee"
    freelancer = "freelancer"
    investor = "investor"
    shop_owner = "shop_owner"


class CategoryType(str, enum.Enum):
    income = "income"
    expense = "expense"
    both = "both"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    bank_transfer = "bank_transfer"
    upi = "upi"
    card = "card"
    cheque = "cheque"
    other = "other"


class RecurringFrequency(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


class GoalStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    archived = "archived"


class ProjectStatus(str, enum.Enum):
    active = "active"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    partial = "partial"
    paid = "paid"


class InvestmentType(str, enum.Enum):
    stocks = "stocks"
    mutual_funds = "mutual_funds"
    fixed_deposits = "fixed_deposits"
    gold = "gold"
    crypto = "crypto"
    real_estate = "real_estate"
    other = "other"


class RiskTolerance(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class EmiStatus(str, enum.Enum):
    active = "active"
    closed = "closed"
