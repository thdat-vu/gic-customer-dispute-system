from sqlalchemy.orm import Session

from app.constants import AuditEventType, CaseStatus
from app.models import Case, OutcomeAuditEntry
from app.repositories import add_audit_entry, get_case_by_id
from app.schemas import OutcomeSubmission


class CaseNotFoundError(LookupError):
    """Raised for a missing surrogate case identifier."""


def record_outcome(
    session: Session, case_id: int, submission: OutcomeSubmission
) -> Case:
    """Capture an open case or correct a resolved case in one transaction."""
    case = get_case_by_id(session, case_id)
    if case is None:
        raise CaseNotFoundError(f"No case found with id {case_id}")

    if case.status == CaseStatus.RESOLVED:
        if (
            case.outcome == submission.outcome
            and case.outcome_note == submission.outcome_note
        ):
            return case

        event_type = AuditEventType.CORRECTED
        previous_outcome = case.outcome
        previous_note = case.outcome_note
    else:
        event_type = AuditEventType.CAPTURED
        previous_outcome = None
        previous_note = None
        case.status = CaseStatus.RESOLVED

    case.outcome = submission.outcome
    case.outcome_note = submission.outcome_note
    add_audit_entry(
        session,
        OutcomeAuditEntry(
            case_ref_id=case.id,
            event_type=event_type,
            previous_outcome=previous_outcome,
            new_outcome=submission.outcome,
            previous_note=previous_note,
            new_note=submission.outcome_note,
            editor_role=submission.editor_role,
        ),
    )
    session.commit()
    session.refresh(case)
    return case
