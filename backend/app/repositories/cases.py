from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.constants import SearchField
from app.models import Case, OutcomeAuditEntry


def get_case_by_id(session: Session, case_id: int) -> Case | None:
    return session.get(Case, case_id)


def add_audit_entry(session: Session, entry: OutcomeAuditEntry) -> None:
    session.add(entry)


def filtered_cases_statement(
    search_field: str | None = None,
    query: str | None = None,
    region: str | None = None,
    status: str | None = None,
    start_month: str | None = None,
    end_month: str | None = None,
):
    statement = select(Case)
    if search_field is not None and query is not None:
        search_column = {
            SearchField.USER_ID: Case.user_id,
            SearchField.DEVICE_ID: Case.device_id,
            SearchField.EMAIL: Case.user_email,
        }[search_field]
        statement = statement.where(func.lower(search_column).contains(query.lower()))

    created_month = func.substr(Case.created_at, 1, 7)
    if start_month is not None:
        statement = statement.where(created_month >= start_month)
    if end_month is not None:
        statement = statement.where(created_month <= end_month)
    if region is not None:
        statement = statement.where(func.lower(Case.region) == region.lower())
    if status is not None:
        statement = statement.where(Case.status == status)

    return statement


def list_cases(
    session: Session,
    search_field: str | None = None,
    query: str | None = None,
    region: str | None = None,
    status: str | None = None,
    start_month: str | None = None,
    end_month: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> list[Case]:
    statement = filtered_cases_statement(
        search_field, query, region, status, start_month, end_month
    )
    offset = (page - 1) * limit
    return list(
        session.scalars(
            statement.order_by(Case.created_at.desc()).offset(offset).limit(limit)
        )
    )


def list_filtered_cases(
    session: Session,
    search_field: str | None = None,
    query: str | None = None,
    region: str | None = None,
    status: str | None = None,
    start_month: str | None = None,
    end_month: str | None = None,
) -> list[Case]:
    statement = filtered_cases_statement(
        search_field, query, region, status, start_month, end_month
    )
    return list(session.scalars(statement.order_by(Case.created_at.desc())))


def count_cases(
    session: Session,
    search_field: str | None = None,
    query: str | None = None,
    region: str | None = None,
    status: str | None = None,
    start_month: str | None = None,
    end_month: str | None = None,
) -> int:
    statement = filtered_cases_statement(
        search_field, query, region, status, start_month, end_month
    )
    count_statement = select(func.count()).select_from(statement.subquery())
    return session.scalar(count_statement) or 0


def duplicate_case_ids(session: Session) -> set[str]:
    statement = (
        select(Case.case_id)
        .group_by(Case.case_id)
        .having(func.count(Case.id) > 1)
    )
    return set(session.scalars(statement))


def list_audit_entries(session: Session, case_ref_id: int) -> list[OutcomeAuditEntry]:
    statement = (
        select(OutcomeAuditEntry)
        .where(OutcomeAuditEntry.case_ref_id == case_ref_id)
        .order_by(OutcomeAuditEntry.changed_at.desc())
    )
    return list(session.scalars(statement))
