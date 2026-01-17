"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/button/button"

type CarouselApi = {
  scrollNext: () => void
  scrollPrev: () => void
  scrollTo: (index: number) => void
  canScrollNext: boolean
  canScrollPrev: boolean
}

type CarouselProps = {
  opts?: {
    align?: "start" | "center" | "end"
    loop?: boolean
  }
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
} & React.ComponentProps<"div">

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  className,
  children,
  ...props
}: CarouselProps) {
  const [api, setCarouselApi] = React.useState<CarouselApi | null>(null)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  React.useEffect(() => {
    if (!api) return

    setCanScrollPrev(api.canScrollPrev)
    setCanScrollNext(api.canScrollNext)

    api.on("select", () => {
      setCanScrollPrev(api.canScrollPrev)
      setCanScrollNext(api.canScrollNext)
    })
  }, [api])

  React.useEffect(() => {
    if (setApi && api) {
      setApi(api)
    }
  }, [setApi, api])

  return (
    <div
      data-slot="carousel"
      className={cn("relative w-full", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="carousel-content"
      className={cn(
        "overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("absolute h-8 w-8 rounded-full", className)}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("absolute h-8 w-8 rounded-full", className)}
      {...props}
    >
      <ChevronRightIcon className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
}
