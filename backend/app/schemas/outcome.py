from typing import Literal

from pydantic import BaseModel, Field

from app.constants import OutcomeValue, ValidationLimit

ValidatedOutcome = Literal[
    OutcomeValue.WON,
    OutcomeValue.LOST,
    OutcomeValue.FRAUD_CONFIRMED,
]


class OutcomeSubmission(BaseModel):
    """Validated input shared by the later HTTP boundary and service tests."""

    outcome: ValidatedOutcome
    outcome_note: str | None = Field(
        default=None, max_length=ValidationLimit.OUTCOME_NOTE_LENGTH
    )
    editor_role: str
