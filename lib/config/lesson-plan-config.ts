/**
 * Lesson Plan hierarchy and filter options (DepEd Philippines 2026).
 * Single source of truth for modalities, languages, curricula, document types,
 * weeks 1–9, and teaching frameworks. Used by filter UI, product form, and search.
 */

export const LESSON_PLAN_APP_VERSION = '2026.1'

/** Document types for lesson plans */
export const DOCUMENT_TYPES = [
  { value: 'dll', label: 'Daily Lesson Log (DLL)' },
  { value: 'dlp', label: 'Detailed Lesson Plan (DLP)' },
] as const

/** Curriculum alignment */
export const CURRICULA = [
  { value: 'matatag', label: 'MATATAG Curriculum' },
  { value: 'k_to_12', label: 'K to 12 Curriculum' },
] as const

/** Quarters are single-select; one quarter per product/filter. */
export const QUARTER_SELECTION = 'single' as const

/** Quarters */
export const QUARTERS = [
  { value: '1', label: 'Quarter 1' },
  { value: '2', label: 'Quarter 2' },
  { value: '3', label: 'Quarter 3' },
  { value: '4', label: 'Quarter 4' },
] as const

/** Subjects are multiselect for integrated/interdisciplinary teaching (Phase B implemented). */
export const SUBJECT_SELECTION = 'multi' as const

/** Weeks: min 1, max 9, multiselect */
export const WEEKS_MIN = 1
export const WEEKS_MAX = 9
export const WEEKS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

/** Modalities (multiselect) */
export const MODALITIES = [
  { value: 'face_to_face', label: 'Face-to-face' },
  { value: 'online', label: 'Online' },
  { value: 'modular', label: 'Modular' },
  { value: 'blended', label: 'Blended' },
] as const

/** Teaching frameworks */
export const TEACHING_FRAMEWORKS = [
  { value: '4as', label: '4As' },
  { value: '5es', label: '5Es' },
  { value: 'inquiry_based', label: 'Inquiry-Based' },
  { value: 'direct_instruction', label: 'Direct Instruction' },
  { value: 'custom', label: 'Custom' },
] as const

/** Language of instruction (12 options; no default – user must choose) */
export const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'filipino', label: 'Filipino' },
  { value: 'cebuano_bisaya', label: 'Cebuano/Bisaya' },
  { value: 'ilocano', label: 'Ilocano' },
  { value: 'hiligaynon', label: 'Hiligaynon' },
  { value: 'waray', label: 'Waray' },
  { value: 'kapampangan', label: 'Kapampangan' },
  { value: 'pangasinense', label: 'Pangasinense' },
  { value: 'bicolano', label: 'Bicolano' },
  { value: 'maranao', label: 'Maranao' },
  { value: 'maguindanaon', label: 'Maguindanaon' },
  { value: 'tausug', label: 'Tausug' },
] as const

/** Legacy language values in DB (english, filipino, bilingual) mapped to new codes */
export const LANGUAGE_VALUE_TO_CODE: Record<string, string> = {
  english: 'english',
  filipino: 'filipino',
  bilingual: 'filipino', // or keep as bilingual if needed
}

/** Modality values for DB/storage (match labels for display, or use codes) */
export const MODALITY_VALUES = MODALITIES.map((m) => m.value)

/** Machine-readable guardrails for generators and Cursor. */
export const LESSON_PLAN_INVARIANTS = {
  weeks_max: 9,
  no_default_language: true,
  subject_is_multiselect: true,
  modality_is_multiselect: true,
  quarter_is_single_select: true,
} as const

/** Class type — Regular only (SPED removed) */
export const CLASS_TYPES = [
  { value: 'regular', label: 'Regular' },
] as const

export type DocumentTypeValue = (typeof DOCUMENT_TYPES)[number]['value']
export type CurriculumValue = (typeof CURRICULA)[number]['value']
export type ModalityValue = (typeof MODALITIES)[number]['value']
export type TeachingFrameworkValue = (typeof TEACHING_FRAMEWORKS)[number]['value']
export type LanguageValue = (typeof LANGUAGES)[number]['value']
export type ClassTypeValue = (typeof CLASS_TYPES)[number]['value']

/** Resolve value to label for product detail badges */
export function getLanguageLabel(value: string | null | undefined): string | null {
  if (!value) return null
  const code = LANGUAGE_VALUE_TO_CODE[value] ?? value
  const found = LANGUAGES.find((l) => l.value === code)
  return found ? found.label : value.replace(/_/g, ' ')
}

export function getCurriculumLabel(value: string | null | undefined): string | null {
  if (!value) return null
  const found = CURRICULA.find((c) => c.value === value)
  return found ? found.label : value.replace(/_/g, ' ')
}

export function getModalityLabel(value: string | null | undefined): string | null {
  if (!value) return null
  const found = MODALITIES.find((m) => m.value === value)
  return found ? found.label : value.replace(/_/g, ' ')
}

export function getTeachingFrameworkLabel(value: string | null | undefined): string | null {
  if (!value) return null
  const found = TEACHING_FRAMEWORKS.find((t) => t.value === value)
  return found ? found.label : value.replace(/_/g, ' ')
}

export function getClassTypeLabel(value: string | null | undefined): string | null {
  if (!value) return null
  const found = CLASS_TYPES.find((c) => c.value === value)
  return found ? found.label : value
}

export function getDocumentTypeLabel(value: string | null | undefined): string | null {
  if (!value) return null
  const found = DOCUMENT_TYPES.find((d) => d.value === value)
  return found ? found.label : value.replace(/_/g, ' ').toUpperCase()
}
