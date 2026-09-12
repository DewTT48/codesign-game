import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import { debateDecisionMarkdown, debateOutcomeLabel } from '../debateModel'
import type { PrdSource } from '../journey.service'
import {
  countCompleteDays,
  normalizeContentArcs,
  normalizeDailyContent,
  normalizeExperienceOptions,
} from '../specify/specifyModel'
import { resolveProductRuleText } from '../specify/productRuleModel'
import { defaultAcceptanceCriteria } from './handoffFiles'

type ScreenSpec = { name?: string; sees?: string; actions?: string; next?: string }

const text = (value: Json | undefined, fallback = 'Not specified') => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const list = (value: Json | undefined) =>
  (Array.isArray(value) ? value : [])
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    .map((item) => item.trim())

const bullets = (items: string[], fallback = 'Not specified') =>
  items.length ? items.map((item) => `- ${item}`).join('\n') : `- ${fallback}`

const numbered = (items: string[], fallback = 'Not specified') =>
  items.length ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : `1. ${fallback}`

const screens = (value: Json | undefined) =>
  (Array.isArray(value) ? value : []).filter(
    (item): item is ScreenSpec => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
  )

const alignmentRecord = (sourceStep: string, targetStep: string, entry: Record<string, Json | undefined>) => `### Step ${sourceStep} → Step ${targetStep}

- **Relationship:** ${text(entry.alignmentStatus, 'Not recorded')}
- **Latest owner interpretation:** ${text(entry.alignmentNote, 'No clarification recorded.')}
- **Owner reviewed both steps together:** ${entry.alignmentConfirmed ? 'YES' : 'NO'}`

const debateRecord = (debate: Record<string, Json | undefined>) => {
  const outcome = debateOutcomeLabel(debate.directionResult, 'en') || text(debate.directionResult, 'Not recorded')
  const decisions = debateDecisionMarkdown(debate.assumptions, 'en')
  const ownerSummary = debate.summaryCustomized !== false ? text(debate.whatChanged, '') : ''
  return `- **Overall impact on direction:** ${outcome}

### Assumption Decisions

${decisions}${ownerSummary ? `\n\n**Owner-edited summary:** ${ownerSummary}` : ''}`
}

export function assemblePrd(project: ProjectRow, source: PrdSource): string {
  const specify = source.S ?? {}
  return Number(specify.specificationVersion) >= 2
    ? assembleCurrentPrd(project, source)
    : assembleLegacyPrd(project, source)
}

function assembleCurrentPrd(project: ProjectRow, source: PrdSource) {
  const context = source.C ?? {}
  const options = source.O ?? {}
  const debate = source.D ?? {}
  const establish = source.E ?? {}
  const specify = source.S ?? {}
  const optionList = Array.isArray(options.options) ? options.options : []
  const favoriteIndex = typeof options.favorite === 'number' ? options.favorite : -1
  const favorite = optionList[favoriteIndex]
  const selectedOption = favorite && typeof favorite === 'object' && !Array.isArray(favorite)
    ? favorite as Record<string, Json | undefined>
    : undefined
  const arcs = normalizeContentArcs(specify.contentArcs)
  const days = normalizeDailyContent(specify.dailyContent)
  const themes = normalizeExperienceOptions(specify.experienceOptions)
  const selectedTheme = themes.find((theme) => theme.name === text(specify.selectedExperience, ''))
  const acceptance = defaultAcceptanceCriteria(specify)
  const returnRule = resolveProductRuleText('return', specify.returnRule, 'en')
  const sequenceRule = resolveProductRuleText('sequence', specify.sequenceRule, 'en')
  const storageRule = resolveProductRuleText('storage', specify.storageRule, 'en')

  return `# CODESIGN HANDOFF — ${project.title}

> Owner-approved Product Definition for Codex. Read this file together with \`CONTENT_PACK.md\` and \`EXPERIENCE_DIRECTION.md\`.

## 1. Product Summary

${text(establish.direction)}

The product helps ${text(context.who, 'the intended user')} achieve ${text(context.goal, 'the defined goal')}.

## 2. Primary User and Context

- **Primary user:** ${text(context.who)}
- **Goal:** ${text(context.goal)}
- **Observable success:** ${text(context.success)}
- **Important context:** ${text(context.importantContext)}
- **Constraints:** ${text(context.constraints)}

## 3. Product Direction and Decision History

${text(establish.direction)}

${selectedOption ? `- **Selected option:** ${text(selectedOption.name)}\n- **Core idea:** ${text(selectedOption.coreIdea)}` : '- **Selected option:** Not specified'}

${debateRecord(debate)}

## 4. Must Have

${bullets(list(establish.mustHaves))}

## 5. Not in This Version

${bullets(list(establish.nonGoals))}

## 6. Primary Journey and Product Rules

- **Primary journey:** ${text(specify.journeySummary)}
- **One day is complete when:** ${text(specify.dailyCompletionRule)}
- **Return to earlier days:** ${returnRule || 'Not specified'}
- **Day sequence:** ${sequenceRule || 'Not specified'}
- **Save behavior:** ${storageRule || 'Not specified'}
- **Expected time per day:** ${text(specify.dailyDuration)}
- **Product language:** ${text(specify.productLanguage)}
- **Copy that must remain unchanged:** ${text(specify.brandCopy)}

## 7. Content Blueprint

${arcs.map((arc) => `- **${arc.range} — ${arc.title || 'Untitled arc'}:** ${arc.goal || 'Goal not specified'}`).join('\n')}

- **Daily content pattern:** ${text(specify.contentPattern)}
- **Daily exercise pattern:** ${text(specify.exercisePattern)}
- **Daily record pattern:** ${text(specify.recordPattern)}
- **Content Pack status:** ${countCompleteDays(days)}/21 days complete; owner confirmation: ${specify.contentOwnerConfirmed ? 'YES' : 'NO'}
- The full approved daily content is in \`CONTENT_PACK.md\` and must be implemented without silent rewriting.

## 8. Experience Direction

${selectedTheme ? `- **Owner-selected direction:** ${selectedTheme.name}
- **Mood:** ${selectedTheme.mood}
- **Color roles:** background ${selectedTheme.background}; surface ${selectedTheme.surface}; primary ${selectedTheme.primary}; accent ${selectedTheme.accent}; text ${selectedTheme.text}
- **Typography:** ${selectedTheme.typography}
- **Interaction character:** ${selectedTheme.interaction}
- **Rationale:** ${selectedTheme.rationale}
- **Trade-off to manage:** ${selectedTheme.tradeoff}` : '- No experience direction selected.'}
- **Owner confirmation:** ${specify.experienceOwnerConfirmed ? 'YES' : 'NO'}
- Full guardrails and alternatives considered are in \`EXPERIENCE_DIRECTION.md\`.

## 9. Responsive and Accessibility Requirements

- The complete journey must work on desktop, tablet, and mobile without clipped, overlapping, or unreadably small text.
- Thai content must use natural word wrapping; do not break Thai text character by character.
- Interactive controls must be keyboard accessible, have visible focus states, and use semantic labels.
- Respect reduced-motion preferences where animation is used.
- Empty, incomplete, return, and completion states must communicate what happened and what the user can do next.

## 10. Acceptance Criteria

${bullets(acceptance)}

## 11. Basic Technical Constraints

- Build a standalone web app.
- No embedded AI.
- No backend, authentication, or cloud database.
- No required paid or external service.
- Browser/device persistence may be used only according to the locked save behavior.
- Must be deployable to GitHub Pages.
- Do not add analytics or collect personal data unless the owner explicitly makes a new Product Decision.

## 12. Implementation Notes and Decision Boundary

${text(specify.advancedNotes, 'No additional owner-written build notes.')}

Codex may decide component structure, spacing, responsive layout, code organization, validation details, and implementation-level states that do not change the locked product behavior. If an ambiguity would materially change the user, goal, journey, content, completion rule, scope, data behavior, or experience direction, mark it **PRODUCT DECISION REQUIRED** and ask the owner one clear question.

## 13. Cross-step Alignment Record

${alignmentRecord('C', 'O', options)}

${alignmentRecord('O', 'D', debate)}

${alignmentRecord('D', 'E', establish)}

${alignmentRecord('E', 'S', specify)}

When a relationship is **clarifies**, its latest owner interpretation governs how earlier broad wording is implemented. When it is **revision**, this package is not ready to lock and the relevant source step must be revised first. Records marked **Not recorded** belong to a legacy project created before cross-step alignment was introduced and must be checked during PRD review.
`
}

function assembleLegacyPrd(project: ProjectRow, source: PrdSource): string {
  const context = source.C ?? {}
  const options = source.O ?? {}
  const debate = source.D ?? {}
  const establish = source.E ?? {}
  const specify = source.S ?? {}
  const optionList = Array.isArray(options.options) ? options.options : []
  const favoriteIndex = typeof options.favorite === 'number' ? options.favorite : -1
  const favorite = optionList[favoriteIndex]
  const selectedOption = favorite && typeof favorite === 'object' && !Array.isArray(favorite)
    ? favorite as Record<string, Json | undefined>
    : undefined
  const screenList = screens(specify.screens)
  const feel = [...list(specify.feelWords), text(specify.customFeel, '')].filter(Boolean)

  return `# ${project.title}

## 1. Product Name

${project.title}

## 2. Product Summary / Purpose

${text(establish.direction)}

The product helps ${text(context.who, 'the intended user')} achieve ${text(context.goal, 'the defined goal')}.

## 3. User

${text(context.who)}

## 4. Goal / Success

**Goal:** ${text(context.goal)}

**Success looks like:** ${text(context.success)}

## 5. Context & Constraints

**Important context:** ${text(context.importantContext)}

**Constraints:** ${text(context.constraints)}

${debateRecord(debate)}

## 6. Product Direction

${text(establish.direction)}

${selectedOption ? `**Selected option:** ${text(selectedOption.name)}\n\n${text(selectedOption.coreIdea)}` : '**Selected option:** Not specified'}

## 7. Scope / Must Have

${bullets(list(establish.mustHaves))}

## 8. Non-Goals

${bullets(list(establish.nonGoals))}

## 9. Primary User Flow

${numbered(list(specify.flowSteps))}

## 10. Screens & Behaviors

${screenList.length ? screenList.map((screen, index) => `### ${index + 1}. ${text(screen.name)}

- **User sees:** ${text(screen.sees)}
- **User can do:** ${text(screen.actions)}
- **What happens next:** ${text(screen.next)}`).join('\n\n') : 'Not specified'}

## 11. Content Structure

**Content readiness:** ${text(specify.contentReadiness)}

**One day contains:**

${bullets(list(specify.dayFields))}

**Implementation content source:** ${text(specify.contentImplementationReady)}

## 12. Data / Browser State

The app remembers:

${bullets(list(specify.browserState))}

## 13. Visual Character & Design Direction

- **Character:** ${feel.length ? feel.join(', ') : 'Not specified'}
- **Visual style:** ${text(specify.visualStyle)}
- **Primary color role:** ${text(specify.primaryColorRole)}
- **Accent color role:** ${text(specify.accentColorRole)}
- **Background:** ${text(specify.background)}
- **Surface:** ${text(specify.surface)}
- **Interaction tone:** ${text(specify.interactionTone)}
- **Typography:** ${text(specify.typography)}
- **Rationale:** ${text(specify.visualRationale)}

## 14. Edge Cases / Product Rules

- **Browser closes and reopens:** ${text(specify.persistenceRule)}
- **Revisit an earlier day:** ${text(specify.revisitRule)}
- **Skip ahead:** ${text(specify.skipRule)}
- **Required text is empty:** ${text(specify.emptyRule)}
- **Edit a completed day:** ${text(specify.editRule)}
- **Reset:** ${text(specify.resetRule)}

## 15. Responsive / Accessibility Requirements

- **Mobile behavior:** ${text(specify.mobileRule)}
- The app must work on desktop, tablet, and mobile.
- Interactive controls must be keyboard accessible and have visible focus states.
- Use semantic HTML and accessible labels for controls.
- Respect reduced-motion preferences where animation is used.

## 16. Acceptance Criteria

${bullets(list(specify.acceptanceCriteria))}

## 17. Basic Technical Constraints

- Build a standalone web app.
- No backend.
- No authentication.
- No cloud database.
- No required paid or external API.
- Browser or localStorage persistence may be used where needed.
- Must be mobile-friendly.
- Must be deployable to GitHub Pages.

## 18. Handoff Instructions for Codex

Implement this PRD faithfully. Do not add important product features or behaviors that are not defined here. You may make reasonable implementation-level decisions. If an ambiguity would materially change product behavior, flag it as \`PRODUCT DECISION REQUIRED\` instead of silently inventing a product rule.
`
}
