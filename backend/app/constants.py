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


class SearchField:
    USER_ID = "user_id"
    DEVICE_ID = "device_id"
    EMAIL = "email"


class Pagination:
    DEFAULT_PAGE = 1
    DEFAULT_LIMIT = 20
    MAX_LIMIT = 20


class MonthRange:
    PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"


class TrendGroupBy:
    MONTH = "month"
    REGION = "region"


class ApiRoute:
    PREFIX = "/api"
    CASES = "/cases"
    CASE_DETAIL = "/cases/{case_id}"
    CASE_OUTCOME = "/cases/{case_id}/outcome"
    CASE_HISTORY = "/cases/{case_id}/history"
    TRENDS = "/trends"


class ApiErrorCode:
    CASE_NOT_FOUND = "CASE_NOT_FOUND"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    HTTP_ERROR = "HTTP_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ApiMessage:
    CASE_NOT_FOUND = "No case found with id {case_id}"
    VALIDATION_ERROR = "Request failed validation."
    SEARCH_PARAMETERS_REQUIRED_TOGETHER = "search_field and q must be provided together"
    START_MONTH_MUST_NOT_FOLLOW_END_MONTH = "start_month must not follow end_month"
    HTTP_ERROR = "Request could not be completed."
    INTERNAL_ERROR = "Internal error, please try again."


class FrontendOrigin:
    LOCAL_DEVELOPMENT = "http://localhost:3000"
