"""Reports + export tests (Phase 10)."""

from datetime import date, timedelta

from tests.conftest import API


class TestReportOverview:
    def test_overview_empty_period(self, client, auth):
        res = client.get(
            f"{API}/reports/overview",
            headers=auth,
            params={"start_date": "2026-08-01", "end_date": "2026-08-31"},
        )
        assert res.status_code == 200
        data = res.json()
        assert float(data["total_income"]) == 0.0
        assert float(data["total_expenses"]) == 0.0
        assert float(data["balance"]) == 0.0

    def test_overview_with_data(self, client, auth):
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Salary", "amount": 50000, "income_date": "2026-08-01", "currency_code": "INR"},
        )
        client.post(
            f"{API}/expenses",
            headers=auth,
            json={"title": "Rent", "amount": 12000, "expense_date": "2026-08-02", "currency_code": "INR"},
        )
        res = client.get(
            f"{API}/reports/overview",
            headers=auth,
            params={"start_date": "2026-08-01", "end_date": "2026-08-31"},
        )
        data = res.json()
        assert float(data["total_income"]) == 50000.0
        assert float(data["total_expenses"]) == 12000.0
        assert float(data["balance"]) == 38000.0

    def test_overview_monthly_series_length(self, client, auth):
        """A one-month range should have exactly one monthly point."""
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "In", "amount": 100, "income_date": "2026-08-15", "currency_code": "INR"},
        )
        res = client.get(
            f"{API}/reports/overview",
            headers=auth,
            params={"start_date": "2026-08-01", "end_date": "2026-08-31"},
        )
        assert len(res.json()["monthly_series"]) == 1

    def test_overview_date_validation(self, client, auth):
        res = client.get(
            f"{API}/reports/overview",
            headers=auth,
            params={"start_date": "2026-08-31", "end_date": "2026-08-01"},
        )
        assert res.status_code == 400

    def test_overview_isolation(self, client, auth, auth2):
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Private", "amount": 999, "income_date": "2026-08-10", "currency_code": "INR"},
        )
        res = client.get(
            f"{API}/reports/overview",
            headers=auth2,
            params={"start_date": "2026-08-01", "end_date": "2026-08-31"},
        )
        assert float(res.json()["total_income"]) == 0.0


class TestExportCSV:
    def test_csv_download(self, client, auth):
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Salary", "amount": 50000, "income_date": "2026-08-01", "currency_code": "INR"},
        )
        res = client.get(
            f"{API}/reports/export/csv",
            headers=auth,
            params={"year": 2026, "month": 8},
        )
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        body = res.text
        assert "Salary" in body
        assert "SUMMARY" in body
        assert "financial-report-2026-08.csv" in res.headers["content-disposition"]

    def test_csv_isolation(self, client, auth, auth2):
        client.post(
            f"{API}/incomes",
            headers=auth,
            json={"title": "Private", "amount": 100, "income_date": "2026-08-01", "currency_code": "INR"},
        )
        res = client.get(
            f"{API}/reports/export/csv",
            headers=auth2,
            params={"year": 2026, "month": 8},
        )
        assert "Private" not in res.text


class TestExportPDF:
    def test_pdf_download(self, client, auth):
        res = client.get(
            f"{API}/reports/export/pdf",
            headers=auth,
            params={"year": 2026, "month": 8},
        )
        assert res.status_code == 200
        assert "application/pdf" in res.headers["content-type"]
        assert res.content[:5] == b"%PDF-"
        assert "financial-report-2026-08.pdf" in res.headers["content-disposition"]
