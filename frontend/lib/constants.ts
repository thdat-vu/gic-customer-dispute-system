export class ApiConfig {
  static readonly BASE_URL = "http://localhost:8000/api"
}

export class ApiPath {
  static readonly CASES = "/cases"
  static readonly CASE_DETAIL = "/cases/{caseId}"
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

export class CaseStatus {
  static readonly OPEN = "open"
  static readonly RESOLVED = "resolved"
}

export class OutcomeValue {
  static readonly WON = "won"
  static readonly LOST = "lost"
  static readonly FRAUD_CONFIRMED = "fraud_confirmed"
}

export class UiText {
  static readonly PRODUCT_NAME = "Dispute Ops"
  static readonly CASES = "Cases"
  static readonly TRENDS = "Trends"
  static readonly ANALYST = "Analyst"
  static readonly MANAGER = "Manager"
  static readonly UNRECORDED_OUTCOME = "Unrecorded"
  static readonly API_ERROR = "Something went wrong. Please try again."
}
