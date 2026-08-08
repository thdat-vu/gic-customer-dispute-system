from sqlalchemy.orm import Session

from app.constants import ApiMessage
from app.data_quality import case_data_quality_issues
from app.models import Case, OutcomeAuditEntry
from app.repositories import (
    count_cases,
    duplicate_case_ids,
    get_case_by_id,
    list_audit_entries,
    list_cases,
    list_filtered_cases,
)
from app.services.errors import CaseNotFoundError


def get_case(session: Session, case_id: int) -> Case:
    case = get_case_by_id(session, case_id)
    if case is None:
        raise CaseNotFoundError(ApiMessage.CASE_NOT_FOUND.format(case_id=case_id))
    return case


def get_cases(
    session: Session,
    search_field: str | None = None,
    query: str | None = None,
    region: str | None = None,
    status: str | None = None,
    start_month: str | None = None,
    end_month: str | None = None,
    page: int = 1,
    limit: int = 20,
    has_data_quality_issue: bool | None = None,
) -> tuple[list[Case], int, set[str]]:
    duplicate_ids = duplicate_case_ids(session)
    if has_data_quality_issue is None:
        return (
            list_cases(
                session, search_field, query, region, status, start_month, end_month, page, limit
            ),
            count_cases(session, search_field, query, region, status, start_month, end_month),
            duplicate_ids,
        )

    matching_cases = [
        case
        for case in list_filtered_cases(
            session, search_field, query, region, status, start_month, end_month
        )
        if bool(case_data_quality_issues(case, duplicate_ids)) == has_data_quality_issue
    ]
    offset = (page - 1) * limit
    return matching_cases[offset : offset + limit], len(matching_cases), duplicate_ids


def get_case_history(
    session: Session, case_id: int
) -> tuple[Case, list[OutcomeAuditEntry]]:
    case = get_case(session, case_id)
    return case, list_audit_entries(session, case.id)
