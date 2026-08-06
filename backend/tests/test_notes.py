"""Notes aggregation tests (Phase 10)."""

from tests.conftest import API


class TestNotes:
    def test_notes_empty(self, client, auth):
        res = client.get(f"{API}/notes", headers=auth)
        assert res.status_code == 200
        assert res.json()["total"] == 0

    def test_notes_after_income_with_note(self, client, auth):
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={
                "title": "Freelance gig",
                "amount": 8000,
                "income_date": "2026-08-05",
                "currency_code": "INR",
                "notes": "Website project, paid in full",
            },
        )
        res = client.get(f"{API}/notes", headers=auth)
        data = res.json()
        assert data["total"] == 1
        assert data["items"][0]["type"] == "income"
        assert data["items"][0]["note"] == "Website project, paid in full"

    def test_notes_after_expense_with_note(self, client, auth):
        client.post(
            f"{API}/expenses",
            headers=auth,
            json={
                "title": "Electricity",
                "amount": 2200,
                "expense_date": "2026-08-04",
                "currency_code": "INR",
                "notes": "August bill, paid via UPI",
            },
        )
        res = client.get(f"{API}/notes", headers=auth)
        assert res.json()["total"] == 1
        assert res.json()["items"][0]["type"] == "expense"

    def test_notes_exclude_empty_note(self, client, auth):
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "No notes", "amount": 100, "income_date": "2026-08-01", "currency_code": "INR"},
        )
        res = client.get(f"{API}/notes", headers=auth)
        assert res.json()["total"] == 0

    def test_notes_search(self, client, auth):
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Client X", "amount": 500, "income_date": "2026-08-01", "currency_code": "INR", "notes": "Logo project completed"},
        )
        client.post(
            f"{API}/expenses",
            headers=auth,
            json={"title": "Groceries", "amount": 800, "expense_date": "2026-08-01", "currency_code": "INR", "notes": "Weekly groceries at Big Bazaar"},
        )
        res = client.get(f"{API}/notes", headers=auth, params={"search": "logo"})
        assert res.json()["total"] == 1
        assert "Client X" in res.json()["items"][0]["title"]

    def test_notes_type_filter(self, client, auth):
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Inc", "amount": 100, "income_date": "2026-08-01", "currency_code": "INR", "notes": "some note"},
        )
        client.post(
            f"{API}/expenses",
            headers=auth,
            json={"title": "Exp", "amount": 50, "expense_date": "2026-08-01", "currency_code": "INR", "notes": "other note"},
        )
        res = client.get(f"{API}/notes", headers=auth, params={"type": "income"})
        assert res.json()["total"] == 1
        assert res.json()["items"][0]["type"] == "income"

    def test_notes_isolation(self, client, auth, auth2):
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "A", "amount": 100, "income_date": "2026-08-01", "currency_code": "INR", "notes": "Private"},
        )
        res = client.get(f"{API}/notes", headers=auth2)
        assert res.json()["total"] == 0
