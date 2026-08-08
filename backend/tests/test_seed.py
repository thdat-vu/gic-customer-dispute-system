from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import create_sqlite_engine
from app.models import Case
from app.seed import seed_database


def test_seed_import_preserves_all_rows_and_known_anomalies(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'seed.db'}"

    imported_count = seed_database(database_url)
    engine = create_sqlite_engine(database_url)

    with Session(engine) as session:
        assert imported_count == 220
        assert session.scalar(select(func.count()).select_from(Case)) == 220
        assert session.scalar(
            select(func.count()).select_from(Case).where(Case.case_id == "CASE-00213")
        ) == 2
        assert session.scalar(
            select(Case.outcome).where(Case.case_id == "CASE-00215")
        ) == "maybe"
        assert session.scalar(
            select(Case.user_id).where(Case.case_id == "CASE-00218")
        ) is None
        assert session.scalar(
            select(Case.amount).where(Case.case_id == "CASE-00216")
        ) < 0
        assert session.scalar(
            select(Case.status).where(Case.case_id == "CASE-00220")
        ) == "open"
        assert session.scalar(
            select(Case.outcome).where(Case.case_id == "CASE-00220")
        ) == "lost"


def test_seed_import_uses_csv_parser_for_embedded_commas(tmp_path: Path) -> None:
    database_url = f"sqlite:///{tmp_path / 'seed.db'}"
    seed_database(database_url)
    engine = create_sqlite_engine(database_url)

    with Session(engine) as session:
        note = session.scalar(
            select(Case.outcome_note).where(Case.case_id == "CASE-00027")
        )

    assert note == "Duplicate charge, refunded prior to dispute."
