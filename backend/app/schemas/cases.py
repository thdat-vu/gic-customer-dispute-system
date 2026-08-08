from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.constants import SearchField


SearchFieldValue = Literal[
    SearchField.USER_ID,
    SearchField.DEVICE_ID,
    SearchField.EMAIL,
]


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


class CaseDetailResponse(CaseResponse):
    outcome_note: str | None


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
