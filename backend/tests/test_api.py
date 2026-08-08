from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.constants import AuditEventType, CaseStatus, OutcomeValue
from app.database import create_database_schema, create_sqlite_engine, get_session
from app.main import app
from app.models import Case, OutcomeAuditEntry


def test_openapi_includes_all_five_documented_api_endpoints() -> None:
    openapi = app.openapi()
    paths = openapi["paths"]

    assert set(paths) >= {
        "/api/cases",
        "/api/cases/{case_id}",
        "/api/cases/{case_id}/outcome",
        "/api/cases/{case_id}/history",
        "/api/trends",
    }
    validation_schema = paths["/api/cases"]["get"]["responses"]["422"]
    assert validation_schema["content"]["application/json"]["schema"] == {
        "$ref": "#/components/schemas/ErrorResponse"
    }


def make_case(**overrides: object) -> Case:
    fields: dict[str, object] = {
        "case_id": "CASE-API",
        "user_id": "usr-CaseSensitive",
        "user_email": "analyst@example.com",
        "device_id": "dev-api",
        "amount": 100.0,
        "currency": "USD",
        "created_at": "2026-01-15T10:00:00Z",
        "region": "APAC-VN",
        "status": CaseStatus.OPEN,
        "outcome": None,
        "outcome_note": None,
    }
    fields.update(overrides)
    return Case(**fields)  # type: ignore[arg-type]


@pytest.fixture
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    engine = create_sqlite_engine(f"sqlite:///{tmp_path / 'api.db'}")
    create_database_schema(engine)

    def get_test_session() -> Generator[Session, None, None]:
        with Session(engine) as database_session:
            yield database_session

    app.dependency_overrides[get_session] = get_test_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def add_case(client: TestClient, case: Case) -> int:
    dependency = app.dependency_overrides[get_session]
    with next(dependency()) as session:
        session.add(case)
        session.commit()
        return case.id


def test_case_detail_not_found_uses_shared_error_envelope(client: TestClient) -> None:
    response = client.get("/api/cases/99999")

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "CASE_NOT_FOUND",
            "message": "No case found with id 99999",
            "fields": None,
        }
    }


def test_invalid_outcome_request_uses_shared_validation_envelope(client: TestClient) -> None:
    response = client.post(
        "/api/cases/99999/outcome",
        json={"outcome": "maybe", "editor_role": "analyst"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert response.json()["error"]["fields"][0]["field"] == "outcome"


def test_case_list_searches_single_selected_field_case_insensitively(
    client: TestClient,
) -> None:
    newer_case_id = add_case(
        client,
        make_case(case_id="CASE-NEW", created_at="2026-02-01T10:00:00Z"),
    )
    add_case(client, make_case(case_id="CASE-OTHER", user_id="usr-other"))

    response = client.get(
        "/api/cases", params={"search_field": "user_id", "q": "casesensitive"}
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["id"] == newer_case_id
    assert "outcome_note" not in response.json()["items"][0]


def test_partial_search_parameters_use_shared_validation_envelope(
    client: TestClient,
) -> None:
    response = client.get("/api/cases", params={"search_field": "user_id"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert response.json()["error"]["fields"][0]["field"] == "search_field"


def test_case_history_returns_empty_entries_for_case_without_audit(client: TestClient) -> None:
    case_id = add_case(client, make_case())

    response = client.get(f"/api/cases/{case_id}/history")

    assert response.status_code == 200
    assert response.json() == {"id": case_id, "case_id": "CASE-API", "entries": []}


def test_case_history_returns_entries_most_recent_first(client: TestClient) -> None:
    case_id = add_case(client, make_case(status=CaseStatus.RESOLVED))
    dependency = app.dependency_overrides[get_session]
    with next(dependency()) as session:
        session.add_all(
            [
                OutcomeAuditEntry(
                    case_ref_id=case_id,
                    event_type=AuditEventType.CAPTURED,
                    new_outcome=OutcomeValue.LOST,
                    new_note=None,
                    editor_role="analyst",
                    changed_at="2026-01-01T00:00:00Z",
                ),
                OutcomeAuditEntry(
                    case_ref_id=case_id,
                    event_type=AuditEventType.CORRECTED,
                    previous_outcome=OutcomeValue.LOST,
                    new_outcome=OutcomeValue.WON,
                    previous_note=None,
                    new_note=None,
                    editor_role="analyst",
                    changed_at="2026-01-02T00:00:00Z",
                ),
            ]
        )
        session.commit()

    response = client.get(f"/api/cases/{case_id}/history")

    assert response.status_code == 200
    assert [entry["event_type"] for entry in response.json()["entries"]] == [
        AuditEventType.CORRECTED,
        AuditEventType.CAPTURED,
    ]


def test_outcome_route_captures_case_and_trends_count_resolved_cases(client: TestClient) -> None:
    case_id = add_case(client, make_case(outcome=OutcomeValue.LOST))

    outcome_response = client.post(
        f"/api/cases/{case_id}/outcome",
        json={"outcome": OutcomeValue.WON, "editor_role": "analyst"},
    )
    trend_response = client.get("/api/trends", params={"group_by": "month"})
    region_trend_response = client.get("/api/trends", params={"group_by": "region"})

    assert outcome_response.status_code == 200
    assert outcome_response.json()["status"] == CaseStatus.RESOLVED
    assert trend_response.json() == {
        "group_by": "month",
        "buckets": [
            {"key": "2026-01", "won": 1, "lost": 0, "fraud_confirmed": 0}
        ],
    }
    assert region_trend_response.json()["buckets"][0]["key"] == "APAC-VN"


def test_cors_allows_the_documented_local_frontend_origin(client: TestClient) -> None:
    response = client.options(
        "/api/cases",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
