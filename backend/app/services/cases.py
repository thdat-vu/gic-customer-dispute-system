from sqlalchemy.orm import Session

from app.constants import ApiMessage
from app.models import Case, OutcomeAuditEntry
from app.repositories import get_case_by_id, list_audit_entries, list_cases
from app.services.errors import CaseNotFoundError


def get_case(session: Session, case_id: int) -> Case:
    case = get_case_by_id(session, case_id)
    if case is None:
        raise CaseNotFoundError(ApiMessage.CASE_NOT_FOUND.format(case_id=case_id))
    return case


def get_cases(
    session: Session, search_field: str | None = None, query: str | None = None
) -> list[Case]:
    return list_cases(session, search_field, query)


def get_case_history(
    session: Session, case_id: int
) -> tuple[Case, list[OutcomeAuditEntry]]:
    case = get_case(session, case_id)
    return case, list_audit_entries(session, case.id)
