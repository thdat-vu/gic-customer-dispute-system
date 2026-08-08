export class ApiConfig {
  static readonly BASE_URL = "http://localhost:8000/api"
}

export class ApiPath {
  static readonly CASES = "/cases"
  static readonly CASE_DETAIL = "/cases/{caseId}"
  static readonly CASE_OUTCOME = "/cases/{caseId}/outcome"
  static readonly CASE_HISTORY = "/cases/{caseId}/history"
  static readonly TRENDS = "/trends"
}

export class AppView {
  static readonly CASES = "cases"
  static readonly TRENDS = "trends"
}

export class Role {
  static readonly ANALYST = "analyst"
  static readonly MANAGER = "manager"
}

export class SearchField {
  static readonly USER_ID = "user_id"
  static readonly DEVICE_ID = "device_id"
  static readonly EMAIL = "email"
}

export class Pagination {
  static readonly DEFAULT_PAGE = 1
  static readonly DEFAULT_LIMIT = 20
}

export class DateFormat {
  static readonly MONTH_DISPLAY_FORMAT = "MMMM yyyy"
  static readonly MONTH_PAD_CHARACTER = "0"
  static readonly MONTH_PAD_LENGTH = 2
  static readonly MONTH_PREFIX_LENGTH = 7
  static readonly YEAR_START_MONTH = "01"
}

export class CaseFilter {
  static readonly ALL = "all"
  static readonly DATA_QUALITY_ISSUES = "data_quality_issues"
}

export class CaseStatus {
  static readonly OPEN = "open"
  static readonly RESOLVED = "resolved"
}

export class OutcomeValue {
  static readonly WON = "won"
  static readonly LOST = "lost"
  static readonly FRAUD_CONFIRMED = "fraud_confirmed"
}

export class DataQualityIssue {
  static readonly CASE_ID_DUPLICATE = "case_id_duplicate"
  static readonly FUTURE_CREATED_AT = "future_created_at"
  static readonly INVALID_OUTCOME = "invalid_outcome"
  static readonly MISSING_USER_ID = "missing_user_id"
  static readonly NEGATIVE_AMOUNT = "negative_amount"
  static readonly STATUS_OUTCOME_MISMATCH = "status_outcome_mismatch"
}

export class DataQualityIssueLabel {
  static readonly CASE_ID_DUPLICATE = "Duplicate external case ID"
  static readonly FUTURE_CREATED_AT = "Future created date"
  static readonly INVALID_OUTCOME = "Invalid historical outcome"
  static readonly MISSING_USER_ID = "Missing user ID"
  static readonly NEGATIVE_AMOUNT = "Negative amount"
  static readonly STATUS_OUTCOME_MISMATCH = "Status and outcome do not match"
}

export class TrendGroup {
  static readonly MONTH = "month"
  static readonly REGION = "region"
}

export class ValidationLimit {
  static readonly OUTCOME_NOTE_LENGTH = 1000
}

export class UiText {
  static readonly PRODUCT_NAME = "Dispute Ops"
  static readonly CASES = "Cases"
  static readonly TRENDS = "Trends"
  static readonly ANALYST = "Analyst"
  static readonly MANAGER = "Manager"
  static readonly UNRECORDED_OUTCOME = "Unrecorded"
  static readonly API_ERROR = "Something went wrong. Please try again."
  static readonly OUTCOME_REQUIRED = "Choose an outcome before saving."
  static readonly MONTH_RANGE_INVALID = "Start month must not be after end month."
  static readonly SAVE_OUTCOME = "Save outcome"
  static readonly OUTCOME_SAVED = "Outcome saved."
  static readonly DATA_QUALITY = "Data quality"
  static readonly DATA_QUALITY_ISSUE = "Data issue"
  static readonly DATA_QUALITY_NEEDS_REVIEW = "Needs review"
  static readonly DATA_QUALITY_PRESERVES_SOURCE = "This indicator preserves the source record and does not change its outcome workflow."
  static readonly ALL_DATA = "All data"
  static readonly DATA_QUALITY_ISSUES_ONLY = "Data issues only"
}
