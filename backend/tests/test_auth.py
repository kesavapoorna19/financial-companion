"""Authentication tests (Phase 10)."""

from tests.conftest import API, _register


class TestRegistration:
    def test_register_returns_token(self, client):
        token, _ = _register(client)
        assert len(token) > 20

    def test_register_creates_user_profile(self, client):
        _, email = _register(client, full_name="Profile Tester", role="student")
        res = client.post(
            f"{API}/auth/login",
            json={"email": email, "password": "password123"},
        )
        token = res.json()["access_token"]
        me = client.get(
            f"{API}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        ).json()
        assert me["full_name"] == "Profile Tester"
        assert me["role"] == "student"

    def test_duplicate_email_conflict(self, client):
        email = "unique@example.com"
        _register(client, email=email)
        res = client.post(
            f"{API}/auth/register",
            json={
                "full_name": "Second",
                "email": email,
                "password": "password123",
                "role": "employee",
            },
        )
        assert res.status_code == 409

    def test_short_password_validation(self, client):
        res = client.post(
            f"{API}/auth/register",
            json={"full_name": "Ab", "email": "a@b.com", "password": "short", "role": "student"},
        )
        assert res.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        _, email = _register(client)
        res = client.post(
            f"{API}/auth/login",
            json={"email": email, "password": "password123"},
        )
        assert res.status_code == 200
        assert "access_token" in res.json()

    def test_login_wrong_password(self, client):
        _, email = _register(client)
        res = client.post(
            f"{API}/auth/login",
            json={"email": email, "password": "wrongpassword"},
        )
        assert res.status_code == 401

    def test_login_nonexistent_email(self, client):
        res = client.post(
            f"{API}/auth/login",
            json={"email": "ghost@example.com", "password": "password123"},
        )
        assert res.status_code == 401


class TestMe:
    def test_me_returns_user(self, client):
        token, email = _register(client, full_name="Me Test", role="freelancer")
        res = client.get(
            f"{API}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == email
        assert data["role"] == "freelancer"

    def test_me_unauthorized_without_token(self, client):
        res = client.get(f"{API}/auth/me")
        assert res.status_code == 401

    def test_me_invalid_token(self, client):
        res = client.get(
            f"{API}/auth/me",
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert res.status_code == 401
