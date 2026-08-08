from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from app.database import create_database_schema, create_sqlite_engine
from app.models import Case
from app.services.trends import MonthlyOutcomeCount, monthly_resolved_outcome_counts


def make_case(
    *, created_at: str, status: str, outcome: str | None
) -> Case:
    return Case(
        case_id=f"CASE-{created_at}-{status}-{outcome}",
        user_id="usr-test",
        user_email="test@example.com",
        device_id="dev-test",
        amount=100.0,
        currency="USD",
        created_at=created_at,
        region="APAC-VN",
        status=status,
        outcome=outcome,
        outcome_note=None,
    )


@pytest.fixture
def session(tmp_path: Path) -> Session:
    engine = create_sqlite_engine(f"sqlite:///{tmp_path / 'trend.db'}")
    create_database_schema(engine)
    with Session(engine) as database_session:
        yield database_session


def test_monthly_trends_count_only_resolved_cases(session: Session) -> None:
    session.add_all(
        [
            make_case(
                created_at="2026-01-02T00:00:00Z", status="resolved", outcome="won"
            ),
            make_case(
                created_at="2026-01-11T00:00:00Z", status="resolved", outcome="lost"
            ),
            make_case(
                created_at="2026-02-01T00:00:00Z",
                status="resolved",
                outcome="fraud_confirmed",
            ),
            make_case(
                created_at="2026-02-03T00:00:00Z", status="open", outcome="won"
            ),
        ]
    )
    session.commit()

    assert monthly_resolved_outcome_counts(session) == [
        MonthlyOutcomeCount("2026-01", 1, 1, 0),
        MonthlyOutcomeCount("2026-02", 0, 0, 1),
    ]
