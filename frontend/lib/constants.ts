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
  static readonly MONTH_PREFIX_LENGTH = 7
  static readonly YEAR_START_MONTH = "01"
}

export class CaseFilter {
  static readonly ALL = "all"
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
}
