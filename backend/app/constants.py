class CaseStatus:
    OPEN = "open"
    RESOLVED = "resolved"


class OutcomeValue:
    WON = "won"
    LOST = "lost"
    FRAUD_CONFIRMED = "fraud_confirmed"
    ALL = (WON, LOST, FRAUD_CONFIRMED)


class AuditEventType:
    CAPTURED = "captured"
    CORRECTED = "corrected"


class ValidationLimit:
    OUTCOME_NOTE_LENGTH = 1000
