"use client"

import * as React from "react"
import { Upload, FileText, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type FileDropzoneProps = {
  id: string
  label: string
  value: File | null
  onChange: (file: File | null) => void
  onError?: (message: string) => void
  accept?: string
  allowedMimeTypes?: string[]
  maxSizeBytes?: number
  description?: string
  disabled?: boolean
  className?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileDropzone({
  id,
  label,
  value,
  onChange,
  onError,
  accept,
  allowedMimeTypes,
  maxSizeBytes,
  description,
  disabled,
  className,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = React.useState(false)

  const validateFile = React.useCallback(
    (file: File): boolean => {
      if (allowedMimeTypes?.length && !allowedMimeTypes.includes(file.type)) {
        onError?.("Invalid file type. Please upload a PDF, JPG, or PNG file.")
        return false
      }
      if (typeof maxSizeBytes === "number" && file.size > maxSizeBytes) {
        onError?.(`File size must be less than ${formatFileSize(maxSizeBytes)}.`)
        return false
      }
      return true
    },
    [allowedMimeTypes, maxSizeBytes, onError]
  )

  const setFile = React.useCallback(
    (file: File | null) => {
      if (!file) {
        onChange(null)
        if (inputRef.current) inputRef.current.value = ""
        return
      }
      if (!validateFile(file)) return
      onChange(file)
    },
    [onChange, validateFile]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFile(file)
  }

  const handleClear = () => setFile(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setFile(file)
  }

  const openFileDialog = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      <Label htmlFor={id} className="text-base font-medium">
        {label}
      </Label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? "true" : "false"}
        onClick={openFileDialog}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openFileDialog()
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative w-full rounded-lg border border-dashed bg-muted/30 px-4 py-4 transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          isDragActive ? "border-primary bg-primary/5" : "border-border",
          disabled && "cursor-not-allowed opacity-60",
          !disabled && "cursor-pointer"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 rounded-md border bg-background p-2", isDragActive && "border-primary")}>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm font-medium text-foreground">
                {value ? "File selected" : "Upload your PRC license"}
              </p>
              <span className="text-xs text-muted-foreground">
                {value ? "Click to replace" : "Click to browse or drag and drop"}
              </span>
            </div>

            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}

            {value && (
              <div className="mt-3 flex items-center gap-2 rounded-md border bg-background px-3 py-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{value.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(value.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

