import { ApiConfig, ApiPath } from "@/lib/constants"

export type CaseListItem = {
  id: number
  case_id: string
  user_id: string | null
  user_email: string
  device_id: string
  amount: number
  currency: string
  created_at: string
  region: string
  status: string
  outcome: string | null
}

export type CaseDetail = CaseListItem & {
  outcome_note: string | null
}

export type OutcomeHistoryEntry = {
  id: number
  event_type: string
  previous_outcome: string | null
  new_outcome: string
  previous_note: string | null
  new_note: string | null
  editor_role: string
  changed_at: string
}

export type TrendBucket = {
  key: string
  won: number
  lost: number
  fraud_confirmed: number
}

export type TrendsResponse = {
  group_by: string
  buckets: TrendBucket[]
}

export type CaseListResponse = {
  items: CaseListItem[]
  total: number
}

export type CaseListQuery = {
  endMonth?: string
  page?: number
  region?: string
  searchField?: string
  searchTerm?: string
  startMonth?: string
  status?: string
}

type ApiErrorResponse = {
  error?: {
    message?: string
  }
}

type CaseHistoryResponse = {
  id: number
  case_id: string
  entries: OutcomeHistoryEntry[]
}

function caseDetailPath(caseId: number): string {
  return ApiPath.CASE_DETAIL.replace("{caseId}", String(caseId))
}

function casePath(path: string, caseId: number): string {
  return path.replace("{caseId}", String(caseId))
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ApiConfig.BASE_URL}${path}`, init)
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(payload?.error?.message)
  }
  return (await response.json()) as T
}

export async function getCases({
  endMonth,
  page,
  region,
  searchField,
  searchTerm,
  startMonth,
  status,
}: CaseListQuery = {}): Promise<CaseListResponse> {
  const parameters = new URLSearchParams()
  if (searchField && searchTerm) {
    parameters.set("search_field", searchField)
    parameters.set("q", searchTerm)
  }
  if (page) {
    parameters.set("page", String(page))
  }
  if (startMonth) {
    parameters.set("start_month", startMonth)
  }
  if (endMonth) {
    parameters.set("end_month", endMonth)
  }
  if (region) {
    parameters.set("region", region)
  }
  if (status) {
    parameters.set("status", status)
  }
  const query = parameters.size > 0 ? `?${parameters.toString()}` : ""
  return request<CaseListResponse>(`${ApiPath.CASES}${query}`)
}

export function getCaseDetail(caseId: number): Promise<CaseDetail> {
  return request<CaseDetail>(caseDetailPath(caseId))
}

export function saveOutcome(
  caseId: number,
  outcome: string,
  outcomeNote: string | null,
  editorRole: string,
): Promise<CaseDetail> {
  return request<CaseDetail>(casePath(ApiPath.CASE_OUTCOME, caseId), {
    body: JSON.stringify({
      outcome,
      outcome_note: outcomeNote,
      editor_role: editorRole,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
}

export async function getCaseHistory(caseId: number): Promise<OutcomeHistoryEntry[]> {
  const response = await request<CaseHistoryResponse>(casePath(ApiPath.CASE_HISTORY, caseId))
  return response.entries
}

export function getTrends(groupBy: string): Promise<TrendsResponse> {
  const parameters = new URLSearchParams({ group_by: groupBy })
  return request<TrendsResponse>(`${ApiPath.TRENDS}?${parameters.toString()}`)
}
