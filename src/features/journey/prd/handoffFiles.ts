import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import {
  normalizeContentArcs,
  normalizeDailyContent,
  normalizeExperienceOptions,
} from '../specify/specifyModel'

export type GitHubReadiness = 'ready' | 'need-account' | 'unsure'

type SpecifyData = Record<string, Json | undefined>

const value = (input: Json | undefined, fallback = 'Not specified') =>
  typeof input === 'string' && input.trim() ? input.trim() : fallback

const list = (input: Json | undefined) => (Array.isArray(input) ? input : [])
  .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
  .map((item) => item.trim())

export function assembleContentPack(specify: SpecifyData) {
  const arcs = normalizeContentArcs(specify.contentArcs)
  const days = normalizeDailyContent(specify.dailyContent)

  return `# CONTENT PACK — ${value(specify.brandCopy, '21 DAYS OF')}

## Content Blueprint

${arcs.map((arc) => `### ${arc.range} — ${arc.title || 'Untitled arc'}

${arc.goal || 'Goal not specified.'}`).join('\n\n')}

## Daily Pattern

- **Content:** ${value(specify.contentPattern)}
- **Exercise:** ${value(specify.exercisePattern)}
- **Record:** ${value(specify.recordPattern)}

${days.map((day) => `## DAY ${String(day.day).padStart(2, '0')} — ${day.title || 'Untitled'}

- **Objective:** ${day.objective || 'Not specified'}
- **Duration:** ${day.duration || 'Not specified'}
- **Content:** ${day.content || 'Not specified'}
- **Exercise:** ${day.exercise || 'Not specified'}
- **Reflection:** ${day.reflection || 'Not specified'}
- **Record:** ${day.record || 'Not specified'}
- **Completion:** ${day.completion || 'Not specified'}`).join('\n\n')}
`
}

export function assembleExperienceDirection(specify: SpecifyData) {
  const options = normalizeExperienceOptions(specify.experienceOptions)
  const selectedName = value(specify.selectedExperience, '')
  const selected = options.find((option) => option.name === selectedName) ?? options[0]

  return `# EXPERIENCE DIRECTION

## Owner Decision

**Selected direction:** ${selected?.name ?? 'Not selected'}

This is a direction for implementation, not a request to copy another product or to treat every visual detail as fixed.

${selected ? `## Visual System

- **Mood:** ${selected.mood || 'Not specified'}
- **Background:** ${selected.background}
- **Surface:** ${selected.surface}
- **Primary action:** ${selected.primary}
- **Accent:** ${selected.accent}
- **Text:** ${selected.text}
- **Typography:** ${selected.typography || 'Not specified'}
- **Interaction character:** ${selected.interaction || 'Not specified'}
- **Rationale:** ${selected.rationale || 'Not specified'}
- **Trade-off to manage:** ${selected.tradeoff || 'Not specified'}` : 'No experience direction has been selected.'}

## Alternatives Considered

${options.map((option) => `- **${option.name}:** ${option.mood || 'No mood recorded'}${option.name === selected?.name ? ' — SELECTED BY OWNER' : ''}`).join('\n')}

## Implementation Guardrails

- Preserve readable contrast and comfortable body-text sizes.
- Make the complete journey work on desktop, tablet, and mobile.
- Keep Thai word wrapping natural; do not force character-by-character breaks.
- Use motion only when it clarifies state or progress, and respect reduced-motion settings.
- Codex may refine spacing, layout, and component details without changing the chosen mood or color roles.
`
}

export function assembleStartWithCodex(project: ProjectRow, readiness: GitHubReadiness = 'unsure') {
  const readinessInstruction = {
    ready: 'The owner already has a GitHub account. Confirm the intended account, then guide repository creation and GitHub Pages setup.',
    'need-account': 'The owner does not yet have a GitHub account. Explain GitHub in plain language and guide account creation before repository setup.',
    unsure: 'The owner is unsure about GitHub. First explain what an account, repository, commit, push, and GitHub Pages mean; then help them determine whether an account already exists.',
  }[readiness]

  return `# START WITH CODEX — ${project.title}

Help a non-technical product owner turn the attached CODESIGN handoff into a working web app.

## Read These Files First

1. \`CODESIGN_HANDOFF.md\` — product decisions and build constraints
2. \`CONTENT_PACK.md\` — all 21 days of content, exercises, reflection, and recording rules
3. \`EXPERIENCE_DIRECTION.md\` — the owner-selected visual and interaction direction

Treat these files as the source of truth. Do not silently invent a behavior that changes the product. Mark any material ambiguity as **PRODUCT DECISION REQUIRED** and ask one clear question.

## GitHub Readiness

${readinessInstruction}

GitHub is the online home for the project files and their change history. GitHub Pages publishes this standalone web app at a public URL.

- Guide the owner one step at a time and explain unfamiliar terms before using them.
- Never request or handle the owner's password, verification code, recovery code, or two-factor authentication secret.
- Pause for the owner to complete sign-in, CAPTCHA, email verification, or security confirmation themselves.
- Do not require the owner to use a terminal if Codex can safely perform the step.

## Build Mission

1. Briefly restate the product, primary journey, daily completion rule, and selected experience direction.
2. Identify only genuine product-decision gaps. Do not turn implementation preferences into questions.
3. Create the project and repository with a clear README.
4. Build the complete 21-day standalone web app.
5. Store progress only in the browser/device as specified; do not add Auth, backend, cloud database, embedded AI, analytics, or paid services.
6. Test the full journey on desktop, tablet, and mobile, including keyboard use, empty states, returning to the app, and Thai text wrapping where relevant.
7. Show the owner a preview, fix implementation issues, then publish through GitHub Pages.
8. Return the repository URL, public app URL, test summary, and any remaining limitations.

Start by reading the three handoff files and giving the owner a short readiness summary. Then proceed with the safest useful next step.
`
}

export function defaultAcceptanceCriteria(specify: SpecifyData) {
  const custom = list(specify.acceptanceCriteria)
  if (custom.length) return custom
  const returnRule = value(specify.returnRule, 'allow-edit')
  const sequenceRule = value(specify.sequenceRule, 'sequential')
  const storageRule = value(specify.storageRule, 'browser-device')
  return [
    'The user can open and complete all 21 days with the supplied content, exercise, reflection, and record prompt.',
    `A day is complete only when: ${value(specify.dailyCompletionRule)}`,
    `Earlier days follow the locked return rule: ${returnRule}.`,
    `Day access follows the locked sequence rule: ${sequenceRule}.`,
    `Progress follows the locked storage rule: ${storageRule}.`,
    'The selected experience direction remains readable and usable on desktop, tablet, and mobile.',
  ]
}
