from datetime import UTC, datetime

from app.constants import CaseStatus, DataQualityIssue, OutcomeValue
from app.models import Case


def case_data_quality_issues(
    case: Case,
    duplicate_ids: set[str],
    now: datetime | None = None,
) -> list[str]:
    issues: list[str] = []
    reference_time = now or datetime.now(UTC)
    created_at = datetime.fromisoformat(case.created_at.replace("Z", "+00:00"))

    if case.case_id in duplicate_ids:
        issues.append(DataQualityIssue.CASE_ID_DUPLICATE)
    if case.user_id is None:
        issues.append(DataQualityIssue.MISSING_USER_ID)
    if case.amount < 0:
        issues.append(DataQualityIssue.NEGATIVE_AMOUNT)
    if created_at > reference_time:
        issues.append(DataQualityIssue.FUTURE_CREATED_AT)
    if case.outcome is not None and case.outcome not in OutcomeValue.ALL:
        issues.append(DataQualityIssue.INVALID_OUTCOME)
    if (case.status == CaseStatus.OPEN and case.outcome is not None) or (
        case.status == CaseStatus.RESOLVED and case.outcome is None
    ):
        issues.append(DataQualityIssue.STATUS_OUTCOME_MISMATCH)
    return issues
