"use client"

import { CalendarDays } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateFormat } from "@/lib/constants"

type MonthPickerProps = {
  id: string
  label: string
  onChange: (month: string) => void
  value: string
}

function dateFromMonth(month: string): Date {
  const [year, monthNumber] = month.split("-").map(Number)
  return new Date(year, monthNumber - 1, 1)
}

function monthFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    DateFormat.MONTH_PAD_LENGTH,
    DateFormat.MONTH_PAD_CHARACTER,
  )}`
}

export function MonthPicker({ id, label, onChange, value }: MonthPickerProps) {
  const selectedDate = dateFromMonth(value)

  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        id={id}
        render={
          <Button className="h-9 w-48 justify-start border-slate-300 bg-white text-left font-normal" type="button" variant="outline" />
        }
      >
        <CalendarDays className="text-slate-500" />
        {format(selectedDate, DateFormat.MONTH_DISPLAY_FORMAT)}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <PopoverHeader className="sr-only">
          <PopoverTitle>{label}</PopoverTitle>
          <PopoverDescription>Select any day in the month.</PopoverDescription>
        </PopoverHeader>
        <Calendar
          captionLayout="dropdown"
          mode="single"
          onSelect={(date) => date && onChange(monthFromDate(date))}
          selected={selectedDate}
        />
      </PopoverContent>
    </Popover>
  )
}
