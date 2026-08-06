"""Default categories seeded for every user.

Applied automatically by ``docker-compose.yml`` on first database boot
(``backend/database/schema.sql``). This module mirrors those defaults so the
application can reference them at runtime (e.g. to confirm a category exists).
"""

DEFAULT_CATEGORIES = [
    {"name": "Food", "type": "expense", "icon": "utensils", "color": "#f97316"},
    {"name": "Travel", "type": "expense", "icon": "plane", "color": "#3b82f6"},
    {"name": "Entertainment", "type": "expense", "icon": "film", "color": "#a855f7"},
    {"name": "Education", "type": "expense", "icon": "book", "color": "#14b8a6"},
    {"name": "Medical", "type": "expense", "icon": "heart-pulse", "color": "#ef4444"},
    {"name": "Shopping", "type": "expense", "icon": "shopping-bag", "color": "#ec4899"},
    {"name": "Bills", "type": "expense", "icon": "receipt", "color": "#eab308"},
    {"name": "Salary", "type": "income", "icon": "banknote", "color": "#22c55e"},
    {"name": "Investment", "type": "both", "icon": "trending-up", "color": "#06b6d4"},
    {"name": "Business", "type": "both", "icon": "briefcase", "color": "#6366f1"},
    {"name": "Charity", "type": "expense", "icon": "heart", "color": "#fb7185"},
    {"name": "Other", "type": "both", "icon": "ellipsis", "color": "#64748b"},
]
