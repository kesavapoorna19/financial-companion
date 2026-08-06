"""Expense CRUD tests — including recurring logic (Phase 10)."""

from datetime import date

from tests.conftest import API


class TestCreateExpense:
    def test_create_basic_expense(self, client, auth, expense_category):
        res = client.post(
            f"{API}/expenses",
            headers=auth,
            json={
                "title": "Lunch",
                "amount": 420,
                "expense_date": "2026-08-02",
                "currency_code": "INR",
                "category_id": expense_category,
                "merchant": "Meghana Foods",
            },
        )
        assert res.status_code == 201
        data = res.json()
        assert data["merchant"] == "Meghana Foods"
        assert data["is_recurring"] is False
        assert data["next_due_date"] is None

    def test_recurring_expense_computes_next_due(self, client, auth, expense_category):
        res = client.post(
            f"{API}/expenses",
            headers=auth,
            json={
                "title": "Rent",
                "amount": 12000,
                "expense_date": "2026-08-01",
                "currency_code": "INR",
                "is_recurring": True,
                "recurring_frequency": "monthly",
            },
        )
        assert res.status_code == 201
        data = res.json()
        assert data["is_recurring"] is True
        assert data["recurring_frequency"] == "monthly"
        assert data["next_due_date"] == "2026-09-01"

    def test_recurring_without_frequency_rejected(self, client, auth):
        res = client.post(
            f"{API}/expenses",
            headers=auth,
            json={
                "title": "Broken",
                "amount": 100,
                "expense_date": "2026-08-01",
                "currency_code": "INR",
                "is_recurring": True,
            },
        )
        assert res.status_code == 400

    def test_recurring_weekly_next_due(self, client, auth):
        res = client.post(
            f"{API}/expenses",
            headers=auth,
            json={
                "title": "Gym",
                "amount": 500,
                "expense_date": "2026-08-01",
                "currency_code": "INR",
                "is_recurring": True,
                "recurring_frequency": "weekly",
            },
        )
        assert res.status_code == 201
        assert res.json()["next_due_date"] == "2026-08-08"


class TestUpdateRecurring:
    def test_update_recurring_on_clears_next_due(self, client, auth):
        exp = client.post(
            f"{API}/expenses",
            headers=auth,
            json={
                "title": "Sub",
                "amount": 100,
                "expense_date": "2026-08-01",
                "currency_code": "INR",
                "is_recurring": True,
                "recurring_frequency": "monthly",
            },
        ).json()
        res = client.patch(
            f"{API}/expenses/{exp['id']}",
            headers=auth,
            json={"is_recurring": False},
        )
        assert res.status_code == 200
        assert res.json()["is_recurring"] is False
        assert res.json()["next_due_date"] is None
        assert res.json()["recurring_frequency"] is None


class TestRecurringFilter:
    def test_filter_recurring_only(self, client, auth):
        client.post(
            f"{API}/expenses",
            headers=auth,
            json={"title": "One-time", "amount": 50, "expense_date": "2026-08-01", "currency_code": "INR"},
        )
        client.post(
            f"{API}/expenses",
            headers=auth,
            json={
                "title": "Recurring",
                "amount": 200,
                "expense_date": "2026-08-01",
                "currency_code": "INR",
                "is_recurring": True,
                "recurring_frequency": "monthly",
            },
        )
        res = client.get(f"{API}/expenses", headers=auth, params={"is_recurring": True})
        data = res.json()
        assert data["total"] == 1
        assert data["items"][0]["is_recurring"] is True


class TestExpenseIsolation:
    def test_user_cannot_see_other_user_expense(self, client, auth, auth2):
        exp = client.post(
            f"{API}/expenses",
            headers=auth,
            json={"title": "A's bill", "amount": 100, "expense_date": "2026-08-01", "currency_code": "INR"},
        ).json()
        res = client.get(f"{API}/expenses/{exp['id']}", headers=auth2)
        assert res.status_code == 404
