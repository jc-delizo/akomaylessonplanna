"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/button/button"

function ButtonGroup({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical"
}) {
  return (
    <div
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(
        "inline-flex",
        orientation === "horizontal" && "flex-row",
        orientation === "vertical" && "flex-col",
        "[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button:not(:first-child)]:border-l-0",
        orientation === "vertical" && "[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-bl-none [&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-tr-none [&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-t-0",
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup }
