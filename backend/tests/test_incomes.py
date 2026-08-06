"""Income CRUD tests (Phase 10)."""

from datetime import date, timedelta

from tests.conftest import API


class TestCreateIncome:
    def test_create_income(self, client, auth, income_category):
        res = client.post(
            f"{API}/incomes",
            headers=auth,
            json={
                "title": "Monthly Salary",
                "amount": 50000,
                "currency_code": "INR",
                "income_date": "2026-08-01",
                "category_id": income_category,
                "payment_method": "bank_transfer",
            },
        )
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "Monthly Salary"
        assert float(data["amount"]) == 50000.0

    def test_create_income_validation_amount_zero(self, client, auth):
        res = client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Bad", "amount": 0, "income_date": "2026-08-01", "currency_code": "INR"},
        )
        assert res.status_code == 422

    def test_create_income_invalid_currency(self, client, auth):
        res = client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Money", "amount": 100, "income_date": "2026-08-01", "currency_code": "XYZ"},
        )
        assert res.status_code == 400


class TestListIncomes:
    def test_list_empty(self, client, auth):
        res = client.get(f"{API}/incomes", headers=auth)
        assert res.status_code == 200
        assert res.json()["total"] == 0

    def test_list_with_records(self, client, auth, income_category):
        for i in range(3):
            client.post(
                f"{API}/incomes",
                headers=auth,
                json={
                    "title": f"Income {i}",
                    "amount": 1000 * (i + 1),
                    "income_date": f"2026-08-{i+1:02d}",
                    "currency_code": "INR",
                    "category_id": income_category,
                },
            )
        res = client.get(f"{API}/incomes", headers=auth)
        assert res.json()["total"] == 3

    def test_search_filter(self, client, auth, income_category):
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Salary from Google", "amount": 50000, "income_date": "2026-08-01", "currency_code": "INR", "category_id": income_category},
        )
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Gift from mom", "amount": 2000, "income_date": "2026-08-02", "currency_code": "INR", "category_id": income_category},
        )
        res = client.get(f"{API}/incomes", headers=auth, params={"search": "salary"})
        assert res.json()["total"] == 1
        assert "Salary" in res.json()["items"][0]["title"]

    def test_pagination(self, client, auth, income_category):
        for i in range(5):
            client.post(
                f"{API}/incomes",
                headers=auth,
                json={"title": f"Pag {i}", "amount": 100, "income_date": "2026-08-01", "currency_code": "INR"},
            )
        res = client.get(f"{API}/incomes", headers=auth, params={"page": 1, "page_size": 2})
        data = res.json()
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert data["total"] == 5
        assert len(data["items"]) == 2
        assert data["pages"] == 3


class TestUpdateIncome:
    def test_update_income(self, client, auth, income_category):
        create = client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Old", "amount": 100, "income_date": "2026-08-01", "currency_code": "INR", "category_id": income_category},
        ).json()
        res = client.patch(
            f"{API}/incomes/{create['id']}",
            headers=auth,
            json={"title": "New", "amount": 200},
        )
        assert res.status_code == 200
        assert res.json()["title"] == "New"
        assert float(res.json()["amount"]) == 200.0


class TestDeleteIncome:
    def test_soft_delete(self, client, auth):
        inc = client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Gone", "amount": 50, "income_date": "2026-08-01", "currency_code": "INR"},
        ).json()
        res = client.delete(f"{API}/incomes/{inc['id']}", headers=auth)
        assert res.status_code == 204
        res2 = client.get(f"{API}/incomes/{inc['id']}", headers=auth)
        assert res2.status_code == 404


class TestIncomeIsolation:
    def test_user_cannot_see_other_user_income(self, client, auth, auth2, income_category):
        inc = client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "A's income", "amount": 50000, "income_date": "2026-08-01", "currency_code": "INR", "category_id": income_category},
        ).json()
        # User 2 cannot see it
        res2 = client.get(f"{API}/incomes/{inc['id']}", headers=auth2)
        assert res2.status_code == 404
        list2 = client.get(f"{API}/incomes", headers=auth2)
        assert list2.json()["total"] == 0

    def test_user_cannot_update_other_user_income(self, client, auth, auth2, income_category):
        inc = client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "A's", "amount": 100, "income_date": "2026-08-01", "currency_code": "INR", "category_id": income_category},
        ).json()
        res = client.patch(f"{API}/incomes/{inc['id']}", headers=auth2, json={"title": "Hacked"})
        assert res.status_code == 404
