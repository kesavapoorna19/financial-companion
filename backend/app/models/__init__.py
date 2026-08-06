"""ORM models. Importing this package registers every table on Base.metadata
(required for Alembic autogenerate and for create_all).

Import order matters only for relationships; none here are circular.
"""

from app.models.user import User, UserSettings
from app.models.category import Category
from app.models.transaction import Income, Expense
from app.models.savings import SavingsGoal, SavingsContribution
from app.models.student import StudentProfile
from app.models.employee import EmployeeProfile, Emi, SalaryHistory
from app.models.freelancer import FreelancerProfile, Client, Project, ProjectPayment
from app.models.investor import InvestorProfile, Investment, Dividend
from app.models.shop import ShopProfile, Customer, Sale, Purchase

__all__ = [
    "User",
    "UserSettings",
    "Category",
    "Income",
    "Expense",
    "SavingsGoal",
    "SavingsContribution",
    "StudentProfile",
    "EmployeeProfile",
    "Emi",
    "SalaryHistory",
    "FreelancerProfile",
    "Client",
    "Project",
    "ProjectPayment",
    "InvestorProfile",
    "Investment",
    "Dividend",
    "ShopProfile",
    "Customer",
    "Sale",
    "Purchase",
]
