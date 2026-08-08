"use client"

import { FormEvent, useEffect, useState } from "react"
import {
  AlertCircle,
  ClipboardList,
  Database,
  Search,
  ShieldCheck,
} from "lucide-react"

import { CaseDetailSheet } from "@/components/case-detail-sheet"
import { TrendView } from "@/components/trend-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCases, type CaseDetail, type CaseListItem } from "@/lib/api"
import { AppView, CaseFilter, CaseStatus, DateFormat, OutcomeValue, Pagination, Role, SearchField, UiText } from "@/lib/constants"

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))
}

function outcomeLabel(outcome: string | null): string {
  if (!outcome) {
    return UiText.UNRECORDED_OUTCOME
  }
  return outcome.replaceAll("_", " ")
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@")
  return `${localPart.charAt(0)}*****@${domain}`
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, DateFormat.MONTH_PREFIX_LENGTH)
}

function currentYearStart(): string {
  return `${new Date().getUTCFullYear()}-${DateFormat.YEAR_START_MONTH}`
}

function StatusBadge({ status }: { status: string }) {
  const isResolved = status === CaseStatus.RESOLVED
  return (
    <Badge
      className={
        isResolved
          ? "rounded-sm border-emerald-200 bg-emerald-50 text-emerald-700"
          : "rounded-sm border-blue-200 bg-blue-50 text-blue-700"
      }
      variant="outline"
    >
      {status}
    </Badge>
  )
}

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) {
    return (
      <Badge className="rounded-sm border-slate-200 bg-slate-50 text-slate-600" variant="outline">
        {UiText.UNRECORDED_OUTCOME}
      </Badge>
    )
  }

  const colorClass = outcome === OutcomeValue.WON
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : outcome === OutcomeValue.LOST
      ? "border-red-200 bg-red-50 text-red-700"
      : outcome === OutcomeValue.FRAUD_CONFIRMED
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-slate-200 bg-slate-50 text-slate-600"

  return (
    <Badge className={`rounded-sm capitalize ${colorClass}`} variant="outline">
      {outcomeLabel(outcome)}
    </Badge>
  )
}

function DataQualityBadge({ hasIssue }: { hasIssue: boolean }) {
  if (!hasIssue) {
    return <span className="text-xs text-slate-500">—</span>
  }

  return (
    <Badge className="rounded-sm border-amber-200 bg-amber-50 text-amber-800" variant="outline">
      {UiText.DATA_QUALITY_ISSUE}
    </Badge>
  )
}

function LoadingRows() {
  return (
    <TableBody>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: 10 }).map((__, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}

export default function Home() {
  const initialEndMonth = currentMonth()
  const initialStartMonth = currentYearStart()
  const [cases, setCases] = useState<CaseListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchField, setSearchField] = useState(SearchField.USER_ID)
  const [searchTerm, setSearchTerm] = useState("")
  const [startMonth, setStartMonth] = useState(initialStartMonth)
  const [endMonth, setEndMonth] = useState(initialEndMonth)
  const [region, setRegion] = useState("")
  const [statusFilter, setStatusFilter] = useState(CaseFilter.ALL)
  const [dataQualityFilter, setDataQualityFilter] = useState(CaseFilter.ALL)
  const [submittedQuery, setSubmittedQuery] = useState({
    endMonth: initialEndMonth,
    field: SearchField.USER_ID,
    page: Pagination.DEFAULT_PAGE,
    region: "",
    startMonth: initialStartMonth,
    status: CaseFilter.ALL,
    dataQuality: CaseFilter.ALL,
    term: "",
  })
  const [role, setRole] = useState(Role.ANALYST)
  const [activeView, setActiveView] = useState(AppView.CASES)
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    getCases({
      endMonth: submittedQuery.endMonth,
      hasDataQualityIssue: submittedQuery.dataQuality === CaseFilter.DATA_QUALITY_ISSUES
        ? true
        : undefined,
      page: submittedQuery.page,
      region: submittedQuery.region,
      searchField: submittedQuery.field,
      searchTerm: submittedQuery.term,
      startMonth: submittedQuery.startMonth,
      status: submittedQuery.status === CaseFilter.ALL ? undefined : submittedQuery.status,
    })
      .then((response) => {
        if (!active) return
        setCases(response.items)
        setTotal(response.total)
      })
      .catch(() => active && setError(UiText.API_ERROR))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [submittedQuery])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (startMonth && endMonth && startMonth > endMonth) {
      setError(UiText.MONTH_RANGE_INVALID)
      return
    }
    setLoading(true)
    setError(null)
    setSubmittedQuery({
      endMonth,
      field: searchField,
      page: Pagination.DEFAULT_PAGE,
      region: region.trim(),
      startMonth,
      status: statusFilter,
      dataQuality: dataQualityFilter,
      term: searchTerm.trim(),
    })
  }

  function resetFilters() {
    setEndMonth(initialEndMonth)
    setError(null)
    setLoading(true)
    setRegion("")
    setSearchField(SearchField.USER_ID)
    setSearchTerm("")
    setStartMonth(initialStartMonth)
    setStatusFilter(CaseFilter.ALL)
    setDataQualityFilter(CaseFilter.ALL)
    setSubmittedQuery({
      endMonth: initialEndMonth,
      field: SearchField.USER_ID,
      page: Pagination.DEFAULT_PAGE,
      region: "",
      startMonth: initialStartMonth,
      status: CaseFilter.ALL,
      dataQuality: CaseFilter.ALL,
      term: "",
    })
  }

  function changePage(page: number) {
    setLoading(true)
    setError(null)
    setSubmittedQuery((currentQuery) => ({ ...currentQuery, page }))
  }

  function handleCaseUpdated(updatedCase: CaseDetail) {
    setCases((currentCases) => currentCases.map((caseItem) => (
      caseItem.id === updatedCase.id
        ? {
            ...caseItem,
            outcome: updatedCase.outcome,
            status: updatedCase.status,
          }
        : caseItem
    )))
  }

  const isSearching = submittedQuery.term.length > 0 || submittedQuery.region.length > 0 || submittedQuery.status !== CaseFilter.ALL || submittedQuery.dataQuality !== CaseFilter.ALL || submittedQuery.startMonth.length > 0 || submittedQuery.endMonth.length > 0
  const pageCount = Math.ceil(total / Pagination.DEFAULT_LIMIT)
  const searchPlaceholder = searchField === SearchField.EMAIL
    ? "Search email"
    : searchField === SearchField.DEVICE_ID
      ? "Search device ID"
      : "Search user ID"

  return (
    <main className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-200 bg-white px-5">
        <div className="flex min-w-56 items-center gap-7">
          <span className="text-lg font-semibold tracking-tight">{UiText.PRODUCT_NAME}</span>
          <nav aria-label="Primary navigation" className="flex h-14 items-center gap-5 text-sm font-medium">
            <button
              className={`flex h-14 items-center border-b-2 ${activeView === AppView.CASES ? "border-[#004ac6] text-[#004ac6]" : "border-transparent text-slate-500"}`}
              onClick={() => setActiveView(AppView.CASES)}
              type="button"
            >
              {UiText.CASES}
            </button>
            <button
              className={`flex h-14 items-center border-b-2 ${activeView === AppView.TRENDS ? "border-[#004ac6] text-[#004ac6]" : "border-transparent text-slate-500"}`}
              onClick={() => {
                setActiveView(AppView.TRENDS)
                setSelectedCaseId(null)
              }}
              type="button"
            >
              {UiText.TRENDS}
            </button>
          </nav>
        </div>
        {activeView === AppView.CASES && (
          <form className="mx-auto hidden w-full max-w-xl lg:block" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="header-search">{searchPlaceholder}</label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              className="h-9 border-slate-300 bg-[#eff4ff] pl-9"
              id="header-search"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              value={searchTerm}
            />
          </div>
          </form>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden text-slate-500 xl:inline">Acting as</span>
          <Select onValueChange={(value) => value && setRole(value)} value={role}>
            <SelectTrigger aria-label="Acting as role" className="h-8 min-w-28 border-slate-300 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Role.ANALYST}>{UiText.ANALYST}</SelectItem>
              <SelectItem value={Role.MANAGER}>{UiText.MANAGER}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-[#eff4ff] p-5 md:flex md:flex-col">
          <div className="flex items-start gap-3">
            <div className="rounded-sm bg-[#dbe1ff] p-2 text-[#004ac6]">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Dispute Queue</p>
              <p className="text-xs text-slate-500">Operational view</p>
            </div>
          </div>
          <div className="mt-10 flex items-center gap-3 rounded-sm bg-[#dbe1ff] px-3 py-2 text-sm font-medium text-[#003ea8]">
            <ClipboardList className="size-4" />
            {UiText.CASES}
          </div>
          <div className="mt-auto">
            <Separator className="mb-4 bg-slate-200" />
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Database className="size-4" />
              Local API connected
            </div>
          </div>
        </aside>

        {activeView === AppView.CASES ? (
        <section className="min-w-0 flex-1 p-5 md:p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{UiText.CASES}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Review dispute cases and inspect recorded outcomes.
              </p>
            </div>
            <form className="flex w-full max-w-lg gap-2 lg:hidden" onSubmit={submitSearch}>
              <label className="sr-only" htmlFor="mobile-search">{searchPlaceholder}</label>
              <Input
                id="mobile-search"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
                value={searchTerm}
              />
            </form>
            <form className="flex flex-wrap items-center gap-2" onSubmit={submitSearch}>
              <Select onValueChange={(value) => value && setSearchField(value)} value={searchField}>
                <SelectTrigger aria-label="Search field" className="h-9 min-w-32 border-slate-300 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SearchField.USER_ID}>User ID</SelectItem>
                  <SelectItem value={SearchField.DEVICE_ID}>Device ID</SelectItem>
                  <SelectItem value={SearchField.EMAIL}>Email</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <label className="sr-only" htmlFor="start-month">Start month</label>
                <Input
                  className="h-9 w-36 border-slate-300 bg-white"
                  id="start-month"
                  onChange={(event) => setStartMonth(event.target.value)}
                  type="month"
                  value={startMonth}
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="end-month">End month</label>
                <Input
                  className="h-9 w-36 border-slate-300 bg-white"
                  id="end-month"
                  onChange={(event) => setEndMonth(event.target.value)}
                  type="month"
                  value={endMonth}
                />
              </div>
              <Select onValueChange={(value) => value && setStatusFilter(value)} value={statusFilter}>
                <SelectTrigger aria-label="Status filter" className="h-9 min-w-30 border-slate-300 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CaseFilter.ALL}>All statuses</SelectItem>
                  <SelectItem value={CaseStatus.OPEN}>Open</SelectItem>
                  <SelectItem value={CaseStatus.RESOLVED}>Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => value && setDataQualityFilter(value)} value={dataQualityFilter}>
                <SelectTrigger aria-label="Data quality filter" className="h-9 min-w-36 border-slate-300 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CaseFilter.ALL}>{UiText.ALL_DATA}</SelectItem>
                  <SelectItem value={CaseFilter.DATA_QUALITY_ISSUES}>{UiText.DATA_QUALITY_ISSUES_ONLY}</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <label className="sr-only" htmlFor="region-filter">Region</label>
                <Input
                  className="h-9 w-32 border-slate-300 bg-white"
                  id="region-filter"
                  onChange={(event) => setRegion(event.target.value)}
                  placeholder="Region"
                  value={region}
                />
              </div>
              <Button className="h-9" type="submit" variant="outline">Apply</Button>
              <Button className="h-9" onClick={resetFilters} type="button" variant="ghost">Reset</Button>
              <span className="text-xs text-slate-500">
                {role === Role.MANAGER ? "Read-only review" : "Analyst review"}
              </span>
            </form>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              <AlertCircle className="size-4" />
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-sm border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#eff4ff] px-4 py-3">
              <p className="text-sm font-semibold">All disputes</p>
              <p className="text-xs text-slate-500">
                {loading ? "Loading cases…" : `${total} ${total === 1 ? "case" : "cases"}`}
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#eff4ff]">
                  <TableRow className="hover:bg-[#eff4ff]">
                    <TableHead>Case ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Device ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>{UiText.DATA_QUALITY}</TableHead>
                  </TableRow>
                </TableHeader>
                {loading ? (
                  <LoadingRows />
                ) : (
                  <TableBody>
                    {cases.map((caseItem) => (
                      <TableRow className="h-10" key={caseItem.id}>
                        <TableCell className="py-2 font-mono text-xs font-medium">
                          <button
                            className="rounded-sm text-left text-[#004ac6] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004ac6]"
                            onClick={() => setSelectedCaseId(caseItem.id)}
                            type="button"
                          >
                            {caseItem.case_id}
                          </button>
                        </TableCell>
                        <TableCell className="py-2 font-mono text-xs">{caseItem.user_id ?? "—"}</TableCell>
                        <TableCell className="py-2 font-mono text-xs">{caseItem.device_id}</TableCell>
                        <TableCell className="py-2 text-xs">{maskEmail(caseItem.user_email)}</TableCell>
                        <TableCell className="py-2 text-sm">{formatDate(caseItem.created_at)}</TableCell>
                        <TableCell className="py-2 text-sm">{caseItem.region}</TableCell>
                        <TableCell className="py-2 text-right font-mono text-xs">
                          {formatAmount(caseItem.amount, caseItem.currency)}
                        </TableCell>
                        <TableCell className="py-2"><StatusBadge status={caseItem.status} /></TableCell>
                        <TableCell className="py-2"><OutcomeBadge outcome={caseItem.outcome} /></TableCell>
                        <TableCell className="py-2">
                          <DataQualityBadge hasIssue={caseItem.has_data_quality_issue} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
            </div>
            {!loading && !error && cases.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="font-medium text-slate-800">
                  {isSearching ? "No search results" : "No cases available"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {isSearching
                    ? "Try a different value or search field."
                    : "Seed the local database and refresh this page."}
                </p>
              </div>
            )}
            {!loading && !error && total > 0 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Page {submittedQuery.page} of {pageCount}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={submittedQuery.page === Pagination.DEFAULT_PAGE}
                    onClick={() => changePage(submittedQuery.page - 1)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: pageCount }).map((_, index) => {
                    const page = index + Pagination.DEFAULT_PAGE
                    return (
                      <Button
                        key={page}
                        onClick={() => changePage(page)}
                        size="sm"
                        type="button"
                        variant={submittedQuery.page === page ? "default" : "outline"}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  <Button
                    disabled={submittedQuery.page >= pageCount}
                    onClick={() => changePage(submittedQuery.page + 1)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
        ) : (
          <TrendView />
        )}
      </div>

      {selectedCaseId !== null && (
        <CaseDetailSheet
          caseId={selectedCaseId}
          key={selectedCaseId}
          onCaseUpdated={handleCaseUpdated}
          onOpenChange={(open) => !open && setSelectedCaseId(null)}
          role={role}
        />
      )}
    </main>
  )
}
