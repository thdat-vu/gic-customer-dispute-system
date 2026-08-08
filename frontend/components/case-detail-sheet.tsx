"use client"

import { type ReactNode, useEffect, useState } from "react"
import { AlertCircle, ClipboardList } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getCaseDetail, type CaseDetail } from "@/lib/api"
import { CaseStatus, UiText } from "@/lib/constants"

type CaseDetailSheetProps = {
  caseId: number
  onOpenChange: (open: boolean) => void
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
    { label: "Outcome", value: caseDetail.outcome ?? UiText.UNRECORDED_OUTCOME },
    { label: "Outcome note", value: caseDetail.outcome_note ?? "—", fullWidth: true },
  ]

  return (
    <div className="space-y-6 px-5 pb-6">
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
            <dd className="mt-1 font-mono text-xs text-slate-900">
              {caseDetail.user_id ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-900">
              {caseDetail.user_email}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Device ID</dt>
            <dd className="mt-1 font-mono text-xs text-slate-900">{caseDetail.device_id}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

export function CaseDetailSheet({ caseId, onOpenChange }: CaseDetailSheetProps) {
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

  return (
    <Sheet onOpenChange={onOpenChange} open>
      <SheetContent className="gap-0 overflow-y-auto bg-[#f8f9ff] p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-slate-200 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 font-mono text-base font-semibold">
            <ClipboardList className="size-4 text-[#004ac6]" />
            {caseDetail?.case_id ?? "Case detail"}
          </SheetTitle>
          <SheetDescription>
            Read-only detail. Outcome editing and history are available in later milestones.
          </SheetDescription>
        </SheetHeader>
        <div className="pt-6">
          {loading && <p className="px-5 text-sm text-slate-500">Loading case detail…</p>}
          {error && (
            <div className="mx-5 flex gap-2 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}
          {caseDetail && <DetailContent caseDetail={caseDetail} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
