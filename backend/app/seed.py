"""Explicit one-time seed loader for the immutable assessment dataset."""

import csv
from pathlib import Path

from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.database import DEFAULT_DATABASE_URL, create_database_schema, create_sqlite_engine
from app.models import Case


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SEED_PATH = REPOSITORY_ROOT / "seed_dataset.csv"


def null_if_blank(value: str | None) -> str | None:
    return value if value else None


def load_cases_from_csv(csv_path: Path = DEFAULT_SEED_PATH) -> list[Case]:
    """Read each physical CSV row with RFC4180 parsing and no data normalization."""
    with csv_path.open(encoding="utf-8", newline="") as seed_file:
        rows = csv.DictReader(seed_file)
        return [
            Case(
                case_id=row["case_id"],
                user_id=null_if_blank(row["user_id"]),
                user_email=row["user_email"],
                device_id=row["device_id"],
                amount=float(row["amount"]),
                currency=row["currency"],
                created_at=row["created_at"],
                region=row["region"],
                status=row["status"],
                outcome=null_if_blank(row["outcome"]),
                outcome_note=null_if_blank(row["outcome_note"]),
            )
            for row in rows
        ]


def seed_database(
    database_url: str = DEFAULT_DATABASE_URL,
    csv_path: Path = DEFAULT_SEED_PATH,
) -> int:
    """Create tables and import the source dataset once into a SQLite database."""
    target_engine: Engine = create_sqlite_engine(database_url)
    create_database_schema(target_engine)
    cases = load_cases_from_csv(csv_path)

    with Session(target_engine) as session:
        session.add_all(cases)
        session.commit()

    return len(cases)


def main() -> None:
    imported_count = seed_database()
    print(f"Seeded {imported_count} case records into SQLite.")


if __name__ == "__main__":
    main()
