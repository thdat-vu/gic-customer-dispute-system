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

type CaseListResponse = {
  items: CaseListItem[]
  total: number
}

type ApiErrorResponse = {
  error?: {
    message?: string
  }
}

function caseDetailPath(caseId: number): string {
  return ApiPath.CASE_DETAIL.replace("{caseId}", String(caseId))
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${ApiConfig.BASE_URL}${path}`)
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(payload?.error?.message)
  }
  return (await response.json()) as T
}

export async function getCases(
  searchField?: string,
  searchTerm?: string,
): Promise<CaseListResponse> {
  const parameters = new URLSearchParams()
  if (searchField && searchTerm) {
    parameters.set("search_field", searchField)
    parameters.set("q", searchTerm)
  }
  const query = parameters.size > 0 ? `?${parameters.toString()}` : ""
  return request<CaseListResponse>(`${ApiPath.CASES}${query}`)
}

export function getCaseDetail(caseId: number): Promise<CaseDetail> {
  return request<CaseDetail>(caseDetailPath(caseId))
}
