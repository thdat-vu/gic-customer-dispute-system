from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session

from app.constants import ApiMessage, ApiRoute, MonthRange, Pagination, TrendGroupBy
from app.database import get_session
from app.schemas import (
    CaseDetailResponse,
    CaseHistoryResponse,
    CaseListResponse,
    ErrorResponse,
    OutcomeSubmission,
    TrendResponse,
)
from app.schemas.cases import CaseStatusValue, SearchFieldValue
from app.services import (
    get_case,
    get_case_history,
    get_cases,
    record_outcome,
    resolved_outcome_counts,
)
from app.schemas.trends import TrendGroupByValue


router = APIRouter(prefix=ApiRoute.PREFIX)
DatabaseSession = Annotated[Session, Depends(get_session)]
ValidationErrorResponse = {status.HTTP_422_UNPROCESSABLE_CONTENT: {"model": ErrorResponse}}
NotFoundAndValidationErrorResponses = {
    status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
    **ValidationErrorResponse,
}


@router.get(
    ApiRoute.CASES,
    response_model=CaseListResponse,
    responses=ValidationErrorResponse,
)
def list_cases(
    database_session: DatabaseSession,
    search_field: SearchFieldValue | None = None,
    q: str | None = None,
    region: str | None = None,
    case_status: Annotated[CaseStatusValue | None, Query(alias="status")] = None,
    page: int = Query(default=Pagination.DEFAULT_PAGE, ge=Pagination.DEFAULT_PAGE),
    limit: int = Query(default=Pagination.DEFAULT_LIMIT, ge=1, le=Pagination.MAX_LIMIT),
    start_month: Annotated[str | None, Query(pattern=MonthRange.PATTERN)] = None,
    end_month: Annotated[str | None, Query(pattern=MonthRange.PATTERN)] = None,
) -> CaseListResponse:
    if (search_field is None) != (q is None):
        raise RequestValidationError(
            [
                {
                    "type": "value_error",
                    "loc": ("query", "search_field"),
                    "msg": ApiMessage.SEARCH_PARAMETERS_REQUIRED_TOGETHER,
                    "input": search_field,
                }
            ]
        )
    if start_month is not None and end_month is not None and start_month > end_month:
        raise RequestValidationError(
            [
                {
                    "type": "value_error",
                    "loc": ("query", "start_month"),
                    "msg": ApiMessage.START_MONTH_MUST_NOT_FOLLOW_END_MONTH,
                    "input": start_month,
                }
            ]
        )
    cases, total = get_cases(
        database_session,
        search_field,
        q,
        region,
        case_status,
        start_month,
        end_month,
        page,
        limit,
    )
    return CaseListResponse(items=cases, total=total)


@router.get(
    ApiRoute.CASE_DETAIL,
    response_model=CaseDetailResponse,
    responses=NotFoundAndValidationErrorResponses,
)
def get_case_detail(case_id: int, database_session: DatabaseSession) -> CaseDetailResponse:
    return CaseDetailResponse.model_validate(get_case(database_session, case_id))


@router.post(
    ApiRoute.CASE_OUTCOME,
    response_model=CaseDetailResponse,
    responses=NotFoundAndValidationErrorResponses,
)
def save_case_outcome(
    case_id: int,
    submission: OutcomeSubmission,
    database_session: DatabaseSession,
) -> CaseDetailResponse:
    return CaseDetailResponse.model_validate(
        record_outcome(database_session, case_id, submission)
    )


@router.get(
    ApiRoute.CASE_HISTORY,
    response_model=CaseHistoryResponse,
    responses=NotFoundAndValidationErrorResponses,
)
def get_history(case_id: int, database_session: DatabaseSession) -> CaseHistoryResponse:
    case, entries = get_case_history(database_session, case_id)
    return CaseHistoryResponse(id=case.id, case_id=case.case_id, entries=entries)


@router.get(
    ApiRoute.TRENDS,
    response_model=TrendResponse,
    responses=ValidationErrorResponse,
)
def get_trends(
    database_session: DatabaseSession,
    group_by: TrendGroupByValue = Query(default=TrendGroupBy.MONTH),
) -> TrendResponse:
    return TrendResponse(
        group_by=group_by,
        buckets=resolved_outcome_counts(database_session, group_by),
    )
