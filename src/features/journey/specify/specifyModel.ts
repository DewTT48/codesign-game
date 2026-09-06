export type ProductLanguage = 'th' | 'en' | 'bilingual'

export type ContentArc = {
  range: string
  title: string
  goal: string
}

export type DailyContent = {
  day: number
  title: string
  objective: string
  content: string
  exercise: string
  reflection: string
  record: string
  completion: string
  duration: string
  reviewed: boolean
}

export type ExperienceOption = {
  name: string
  mood: string
  background: string
  surface: string
  primary: string
  accent: string
  text: string
  typography: string
  interaction: string
  rationale: string
  tradeoff: string
  source: 'starter' | 'ai-draft' | 'owner-edited'
}

export const starterContentArcs: ContentArc[] = [
  { range: 'DAY 01–07', title: '', goal: '' },
  { range: 'DAY 08–14', title: '', goal: '' },
  { range: 'DAY 15–21', title: '', goal: '' },
]

export const createDailyContent = (): DailyContent[] => Array.from({ length: 21 }, (_, index) => ({
  day: index + 1,
  title: '',
  objective: '',
  content: '',
  exercise: '',
  reflection: '',
  record: '',
  completion: '',
  duration: '',
  reviewed: false,
}))

export const starterExperienceOptions: ExperienceOption[] = [
  {
    name: 'Calm Focus',
    mood: 'Calm, clear, and supportive',
    background: '#102A43',
    surface: '#1E4E62',
    primary: '#69C6D0',
    accent: '#A7D8A0',
    text: '#F4F8FA',
    typography: 'Readable sans-serif with concise display headings',
    interaction: 'Direct and reassuring',
    rationale: 'Deep blue, soft teal, and sage create a quiet hierarchy that keeps attention on one small action.',
    tradeoff: 'Less playful than a game-led direction.',
    source: 'starter',
  },
  {
    name: 'Retro Quest',
    mood: 'Playful, energetic, and purposeful',
    background: '#19123A',
    surface: '#3D2B66',
    primary: '#FFB000',
    accent: '#FF4F9A',
    text: '#FFF8E7',
    typography: 'Pixel headings with highly readable body copy',
    interaction: 'Tactile, rewarding, and never childish',
    rationale: 'Arcade gold and neon pink against deep indigo make the 21-day journey feel like a purposeful retro quest.',
    tradeoff: 'Decorative elements must stay restrained so long content remains readable.',
    source: 'starter',
  },
  {
    name: 'Warm Momentum',
    mood: 'Warm, optimistic, and encouraging',
    background: '#3A1F1B',
    surface: '#7A3E32',
    primary: '#F4A261',
    accent: '#FFD166',
    text: '#FFF7ED',
    typography: 'Friendly rounded headings with calm body copy',
    interaction: 'Gentle celebration with clear feedback',
    rationale: 'Terracotta, apricot, and golden accents create visible forward energy while keeping reflection approachable.',
    tradeoff: 'Needs careful contrast control to avoid feeling decorative or soft.',
    source: 'starter',
  },
]

const requiredDailyFields: Array<keyof Omit<DailyContent, 'day' | 'reviewed'>> = [
  'title',
  'objective',
  'content',
  'exercise',
  'reflection',
  'record',
  'completion',
  'duration',
]

export function isDailyContentComplete(day: DailyContent) {
  return requiredDailyFields.every((field) => day[field].trim().length > 0)
}

export function countCompleteDays(days: DailyContent[]) {
  return days.filter(isDailyContentComplete).length
}

export function normalizeDailyContent(value: unknown): DailyContent[] {
  const base = createDailyContent()
  if (!Array.isArray(value)) return base

  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue
    const item = candidate as Record<string, unknown>
    const day = Number(item.day)
    if (!Number.isInteger(day) || day < 1 || day > 21) continue
    base[day - 1] = {
      day,
      title: stringValue(item.title),
      objective: stringValue(item.objective),
      content: stringValue(item.content),
      exercise: stringValue(item.exercise),
      reflection: stringValue(item.reflection),
      record: stringValue(item.record),
      completion: stringValue(item.completion),
      duration: stringValue(item.duration),
      reviewed: Boolean(item.reviewed),
    }
  }
  return base
}

export function normalizeContentArcs(value: unknown): ContentArc[] {
  if (!Array.isArray(value)) return starterContentArcs
  return starterContentArcs.map((fallback, index) => {
    const candidate = value[index]
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return fallback
    const item = candidate as Record<string, unknown>
    return {
      range: stringValue(item.range) || fallback.range,
      title: stringValue(item.title),
      goal: stringValue(item.goal),
    }
  })
}

export function normalizeExperienceOptions(value: unknown): ExperienceOption[] {
  if (!Array.isArray(value)) return starterExperienceOptions
  const options = value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return []
    const item = candidate as Record<string, unknown>
    const name = stringValue(item.name)
    if (!name) return []
    return [{
      name,
      mood: stringValue(item.mood),
      background: validHex(item.background) || '#0B2545',
      surface: validHex(item.surface) || '#174A6E',
      primary: validHex(item.primary) || '#FF8A24',
      accent: validHex(item.accent) || '#7AC943',
      text: validHex(item.text) || '#F7FAFC',
      typography: stringValue(item.typography),
      interaction: stringValue(item.interaction),
      rationale: stringValue(item.rationale),
      tradeoff: stringValue(item.tradeoff),
      source: item.source === 'starter' || item.source === 'owner-edited' ? item.source : 'ai-draft',
    } satisfies ExperienceOption]
  })
  return options.length ? options.slice(0, 3) : starterExperienceOptions
}

export function mergeDailyContent(
  current: DailyContent[],
  incoming: DailyContent[],
  mode: 'empty' | 'replace',
) {
  const normalizedCurrent = normalizeDailyContent(current)
  const byDay = new Map(incoming.map((day) => [day.day, day]))
  return normalizedCurrent.map((existing) => {
    const next = byDay.get(existing.day)
    if (!next) return existing
    if (mode === 'replace') return { ...next, reviewed: false }
    if (isDailyContentComplete(existing)) return existing
    const merged = { ...existing }
    for (const field of requiredDailyFields) {
      if (!merged[field].trim()) merged[field] = next[field]
    }
    return { ...merged, reviewed: false }
  })
}

export function contrastRatio(foreground: string, background: string) {
  const first = relativeLuminance(foreground)
  const second = relativeLuminance(background)
  if (first === null || second === null) return null
  const light = Math.max(first, second)
  const dark = Math.min(first, second)
  return (light + 0.05) / (dark + 0.05)
}

function relativeLuminance(value: string) {
  const normalized = validHex(value)
  if (!normalized) return null
  const channels = [1, 3, 5].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16) / 255)
  const [red, green, blue] = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4)
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
}

function validHex(value: unknown) {
  const candidate = stringValue(value).toUpperCase()
  return /^#[0-9A-F]{6}$/.test(candidate) ? candidate : ''
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}
