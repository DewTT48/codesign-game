import type { DailyContent, ExperienceOption } from './specifyModel'

export type SpecifyMarkdownImport = {
  days: DailyContent[]
  experienceOptions: ExperienceOption[]
  warnings: string[]
}

const dailyLabels = ['TITLE', 'OBJECTIVE', 'CONTENT', 'EXERCISE', 'REFLECTION', 'RECORD', 'COMPLETION', 'DURATION'] as const
const experienceLabels = ['NAME', 'MOOD', 'BACKGROUND', 'SURFACE', 'PRIMARY', 'ACCENT', 'TEXT', 'TYPOGRAPHY', 'INTERACTION', 'RATIONALE', 'TRADEOFF'] as const

export function parseSpecifyMarkdown(source: string): SpecifyMarkdownImport {
  const markdown = source
    .replace(/^```(?:md|markdown)?\s*$/gim, '')
    .replace(/^```\s*$/gm, '')
    .replace(/\r\n?/g, '\n')
    .trim()

  const days = parseSections(markdown, /^##\s+DAY\s+(\d{1,2})\s*$/gim).flatMap(({ id, body }) => {
    const day = Number(id)
    if (!Number.isInteger(day) || day < 1 || day > 21) return []
    const fields = parseLabeledFields(body, dailyLabels)
    return [{
      day,
      title: fields.TITLE,
      objective: fields.OBJECTIVE,
      content: fields.CONTENT,
      exercise: fields.EXERCISE,
      reflection: fields.REFLECTION,
      record: fields.RECORD,
      completion: fields.COMPLETION,
      duration: fields.DURATION,
      reviewed: false,
    } satisfies DailyContent]
  })

  const experienceOptions = parseSections(markdown, /^##\s+THEME OPTION\s+(\d{1,2})\s*$/gim).flatMap(({ body }) => {
    const fields = parseLabeledFields(body, experienceLabels)
    if (!fields.NAME) return []
    return [{
      name: fields.NAME,
      mood: fields.MOOD,
      background: normalizeHex(fields.BACKGROUND, '#0B2545'),
      surface: normalizeHex(fields.SURFACE, '#174A6E'),
      primary: normalizeHex(fields.PRIMARY, '#FF8A24'),
      accent: normalizeHex(fields.ACCENT, '#7AC943'),
      text: normalizeHex(fields.TEXT, '#F7FAFC'),
      typography: fields.TYPOGRAPHY,
      interaction: fields.INTERACTION,
      rationale: fields.RATIONALE,
      tradeoff: fields.TRADEOFF,
      source: 'ai-draft',
    } satisfies ExperienceOption]
  }).slice(0, 3)

  const warnings: string[] = []
  if (!days.length && !experienceOptions.length) warnings.push('NO_SUPPORTED_SECTIONS')
  if (days.length && days.length < 21) warnings.push('CONTENT_PACK_INCOMPLETE')
  if (experienceOptions.length && experienceOptions.length < 3) warnings.push('THEME_OPTIONS_INCOMPLETE')
  if (days.some((day) => dailyLabels.some((label) => !day[fieldForDailyLabel(label)].trim()))) {
    warnings.push('DAY_FIELDS_MISSING')
  }

  return { days, experienceOptions, warnings }
}

function parseSections(markdown: string, pattern: RegExp) {
  const matches = [...markdown.matchAll(pattern)]
  return matches.map((match, index) => {
    const bodyStart = (match.index ?? 0) + match[0].length
    const nextMatchingHeading = matches[index + 1]?.index ?? markdown.length
    const anyHeadingOffset = markdown.slice(bodyStart).search(/^##\s+/m)
    const nextHeading = anyHeadingOffset >= 0 ? bodyStart + anyHeadingOffset : markdown.length
    return {
      id: match[1],
      body: markdown.slice(bodyStart, Math.min(nextMatchingHeading, nextHeading)),
    }
  })
}

function parseLabeledFields<const T extends readonly string[]>(body: string, labels: T): Record<T[number], string> {
  const result = Object.fromEntries(labels.map((label) => [label, ''])) as Record<T[number], string>
  let active: T[number] | null = null
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trimEnd()
    const label = labels.find((candidate) => line.toUpperCase().startsWith(`${candidate}:`)) as T[number] | undefined
    if (label) {
      active = label
      result[label] = line.slice(label.length + 1).trim()
      continue
    }
    if (active && !/^##\s+/.test(line)) {
      result[active] = `${result[active]}${result[active] ? '\n' : ''}${line}`.trim()
    }
  }
  return result
}

function normalizeHex(value: string, fallback: string) {
  const candidate = value.trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(candidate) ? candidate : fallback
}

function fieldForDailyLabel(label: typeof dailyLabels[number]): keyof Omit<DailyContent, 'day' | 'reviewed'> {
  const fields: Record<typeof dailyLabels[number], keyof Omit<DailyContent, 'day' | 'reviewed'>> = {
    TITLE: 'title',
    OBJECTIVE: 'objective',
    CONTENT: 'content',
    EXERCISE: 'exercise',
    REFLECTION: 'reflection',
    RECORD: 'record',
    COMPLETION: 'completion',
    DURATION: 'duration',
  }
  return fields[label]
}

export function serializeContentPack(days: DailyContent[]) {
  return `<!-- CODESIGN:CONTENT_PACK:v1 -->\n\n${days.map((day) => `## DAY ${String(day.day).padStart(2, '0')}\nTITLE: ${day.title}\nOBJECTIVE: ${day.objective}\nCONTENT: ${day.content}\nEXERCISE: ${day.exercise}\nREFLECTION: ${day.reflection}\nRECORD: ${day.record}\nCOMPLETION: ${day.completion}\nDURATION: ${day.duration}`).join('\n\n')}`
}

export function serializeExperienceDraft(options: ExperienceOption[]) {
  return `<!-- CODESIGN:EXPERIENCE_DRAFT:v1 -->\n\n${options.map((option, index) => `## THEME OPTION ${index + 1}\nNAME: ${option.name}\nMOOD: ${option.mood}\nBACKGROUND: ${option.background}\nSURFACE: ${option.surface}\nPRIMARY: ${option.primary}\nACCENT: ${option.accent}\nTEXT: ${option.text}\nTYPOGRAPHY: ${option.typography}\nINTERACTION: ${option.interaction}\nRATIONALE: ${option.rationale}\nTRADEOFF: ${option.tradeoff}`).join('\n\n')}`
}
