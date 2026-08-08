from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.constants import CaseStatus, SearchField
from app.data_quality import case_data_quality_issues
from app.models import Case


SearchFieldValue = Literal[
    SearchField.USER_ID,
    SearchField.DEVICE_ID,
    SearchField.EMAIL,
]

CaseStatusValue = Literal[CaseStatus.OPEN, CaseStatus.RESOLVED]


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_id: str
    user_id: str | None
    user_email: str
    device_id: str
    amount: float
    currency: str
    created_at: str
    region: str
    status: str
    outcome: str | None
    has_data_quality_issue: bool = False
    data_quality_issues: list[str] = Field(default_factory=list)


class CaseDetailResponse(CaseResponse):
    outcome_note: str | None


def case_response(case: Case, duplicate_ids: set[str]) -> CaseResponse:
    issues = case_data_quality_issues(case, duplicate_ids)
    return CaseResponse.model_validate(case).model_copy(
        update={
            "has_data_quality_issue": bool(issues),
            "data_quality_issues": issues,
        }
    )


def case_detail_response(case: Case, duplicate_ids: set[str]) -> CaseDetailResponse:
    issues = case_data_quality_issues(case, duplicate_ids)
    return CaseDetailResponse.model_validate(case).model_copy(
        update={
            "has_data_quality_issue": bool(issues),
            "data_quality_issues": issues,
        }
    )


class CaseListResponse(BaseModel):
    items: list[CaseResponse]
    total: int


class OutcomeAuditEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type: str
    previous_outcome: str | None
    new_outcome: str
    previous_note: str | None
    new_note: str | None
    editor_role: str
    changed_at: str


class CaseHistoryResponse(BaseModel):
    id: int
    case_id: str
    entries: list[OutcomeAuditEntryResponse]
