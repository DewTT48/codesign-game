import type { Json, ProjectRow } from '../../../lib/supabase/database.types'
import type { JourneyExportData } from '../journey.service'

const text = (value: Json | undefined, fallback = 'Not recorded') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const list = (value: Json | undefined) =>
  (Array.isArray(value) ? value : [])
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    .map((item) => item.trim())

const bullets = (items: string[]) => items.length ? items.map((item) => `- ${item}`).join('\n') : '- Not recorded'

const jsonBlock = (value: Json | undefined) => value === undefined
  ? 'Not recorded'
  : `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``

export function assembleJournal(project: ProjectRow, data: JourneyExportData): string {
  const c = data.phases.C ?? {}
  const o = data.phases.O ?? {}
  const d = data.phases.D ?? {}
  const e = data.phases.E ?? {}
  const s = data.phases.S ?? {}
  const i = data.phases.I ?? {}
  const g = data.phases.G ?? {}
  const n = data.phases.N ?? {}

  return `# CODESIGN JOURNAL — ${project.title}

## Starting Idea

- **Topic:** ${project.topic}
- **Initial content readiness:** ${project.content_readiness}

## C — Context

- **Who:** ${text(c.who)}
- **Goal:** ${text(c.goal)}
- **Success:** ${text(c.success)}
- **Important context:** ${text(c.importantContext)}
- **Constraints:** ${text(c.constraints)}
- **What Chat changed:** ${bullets(list(c.reflection))}
- **What the learner corrected:** ${text(c.corrections)}

## O — Options Explored

${jsonBlock(o.options)}

**Selected favorite index:** ${typeof o.favorite === 'number' ? o.favorite + 1 : 'Not recorded'}

## D — Debate

### AI assumptions, challenges, and changes

${jsonBlock(d.assumptions)}

- **Direction result:** ${text(d.directionResult)}
- **What changed and why:** ${text(d.whatChanged)}

## E — Established Product Scope

**We are building:** ${text(e.direction)}

### Must Have

${bullets(list(e.mustHaves))}

### Not in This Version

${bullets(list(e.nonGoals))}

## S — Specification

### Primary Flow

${bullets(list(s.flowSteps))}

### Screens & Behaviors

${jsonBlock(s.screens)}

### Content & Browser State

- **Content readiness:** ${text(s.contentReadiness)}
- **Implementation source:** ${text(s.contentImplementationReady)}
- **Day fields:** ${list(s.dayFields).join(', ') || 'Not recorded'}
- **Browser state:** ${list(s.browserState).join(', ') || 'Not recorded'}

### Visual Direction

- **Character:** ${list(s.feelWords).join(', ') || 'Not recorded'}
- **Style:** ${text(s.visualStyle)}
- **Rationale:** ${text(s.visualRationale)}

### Edge Cases & Acceptance Criteria

${bullets(list(s.acceptanceCriteria))}

## PRD Snapshot

${data.prd?.markdown_content ?? 'No locked PRD snapshot found.'}

## I — Implement

- **Working app confirmed:** ${String(i.workingApp ?? false)}
- **App URL:** ${data.build?.app_url ?? text(i.appUrl)}
- **Repository URL:** ${data.build?.repository_url ?? text(i.repositoryUrl)}

## G — Get Feedback

- **Expected:** ${text(g.expected)}
- **Actually happened:** ${text(g.actual)}
- **Tester got stuck at:** ${text(g.stuck)}
- **What worked well:** ${text(g.worked)}
- **Most important feedback:** ${text(g.mostImportant)}

## N — Next Iteration

- **Change:** ${text(n.change)}
- **Because:** ${text(n.because)}
- **Expected result:** ${text(n.expectedResult)}

## Decision History

${data.decisions.length ? data.decisions.map((decision) => `- **${decision.phase} / ${decision.decision_type} / v${decision.version}:** ${JSON.stringify(decision.content)}`).join('\n') : '- No decision revisions recorded.'}

---

You don't need the perfect first prompt. You need a process that turns uncertainty into decisions.
`
}

