"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = ScrollAreaPrimitive.Root

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
}: React.ComponentProps<typeof ScrollArea>) {
  return (
    <ScrollArea
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
    </ScrollArea>
  )
}

export { ScrollArea, ScrollBar }
