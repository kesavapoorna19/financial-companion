"""Money formatting helpers for reports and logs."""

from decimal import Decimal

CURRENCY_SYMBOLS = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "JPY": "¥",
    "AED": "AED ",
    "SGD": "S$",
    "CAD": "C$",
    "AUD": "A$",
    "MYR": "RM ",
}

# Currencies the API accepts for any transaction amount.
SUPPORTED_CURRENCIES = frozenset(CURRENCY_SYMBOLS.keys())


def format_money(amount, currency_code: str = "INR") -> str:
    """Format a Decimal amount with its currency symbol and 2 decimals.

    Uses simple western grouping (1,23,456 is not applied) for consistency
    across currencies. Example: ₹12,345.00
    """
    value = float(amount or 0)
    symbol = CURRENCY_SYMBOLS.get(currency_code, f"{currency_code} ")
    return f"{symbol}{value:,.2f}"
