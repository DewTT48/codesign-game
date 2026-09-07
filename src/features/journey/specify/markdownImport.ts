import type { ContentArc, DailyContent, ExperienceOption, ProductLanguage } from './specifyModel'

export type OwnerSpecificationImport = {
  productLanguage: ProductLanguage | ''
  brandCopy: string
  journeySummary: string
  dailyCompletionRule: string
  returnRule: 'allow-edit' | 'read-only' | 'no-revisit' | ''
  sequenceRule: 'sequential' | 'allow-skip' | ''
  storageRule: 'browser-device' | 'session-only' | ''
  dailyDuration: string
  contentArcs: ContentArc[]
  contentPattern: string
  exercisePattern: string
  recordPattern: string
}

export type SpecifyMarkdownImport = {
  ownerSpecification: OwnerSpecificationImport | null
  days: DailyContent[]
  experienceOptions: ExperienceOption[]
  warnings: string[]
}

const ownerLabels = [
  'PRODUCT_LANGUAGE',
  'BRAND_COPY',
  'PRIMARY_JOURNEY',
  'ONE_DAY_COMPLETE_WHEN',
  'RETURN_RULE',
  'DAY_SEQUENCE',
  'SAVE_BEHAVIOR',
  'TIME_PER_DAY',
  'ARC_1_TITLE',
  'ARC_1_GOAL',
  'ARC_2_TITLE',
  'ARC_2_GOAL',
  'ARC_3_TITLE',
  'ARC_3_GOAL',
  'DAILY_CONTENT_PATTERN',
  'DAILY_EXERCISE_PATTERN',
  'DAILY_RECORD_PATTERN',
] as const
const dailyLabels = ['TITLE', 'OBJECTIVE', 'CONTENT', 'EXERCISE', 'REFLECTION', 'RECORD', 'COMPLETION', 'DURATION'] as const
const experienceLabels = ['NAME', 'MOOD', 'BACKGROUND', 'SURFACE', 'PRIMARY', 'ACCENT', 'TEXT', 'TYPOGRAPHY', 'INTERACTION', 'RATIONALE', 'TRADEOFF'] as const

export function parseSpecifyMarkdown(source: string): SpecifyMarkdownImport {
  const markdown = source
    .replace(/^```(?:md|markdown)?\s*$/gim, '')
    .replace(/^```\s*$/gm, '')
    .replace(/\r\n?/g, '\n')
    .trim()

  const ownerSection = parseSections(markdown, /^##\s+OWNER SPECIFICATION\s*$/gim)[0]
  const ownerFields = ownerSection ? parseLabeledFields(ownerSection.body, ownerLabels) : null
  const ownerSpecification = ownerFields ? {
    productLanguage: normalizeChoice(ownerFields.PRODUCT_LANGUAGE, ['th', 'en', 'bilingual'] as const),
    brandCopy: ownerFields.BRAND_COPY,
    journeySummary: ownerFields.PRIMARY_JOURNEY,
    dailyCompletionRule: ownerFields.ONE_DAY_COMPLETE_WHEN,
    returnRule: normalizeChoice(ownerFields.RETURN_RULE, ['allow-edit', 'read-only', 'no-revisit'] as const),
    sequenceRule: normalizeChoice(ownerFields.DAY_SEQUENCE, ['sequential', 'allow-skip'] as const),
    storageRule: normalizeChoice(ownerFields.SAVE_BEHAVIOR, ['browser-device', 'session-only'] as const),
    dailyDuration: ownerFields.TIME_PER_DAY,
    contentArcs: [
      { range: 'DAY 01–07', title: ownerFields.ARC_1_TITLE, goal: ownerFields.ARC_1_GOAL },
      { range: 'DAY 08–14', title: ownerFields.ARC_2_TITLE, goal: ownerFields.ARC_2_GOAL },
      { range: 'DAY 15–21', title: ownerFields.ARC_3_TITLE, goal: ownerFields.ARC_3_GOAL },
    ],
    contentPattern: ownerFields.DAILY_CONTENT_PATTERN,
    exercisePattern: ownerFields.DAILY_EXERCISE_PATTERN,
    recordPattern: ownerFields.DAILY_RECORD_PATTERN,
  } satisfies OwnerSpecificationImport : null

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
  if (!ownerSpecification && !days.length && !experienceOptions.length) warnings.push('NO_SUPPORTED_SECTIONS')
  if (ownerFields && ownerLabels.some((label) => !ownerFields[label].trim())) warnings.push('OWNER_SPEC_INCOMPLETE')
  if (ownerFields && ownerSpecification && (!ownerSpecification.productLanguage || !ownerSpecification.returnRule || !ownerSpecification.sequenceRule || !ownerSpecification.storageRule)) {
    warnings.push('OWNER_RULE_INVALID')
  }
  if (days.length && days.length < 21) warnings.push('CONTENT_PACK_INCOMPLETE')
  if (experienceOptions.length && experienceOptions.length < 3) warnings.push('THEME_OPTIONS_INCOMPLETE')
  if (days.some((day) => dailyLabels.some((label) => !day[fieldForDailyLabel(label)].trim()))) {
    warnings.push('DAY_FIELDS_MISSING')
  }

  return { ownerSpecification, days, experienceOptions, warnings }
}

function parseSections(markdown: string, pattern: RegExp) {
  const matches = [...markdown.matchAll(pattern)]
  return matches.map((match, index) => {
    const bodyStart = (match.index ?? 0) + match[0].length
    const nextMatchingHeading = matches[index + 1]?.index ?? markdown.length
    const boundaryOffset = markdown.slice(bodyStart).search(/^(?:##\s+|<!--\s*CODESIGN:)/m)
    const nextHeading = boundaryOffset >= 0 ? bodyStart + boundaryOffset : markdown.length
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

function normalizeChoice<const T extends readonly string[]>(value: string, choices: T): T[number] | '' {
  const candidate = value.trim().toLowerCase()
  return choices.includes(candidate as T[number]) ? candidate as T[number] : ''
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

export function serializeOwnerSpecification(owner: OwnerSpecificationImport) {
  return `<!-- CODESIGN:OWNER_SPEC:v1 -->

## OWNER SPECIFICATION
PRODUCT_LANGUAGE: ${owner.productLanguage}
BRAND_COPY: ${owner.brandCopy}
PRIMARY_JOURNEY: ${owner.journeySummary}
ONE_DAY_COMPLETE_WHEN: ${owner.dailyCompletionRule}
RETURN_RULE: ${owner.returnRule}
DAY_SEQUENCE: ${owner.sequenceRule}
SAVE_BEHAVIOR: ${owner.storageRule}
TIME_PER_DAY: ${owner.dailyDuration}
ARC_1_TITLE: ${owner.contentArcs[0]?.title ?? ''}
ARC_1_GOAL: ${owner.contentArcs[0]?.goal ?? ''}
ARC_2_TITLE: ${owner.contentArcs[1]?.title ?? ''}
ARC_2_GOAL: ${owner.contentArcs[1]?.goal ?? ''}
ARC_3_TITLE: ${owner.contentArcs[2]?.title ?? ''}
ARC_3_GOAL: ${owner.contentArcs[2]?.goal ?? ''}
DAILY_CONTENT_PATTERN: ${owner.contentPattern}
DAILY_EXERCISE_PATTERN: ${owner.exercisePattern}
DAILY_RECORD_PATTERN: ${owner.recordPattern}`
}

export function serializeExperienceDraft(options: ExperienceOption[]) {
  return `<!-- CODESIGN:EXPERIENCE_DRAFT:v1 -->\n\n${options.map((option, index) => `## THEME OPTION ${index + 1}\nNAME: ${option.name}\nMOOD: ${option.mood}\nBACKGROUND: ${option.background}\nSURFACE: ${option.surface}\nPRIMARY: ${option.primary}\nACCENT: ${option.accent}\nTEXT: ${option.text}\nTYPOGRAPHY: ${option.typography}\nINTERACTION: ${option.interaction}\nRATIONALE: ${option.rationale}\nTRADEOFF: ${option.tradeoff}`).join('\n\n')}`
}
