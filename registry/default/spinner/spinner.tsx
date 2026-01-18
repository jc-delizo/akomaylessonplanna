"use client"

import * as React from "react"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof Loader2Icon> & {
  size?: "sm" | "default" | "lg"
}) {
  return (
    <Loader2Icon
      data-slot="spinner"
      className={cn(
        "animate-spin text-muted-foreground",
        size === "sm" && "h-4 w-4",
        size === "default" && "h-5 w-5",
        size === "lg" && "h-6 w-6",
        className
      )}
      {...props}
    />
  )
}

export { Spinner }
