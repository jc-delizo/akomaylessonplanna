"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function ChartContainer({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chart-container"
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function ChartTooltip({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chart-tooltip"
      className={cn(
        "rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md",
        className
      )}
      {...props}
    />
  )
}

function ChartTooltipContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chart-tooltip-content"
      className={cn("grid gap-1.5", className)}
      {...props}
    />
  )
}

function ChartTooltipLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chart-tooltip-label"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

function ChartLegend({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chart-legend"
      className={cn("flex flex-wrap items-center gap-4", className)}
      {...props}
    />
  )
}

function ChartLegendItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chart-legend-item"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartTooltipLabel,
  ChartLegend,
  ChartLegendItem,
}
