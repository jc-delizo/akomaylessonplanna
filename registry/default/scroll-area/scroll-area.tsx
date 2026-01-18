"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollAreaRoot = ScrollAreaPrimitive.Root

const ScrollBar = ScrollAreaPrimitive.ScrollAreaScrollbar

function ScrollAreaViewport({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Viewport>) {
  return (
    <ScrollAreaPrimitive.Viewport
      data-slot="scroll-area-viewport"
      className={cn("h-full w-full rounded-[inherit]", className)}
      {...props}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
  )
}

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaRoot>) {
  return (
    <ScrollAreaRoot
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaViewport>{children}</ScrollAreaViewport>
      <ScrollBar orientation="vertical" className="touch-none select-none transition-colors">
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
      </ScrollBar>
      <ScrollBar orientation="horizontal" className="touch-none select-none transition-colors">
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
      </ScrollBar>
    </ScrollAreaRoot>
  )
}

export { ScrollArea, ScrollBar }
