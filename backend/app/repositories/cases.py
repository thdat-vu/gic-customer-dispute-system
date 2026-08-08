from sqlalchemy.orm import Session

from app.models import Case, OutcomeAuditEntry


def get_case_by_id(session: Session, case_id: int) -> Case | None:
    return session.get(Case, case_id)


def add_audit_entry(session: Session, entry: OutcomeAuditEntry) -> None:
    session.add(entry)
