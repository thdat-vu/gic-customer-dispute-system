"use client"

import { useEffect, useState } from "react"
import { AlertCircle, BarChart3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getTrends, type TrendBucket } from "@/lib/api"
import { OutcomeValue, TrendGroup, UiText } from "@/lib/constants"

function totalOutcomes(bucket: TrendBucket): number {
  return bucket.won + bucket.lost + bucket.fraud_confirmed
}

function OutcomeHeader({ outcome }: { outcome: string }) {
  const colorClass = outcome === OutcomeValue.WON
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : outcome === OutcomeValue.LOST
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-800"

  return (
    <Badge className={`rounded-sm capitalize ${colorClass}`} variant="outline">
      {outcome.replaceAll("_", " ")}
    </Badge>
  )
}

export function TrendView() {
  const [groupBy, setGroupBy] = useState(TrendGroup.MONTH)
  const [buckets, setBuckets] = useState<TrendBucket[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let active = true
    getTrends(groupBy)
      .then((response) => active && setBuckets(response.buckets))
      .catch(() => active && setError(UiText.API_ERROR))

    return () => {
      active = false
    }
  }, [groupBy, reloadCount])

  function changeGroup(value: string) {
    setBuckets(null)
    setError(null)
    setGroupBy(value)
  }

  function retry() {
    setBuckets(null)
    setError(null)
    setReloadCount((count) => count + 1)
  }

  const groupLabel = groupBy === TrendGroup.MONTH ? "Month" : "Region"

  return (
    <section className="min-w-0 flex-1 p-5 md:p-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dispute outcome trends</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resolved dispute outcomes grouped by case creation {groupLabel.toLowerCase()}.
          </p>
        </div>
        <div className="w-full max-w-44">
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="trend-group">
            Group by
          </label>
          <Select onValueChange={(value) => value && changeGroup(value)} value={groupBy}>
            <SelectTrigger aria-label="Trend grouping" className="h-9 border-slate-300 bg-white" id="trend-group">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TrendGroup.MONTH}>Month</SelectItem>
              <SelectItem value={TrendGroup.REGION}>Region</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          <span className="flex items-center gap-2"><AlertCircle className="size-4" />{error}</span>
          <Button onClick={retry} size="sm" type="button" variant="outline">
            Retry
          </Button>
        </div>
      )}

      {buckets === null && !error && (
        <div className="flex min-h-56 items-center justify-center rounded-sm border border-slate-300 bg-white text-sm text-slate-500">
          Loading trends…
        </div>
      )}

      {buckets?.length === 0 && (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-sm border border-slate-300 bg-white px-5 text-center">
          <BarChart3 className="size-6 text-slate-500" />
          <p className="mt-3 font-medium text-slate-800">No resolved cases yet</p>
          <p className="mt-1 text-sm text-slate-500">Trend data appears after an outcome is recorded.</p>
        </div>
      )}

      {buckets && buckets.length > 0 && (
        <div className="overflow-hidden rounded-sm border border-slate-300 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#eff4ff] px-4 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-[#004ac6]" />
              <p className="text-sm font-semibold">Outcome breakdown</p>
            </div>
            <p className="text-xs text-slate-500">Resolved cases only</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#eff4ff]">
                <TableRow className="hover:bg-[#eff4ff]">
                  <TableHead>{groupLabel}</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right"><OutcomeHeader outcome={OutcomeValue.WON} /></TableHead>
                  <TableHead className="text-right"><OutcomeHeader outcome={OutcomeValue.LOST} /></TableHead>
                  <TableHead className="text-right"><OutcomeHeader outcome={OutcomeValue.FRAUD_CONFIRMED} /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buckets.map((bucket) => (
                  <TableRow key={bucket.key}>
                    <TableCell className="font-mono text-xs font-medium">{bucket.key}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{totalOutcomes(bucket)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-700">{bucket.won}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-red-700">{bucket.lost}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-amber-800">{bucket.fraud_confirmed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </section>
  )
}
