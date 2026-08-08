"use client"

import { type FormEvent, type ReactNode, useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, ClipboardList, History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import {
  getCaseDetail,
  getCaseHistory,
  saveOutcome,
  type CaseDetail,
  type OutcomeHistoryEntry,
} from "@/lib/api"
import {
  CaseStatus,
  OutcomeValue,
  Role,
  UiText,
  ValidationLimit,
} from "@/lib/constants"

type CaseDetailSheetProps = {
  caseId: number
  onCaseUpdated: (caseDetail: CaseDetail) => void
  onOpenChange: (open: boolean) => void
  role: string
}

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

function formatOutcome(outcome: string | null): string {
  return outcome ? outcome.replaceAll("_", " ") : UiText.UNRECORDED_OUTCOME
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

function DetailContent({ caseDetail }: { caseDetail: CaseDetail }) {
  const fields: Array<{ label: string; value: ReactNode; fullWidth?: boolean }> = [
    { label: "Created", value: formatDate(caseDetail.created_at) },
    { label: "Amount", value: formatAmount(caseDetail.amount, caseDetail.currency) },
    { label: "Region", value: caseDetail.region },
    { label: "Status", value: <StatusBadge status={caseDetail.status} /> },
    { label: "Outcome", value: formatOutcome(caseDetail.outcome) },
    { label: "Outcome note", value: caseDetail.outcome_note ?? "—", fullWidth: true },
  ]

  return (
    <>
      <section>
        <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
          Case summary
        </p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          {fields.map(({ label, value, fullWidth }) => (
            <div className={fullWidth ? "col-span-2" : ""} key={label}>
              <dt className="text-slate-500">{label}</dt>
              <dd className="mt-1 font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <Separator />
      <section>
        <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
          Customer information
        </p>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-slate-500">User ID</dt>
            <dd className="mt-1 font-mono text-xs text-slate-900">{caseDetail.user_id ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-900">{caseDetail.user_email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Device ID</dt>
            <dd className="mt-1 font-mono text-xs text-slate-900">{caseDetail.device_id}</dd>
          </div>
        </dl>
      </section>
    </>
  )
}

function OutcomeEditor({
  caseDetail,
  onSaved,
  role,
}: {
  caseDetail: CaseDetail
  onSaved: (caseDetail: CaseDetail) => void
  role: string
}) {
  const [outcome, setOutcome] = useState(caseDetail.outcome ?? "")
  const [note, setNote] = useState(caseDetail.outcome_note ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const isCorrection = caseDetail.status === CaseStatus.RESOLVED

  function submitOutcome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!outcome) {
      setError(UiText.OUTCOME_REQUIRED)
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)
    saveOutcome(caseDetail.id, outcome, note || null, role)
      .then((updatedCase) => {
        onSaved(updatedCase)
        setSuccess(true)
      })
      .catch(() => setError(UiText.API_ERROR))
      .finally(() => setSaving(false))
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
          Outcome editor
        </p>
        {isCorrection && (
          <Badge className="rounded-sm border-amber-200 bg-amber-50 text-amber-800" variant="outline">
            Correction mode
          </Badge>
        )}
      </div>
      {isCorrection && (
        <p className="mb-3 text-xs text-amber-800">
          Saving changes a previously recorded final outcome.
        </p>
      )}
      <form className="space-y-4" onSubmit={submitOutcome}>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Outcome decision</legend>
          <div className="grid grid-cols-3 gap-2">
            {[OutcomeValue.WON, OutcomeValue.LOST, OutcomeValue.FRAUD_CONFIRMED].map((value) => (
              <Button
                className="h-auto min-h-9 whitespace-normal capitalize"
                key={value}
                onClick={() => setOutcome(value)}
                type="button"
                variant={outcome === value ? "default" : "outline"}
              >
                {formatOutcome(value)}
              </Button>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="outcome-note">
            Resolution note <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <Textarea
            id="outcome-note"
            maxLength={ValidationLimit.OUTCOME_NOTE_LENGTH}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add supporting context for this outcome."
            rows={4}
            value={note}
          />
        </div>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        {success && (
          <p className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" />
            {UiText.OUTCOME_SAVED}
          </p>
        )}
        <Button className="w-full" disabled={saving} type="submit">
          {saving ? "Saving…" : UiText.SAVE_OUTCOME}
        </Button>
      </form>
    </section>
  )
}

function HistorySection({ caseId }: { caseId: number }) {
  const [entries, setEntries] = useState<OutcomeHistoryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getCaseHistory(caseId)
      .then((history) => active && setEntries(history))
      .catch(() => active && setError(UiText.API_ERROR))
    return () => {
      active = false
    }
  }, [caseId])

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <History className="size-4 text-[#004ac6]" />
        <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">History</p>
      </div>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {entries === null && !error && <p className="text-sm text-slate-500">Loading history…</p>}
      {entries?.length === 0 && <p className="text-sm text-slate-500">No history yet.</p>}
      {entries && entries.length > 0 && (
        <ol className="space-y-3">
          {entries.map((entry) => (
            <li className="rounded-sm border border-slate-200 bg-white p-3 text-sm" key={entry.id}>
              <div className="flex items-center justify-between gap-2">
                <Badge className="rounded-sm capitalize" variant="secondary">{entry.event_type}</Badge>
                <time className="text-xs text-slate-500">{formatDate(entry.changed_at)}</time>
              </div>
              <p className="mt-2 font-medium text-slate-900">
                {formatOutcome(entry.previous_outcome)} → {formatOutcome(entry.new_outcome)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Note: {entry.previous_note ?? "—"} → {entry.new_note ?? "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Recorded as {entry.editor_role}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function CaseDetailSheet({ caseId, onCaseUpdated, onOpenChange, role }: CaseDetailSheetProps) {
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getCaseDetail(caseId)
      .then((detail) => active && setCaseDetail(detail))
      .catch(() => active && setError(UiText.API_ERROR))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [caseId])

  function handleCaseSaved(updatedCase: CaseDetail) {
    setCaseDetail(updatedCase)
    onCaseUpdated(updatedCase)
  }

  return (
    <Sheet onOpenChange={onOpenChange} open>
      <SheetContent className="gap-0 overflow-y-auto bg-[#f8f9ff] p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-slate-200 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 font-mono text-base font-semibold">
            <ClipboardList className="size-4 text-[#004ac6]" />
            {caseDetail?.case_id ?? "Case detail"}
          </SheetTitle>
          <SheetDescription>
            {role === Role.ANALYST ? "Record or correct the final outcome." : "Read-only case review and audit history."}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-5 py-6">
          {loading && <p className="text-sm text-slate-500">Loading case detail…</p>}
          {error && (
            <div className="flex gap-2 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}
          {caseDetail && (
            <>
              <DetailContent caseDetail={caseDetail} />
              <Separator />
              {role === Role.ANALYST ? (
                <OutcomeEditor caseDetail={caseDetail} onSaved={handleCaseSaved} role={role} />
              ) : (
                <HistorySection caseId={caseDetail.id} />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
