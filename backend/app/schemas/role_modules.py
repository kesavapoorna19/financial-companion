"""Schemas for role-specific modules: student, employee, freelancer,
investor, and small shop owner."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    EmiStatus,
    InvestmentType,
    PaymentMethod,
    PaymentStatus,
    ProjectStatus,
    RiskTolerance,
)


# ---------------------------------------------------------------------------
# Student
# ---------------------------------------------------------------------------
class StudentProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    college_name: str | None
    course: str | None
    year_of_study: int | None
    monthly_pocket_money: Decimal | None
    part_time_income: Decimal | None
    monthly_college_expenses: Decimal | None


class StudentProfileUpdate(BaseModel):
    college_name: str | None = None
    course: str | None = None
    year_of_study: int | None = Field(default=None, ge=1, le=8)
    monthly_pocket_money: Decimal | None = Field(default=None, ge=0)
    part_time_income: Decimal | None = Field(default=None, ge=0)
    monthly_college_expenses: Decimal | None = Field(default=None, ge=0)


# ---------------------------------------------------------------------------
# Employee
# ---------------------------------------------------------------------------
class EmployeeProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    employer_name: str | None
    designation: str | None
    monthly_salary: Decimal | None
    salary_day: int | None


class EmployeeProfileUpdate(BaseModel):
    employer_name: str | None = None
    designation: str | None = None
    monthly_salary: Decimal | None = Field(default=None, ge=0)
    salary_day: int | None = Field(default=None, ge=1, le=31)


class EmiCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    lender: str | None = None
    total_amount: Decimal = Field(gt=0)
    monthly_installment: Decimal = Field(gt=0)
    remaining_balance: Decimal = Field(ge=0)
    months_paid: int = Field(default=0, ge=0)
    interest_rate: Decimal | None = Field(default=None, ge=0)
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None


class EmiUpdate(BaseModel):
    name: str | None = None
    lender: str | None = None
    total_amount: Decimal | None = Field(default=None, gt=0)
    monthly_installment: Decimal | None = Field(default=None, gt=0)
    remaining_balance: Decimal | None = Field(default=None, ge=0)
    months_paid: int | None = Field(default=None, ge=0)
    interest_rate: Decimal | None = Field(default=None, ge=0)
    start_date: date | None = None
    end_date: date | None = None
    status: EmiStatus | None = None
    notes: str | None = None


class EmiOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    lender: str | None
    total_amount: Decimal
    monthly_installment: Decimal
    months_paid: int
    remaining_balance: Decimal
    interest_rate: Decimal | None
    start_date: date | None
    end_date: date | None
    status: EmiStatus
    notes: str | None


class SalaryHistoryCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    salary_month: date
    received_date: date | None = None
    notes: str | None = None


class SalaryHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    amount: Decimal
    currency_code: str
    salary_month: date
    received_date: date | None
    notes: str | None


# ---------------------------------------------------------------------------
# Freelancer
# ---------------------------------------------------------------------------
class FreelancerProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    skills: str | None
    hourly_rate: Decimal | None
    currency_code: str


class FreelancerProfileUpdate(BaseModel):
    skills: str | None = None
    hourly_rate: Decimal | None = Field(default=None, ge=0)
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)


class ClientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    notes: str | None = None


class ClientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str | None
    phone: str | None
    company: str | None
    notes: str | None


class ProjectCreate(BaseModel):
    client_id: UUID | None = None
    title: str = Field(min_length=1, max_length=120)
    description: str | None = None
    budget: Decimal | None = Field(default=None, gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    status: ProjectStatus = ProjectStatus.active
    start_date: date | None = None
    end_date: date | None = None


class ProjectUpdate(BaseModel):
    client_id: UUID | None = None
    title: str | None = None
    description: str | None = None
    budget: Decimal | None = Field(default=None, gt=0)
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    status: ProjectStatus | None = None
    start_date: date | None = None
    end_date: date | None = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID | None
    title: str
    description: str | None
    budget: Decimal | None
    currency_code: str
    status: ProjectStatus
    start_date: date | None
    end_date: date | None


class ProjectPaymentCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    status: PaymentStatus = PaymentStatus.pending
    payment_date: date | None = None
    method: PaymentMethod | None = None
    notes: str | None = None


class ProjectPaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    amount: Decimal
    currency_code: str
    status: PaymentStatus
    payment_date: date | None
    method: PaymentMethod | None
    notes: str | None


# ---------------------------------------------------------------------------
# Investor
# ---------------------------------------------------------------------------
class InvestorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    risk_tolerance: RiskTolerance
    notes: str | None


class InvestorProfileUpdate(BaseModel):
    risk_tolerance: RiskTolerance | None = None
    notes: str | None = None


class InvestmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: InvestmentType = InvestmentType.stocks
    invested_amount: Decimal = Field(ge=0)
    current_value: Decimal = Field(ge=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    purchase_date: date | None = None
    notes: str | None = None


class InvestmentUpdate(BaseModel):
    name: str | None = None
    type: InvestmentType | None = None
    invested_amount: Decimal | None = Field(default=None, ge=0)
    current_value: Decimal | None = Field(default=None, ge=0)
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    purchase_date: date | None = None
    notes: str | None = None


class InvestmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: InvestmentType
    invested_amount: Decimal
    current_value: Decimal
    currency_code: str
    purchase_date: date | None
    notes: str | None


class DividendCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    dividend_date: date
    notes: str | None = None


class DividendOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    investment_id: UUID
    amount: Decimal
    currency_code: str
    dividend_date: date
    notes: str | None


# ---------------------------------------------------------------------------
# Small Shop Owner
# ---------------------------------------------------------------------------
class ShopProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    shop_name: str | None
    business_type: str | None
    address: str | None
    default_currency: str


class ShopProfileUpdate(BaseModel):
    shop_name: str | None = None
    business_type: str | None = None
    address: str | None = None
    default_currency: str | None = Field(default=None, min_length=3, max_length=3)


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class CustomerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    phone: str | None
    email: str | None
    notes: str | None


class SaleCreate(BaseModel):
    customer_id: UUID | None = None
    product_name: str = Field(min_length=1, max_length=120)
    quantity: Decimal = Field(default=1, gt=0)
    unit_price: Decimal = Field(ge=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    sale_date: date
    payment_method: PaymentMethod = PaymentMethod.cash
    notes: str | None = None


class SaleUpdate(BaseModel):
    customer_id: UUID | None = None
    product_name: str | None = None
    quantity: Decimal | None = Field(default=None, gt=0)
    unit_price: Decimal | None = Field(default=None, ge=0)
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    sale_date: date | None = None
    payment_method: PaymentMethod | None = None
    notes: str | None = None


class SaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_id: UUID | None
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    total: Decimal
    currency_code: str
    sale_date: date
    payment_method: PaymentMethod
    notes: str | None


class PurchaseCreate(BaseModel):
    product_name: str = Field(min_length=1, max_length=120)
    quantity: Decimal = Field(default=1, gt=0)
    unit_price: Decimal = Field(ge=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    purchase_date: date
    supplier: str | None = None
    notes: str | None = None


class PurchaseUpdate(BaseModel):
    product_name: str | None = None
    quantity: Decimal | None = Field(default=None, gt=0)
    unit_price: Decimal | None = Field(default=None, ge=0)
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    purchase_date: date | None = None
    supplier: str | None = None
    notes: str | None = None


class PurchaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    total: Decimal
    currency_code: str
    purchase_date: date
    supplier: str | None
    notes: str | None
