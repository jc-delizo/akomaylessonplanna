"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/registry/default/button/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  ...props
}: CalendarProps & { captionLayout?: "buttons" | "dropdown" | "dropdown-months" | "dropdown-years" }) {
  const isDropdownLayout = captionLayout === "dropdown" || captionLayout === "dropdown-months" || captionLayout === "dropdown-years"
  
  // Set startMonth to current month (removes past years) and endMonth to 5 years from today when dropdowns are enabled
  const startMonth = isDropdownLayout && !props.startMonth
    ? new Date(new Date().getFullYear(), new Date().getMonth(), 1) // First day of current month
    : props.startMonth
  const endMonth = isDropdownLayout && !props.endMonth
    ? new Date(new Date().getFullYear() + 5, 11, 31) // December 31st, 5 years from now
    : props.endMonth
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      reverseYears={isDropdownLayout}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: isDropdownLayout ? "sr-only" : "text-sm font-medium",
        nav: isDropdownLayout ? "hidden" : "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-10 w-10 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_previous: "absolute left-1",
        button_next: "absolute right-1",
        dropdown: "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        dropdowns: "flex gap-2 items-center justify-center",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex w-full",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex-shrink-0 text-center flex items-center justify-center",
        week: "flex w-full mt-2",
        day_button: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          if (orientation === 'left') {
            return <ChevronLeftIcon className="h-6 w-6" />
          }
          return <ChevronRightIcon className="h-6 w-6" />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
