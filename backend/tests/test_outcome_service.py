from pathlib import Path

import pytest
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import create_database_schema, create_sqlite_engine
from app.models import Case, OutcomeAuditEntry
from app.schemas import OutcomeSubmission
from app.services import record_outcome


def make_case(**overrides: object) -> Case:
    fields: dict[str, object] = {
        "case_id": "CASE-TEST",
        "user_id": "usr-test",
        "user_email": "test@example.com",
        "device_id": "dev-test",
        "amount": 100.0,
        "currency": "USD",
        "created_at": "2026-01-15T10:00:00Z",
        "region": "APAC-VN",
        "status": "open",
        "outcome": None,
        "outcome_note": None,
    }
    fields.update(overrides)
    return Case(**fields)  # type: ignore[arg-type]


@pytest.fixture
def session(tmp_path: Path) -> Session:
    engine = create_sqlite_engine(f"sqlite:///{tmp_path / 'service.db'}")
    create_database_schema(engine)
    with Session(engine) as database_session:
        yield database_session


def test_capture_resolves_open_case_and_creates_captured_audit_entry(session: Session) -> None:
    case = make_case()
    session.add(case)
    session.commit()

    updated_case = record_outcome(
        session,
        case.id,
        OutcomeSubmission(
            outcome="won",
            outcome_note="Proof of delivery received.",
            editor_role="analyst",
        ),
    )
    entry = session.scalar(select(OutcomeAuditEntry))

    assert updated_case.status == "resolved"
    assert updated_case.outcome == "won"
    assert updated_case.outcome_note == "Proof of delivery received."
    assert entry is not None
    assert entry.event_type == "captured"
    assert entry.case_ref_id == case.id
    assert entry.previous_outcome is None
    assert entry.previous_note is None
    assert entry.new_outcome == "won"
    assert entry.new_note == "Proof of delivery received."
    assert entry.editor_role == "analyst"


def test_correction_creates_audit_entry_with_previous_and_new_values(session: Session) -> None:
    case = make_case(
        status="resolved", outcome="lost", outcome_note="Initial assessment."
    )
    session.add(case)
    session.commit()

    updated_case = record_outcome(
        session,
        case.id,
        OutcomeSubmission(
            outcome="fraud_confirmed",
            outcome_note="Device evidence confirmed fraud.",
            editor_role="manager-entered-role-is-recorded",
        ),
    )
    entry = session.scalar(select(OutcomeAuditEntry))

    assert updated_case.status == "resolved"
    assert updated_case.outcome == "fraud_confirmed"
    assert entry is not None
    assert entry.event_type == "corrected"
    assert entry.previous_outcome == "lost"
    assert entry.previous_note == "Initial assessment."
    assert entry.new_outcome == "fraud_confirmed"
    assert entry.new_note == "Device evidence confirmed fraud."
    assert entry.editor_role == "manager-entered-role-is-recorded"


def test_no_op_correction_creates_no_audit_entry(session: Session) -> None:
    case = make_case(status="resolved", outcome="won", outcome_note="Already recorded.")
    session.add(case)
    session.commit()

    unchanged_case = record_outcome(
        session,
        case.id,
        OutcomeSubmission(
            outcome="won", outcome_note="Already recorded.", editor_role="analyst"
        ),
    )

    assert unchanged_case.status == "resolved"
    assert unchanged_case.outcome == "won"
    assert session.scalar(select(func.count()).select_from(OutcomeAuditEntry)) == 0


def test_invalid_outcome_is_rejected_by_schema_before_service_input_exists() -> None:
    with pytest.raises(ValidationError):
        OutcomeSubmission(outcome="maybe", editor_role="analyst")  # type: ignore[arg-type]
