"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, startOfWeek } from "date-fns"
import { ja } from 'date-fns/locale'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface CalendarProps {
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  className?: string
  getDayContent?: (date: Date) => React.ReactNode
}

export function Calendar({ selectedDate = new Date(), onDateSelect, className, getDayContent }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(selectedDate))

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  return (
    <div className={cn("p-3", className)}>
      <div className="flex justify-between items-center mb-4">
        <Button onClick={previousMonth} variant="outline" size="icon">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: ja })}
        </h2>
        <Button onClick={nextMonth} variant="outline" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
          <div key={day} className="text-center font-medium text-sm text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <Button
            key={day.toString()}
            onClick={() => onDateSelect && onDateSelect(day)}
            variant={isSameDay(day, selectedDate) ? "default" : "ghost"}
            className={cn(
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 relative",
              isSameMonth(day, currentMonth) ? "text-foreground" : "text-muted-foreground",
              isSameDay(day, selectedDate) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              index % 7 === 0 && "text-red-500",
              index % 7 === 6 && "text-blue-500"
            )}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {format(day, 'd')}
              {getDayContent && getDayContent(day)}
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}