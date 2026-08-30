import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import type { PrdSource } from '../journey.service'

type ScreenSpec = {
  name?: string
  sees?: string
  actions?: string
  next?: string
}

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
  items.length
    ? items.map((item, index) => `${index + 1}. ${item}`).join('\n')
    : `1. ${fallback}`

const screens = (value: Json | undefined) =>
  (Array.isArray(value) ? value : []).filter(
    (item): item is ScreenSpec => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
  )

export function assemblePrd(project: ProjectRow, source: PrdSource): string {
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

**Decision challenge notes:** ${text(debate.whatChanged)}

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

