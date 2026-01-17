"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/registry/default/input/input"
import { Button } from "@/registry/default/button/button"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex h-10 items-center rounded-md border border-input bg-background text-sm ring-offset-background has-[[data-slot=input-group-input]]:border-0 has-[[data-slot=input-group-input]]:bg-transparent has-[[data-slot=input-group-input]]:px-0 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="input-group-input"
      className={cn("border-0 bg-transparent shadow-none focus-visible:ring-0", className)}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  align = "inline-end",
  ...props
}: React.ComponentProps<"div"> & {
  align?: "inline-start" | "inline-end"
}) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex items-center [&>button]:h-full [&>button]:rounded-none [&>button]:border-0 [&>button]:bg-transparent [&>button]:shadow-none",
        className
      )}
      {...props}
    />
  )
}

function InputGroupButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="input-group-button"
      variant="ghost"
      size="icon"
      className={cn("h-full rounded-none border-0", className)}
      {...props}
    />
  )
}

export { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton }
