from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import SearchField
from app.models import Case, OutcomeAuditEntry


def get_case_by_id(session: Session, case_id: int) -> Case | None:
    return session.get(Case, case_id)


def add_audit_entry(session: Session, entry: OutcomeAuditEntry) -> None:
    session.add(entry)


def list_cases(
    session: Session, search_field: str | None = None, query: str | None = None
) -> list[Case]:
    statement = select(Case)
    if search_field is not None and query is not None:
        search_column = {
            SearchField.USER_ID: Case.user_id,
            SearchField.DEVICE_ID: Case.device_id,
            SearchField.EMAIL: Case.user_email,
        }[search_field]
        statement = statement.where(func.lower(search_column).contains(query.lower()))

    return list(session.scalars(statement.order_by(Case.created_at.desc())))


def list_audit_entries(session: Session, case_ref_id: int) -> list[OutcomeAuditEntry]:
    statement = (
        select(OutcomeAuditEntry)
        .where(OutcomeAuditEntry.case_ref_id == case_ref_id)
        .order_by(OutcomeAuditEntry.changed_at.desc())
    )
    return list(session.scalars(statement))
