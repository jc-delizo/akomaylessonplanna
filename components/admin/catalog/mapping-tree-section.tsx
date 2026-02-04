'use client'

import { useMemo } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/registry/default/collapsible/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/registry/default/checkbox/checkbox'
import { ChevronRight, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SubjectOption {
  id: string
  name: string
  code?: string
}

interface MappingTreeSectionProps {
  id: string
  label: string
  subLabel?: string
  subjects: SubjectOption[]
  selectedSubjectIds: string[]
  onToggle: (subjectId: string) => void
  onSave: () => void
  isExpanded: boolean
  onToggleExpand: () => void
  saving?: boolean
  /** Visual nesting level: 0 = no indent, 1 = pl-4, 2 = pl-8, etc. */
  indentLevel?: number
}

const INDENT_CLASSES = ['', 'pl-4', 'pl-8', 'pl-12'] as const

export function MappingTreeSection({
  id,
  label,
  subLabel,
  subjects,
  selectedSubjectIds,
  onToggle,
  onSave,
  isExpanded,
  onToggleExpand,
  saving = false,
  indentLevel = 0,
}: MappingTreeSectionProps) {
  const subjectCount = selectedSubjectIds.length
  const indentClass = INDENT_CLASSES[Math.min(indentLevel, INDENT_CLASSES.length - 1)]

  const { unselected, selected } = useMemo(() => {
    const unselectedList = subjects
      .filter((s) => !selectedSubjectIds.includes(s.id))
      .sort((a, b) => a.name.localeCompare(b.name))
    const selectedList = subjects.filter((s) => selectedSubjectIds.includes(s.id))
    return { unselected: unselectedList, selected: selectedList }
  }, [subjects, selectedSubjectIds])

  return (
    <Collapsible open={isExpanded} onOpenChange={(open) => open !== isExpanded && onToggleExpand()}>
      <div className={cn('border rounded-lg overflow-hidden', indentClass)}>
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
        >
          <ChevronRight
            className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isExpanded && 'rotate-90')}
          />
          <span className="font-medium flex-1">{label}</span>
          {subLabel && (
            <span className="text-sm text-muted-foreground">({subLabel})</span>
          )}
          <Badge variant="secondary" className="shrink-0">
            {subjectCount} subject{subjectCount !== 1 ? 's' : ''}
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t bg-muted/20 px-4 py-3 space-y-3">
            {/* Add subjects - unselected first */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Add subjects</p>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {unselected.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">None</p>
                ) : (
                  unselected.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-background/60 p-2 rounded-md transition-colors"
                    >
                      <Checkbox onCheckedChange={() => onToggle(s.id)} />
                      <span className="text-sm">
                        {s.name}
                        {s.code && <span className="text-muted-foreground ml-1">({s.code})</span>}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Selected - badges with X */}
            {selected.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Selected ({selected.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((s) => (
                    <Badge
                      key={s.id}
                      variant="secondary"
                      className="flex items-center gap-1.5 px-2.5 py-1 text-sm"
                    >
                      <span>
                        {s.name}
                        {s.code && <span className="text-muted-foreground ml-0.5">({s.code})</span>}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggle(s.id)
                        }}
                        className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted transition-colors"
                        aria-label={`Remove ${s.name}`}
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onSave()
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
