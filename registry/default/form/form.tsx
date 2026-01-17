"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/registry/default/label/label"

function Form({
  className,
  onSubmit,
  children,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="form"
      onSubmit={onSubmit}
      className={cn("space-y-6", className)}
      {...props}
    >
      {children}
    </form>
  )
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-item"
      className={cn("space-y-2", className)}
      {...props}
    />
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="form-label"
      className={cn(className)}
      {...props}
    />
  )
}

function FormControl({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-control"
      className={cn(className)}
      {...props}
    />
  )
}

function FormDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FormMessage({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-message"
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    />
  )
}

function FormField({
  name,
  children,
  ...props
}: {
  name: string
  children: React.ReactNode
} & Omit<React.ComponentProps<"div">, "children">) {
  return (
    <div data-slot="form-field" data-name={name} {...props}>
      {children}
    </div>
  )
}

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
}
