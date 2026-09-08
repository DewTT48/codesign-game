import type { Json, ProjectRow } from '../../lib/supabase/database.types'
import type { PhaseCode, PhaseRevisionRecord } from './journey.service'
import { phaseSequence } from './phaseNavigation'

export const revisionTargets: PhaseCode[] = ['C', 'O', 'D', 'E', 'S', 'PRD']

const booleanConfirmations = new Set([
  'S:contentOwnerConfirmed',
  'S:experienceOwnerConfirmed',
  'I:workingApp',
  'G:mobile',
  'G:start',
  'G:dailyFlow',
  'G:saveData',
  'G:reopen',
  'G:persistence',
  'G:navigation',
  'G:prdRules',
])

const listConfirmations = new Set([
  'PRD:confirmedFiles',
  'PRD:confirmedFilesV2',
])

export function contentForRevision(
  phase: PhaseCode,
  fieldKey: string,
  content: Json,
): Json {
  const key = `${phase}:${fieldKey}`
  if (booleanConfirmations.has(key)) return false
  if (listConfirmations.has(key)) return []
  return content
}

function phasePosition(phase: ProjectRow['current_phase']) {
  return phase === 'COMPLETE' ? phaseSequence.length : phaseSequence.indexOf(phase)
}

export function canStartPhaseRevision(
  targetPhase: PhaseCode,
  currentPhase: ProjectRow['current_phase'],
) {
  return revisionTargets.includes(targetPhase)
    && phasePosition(targetPhase) >= 0
    && phasePosition(targetPhase) < phasePosition(currentPhase)
}

export function affectedRevisionPhases(
  targetPhase: PhaseCode,
  currentPhase: ProjectRow['current_phase'],
): PhaseCode[] {
  if (!canStartPhaseRevision(targetPhase, currentPhase)) return []
  const lastIndex = currentPhase === 'COMPLETE'
    ? phaseSequence.length - 1
    : phaseSequence.indexOf(currentPhase)
  return phaseSequence.slice(phaseSequence.indexOf(targetPhase), lastIndex + 1)
}

export function solidificationBeforePhase(
  phase: PhaseCode,
): ProjectRow['solidification_stage'] {
  if (phase === 'C') return 'IDEA'
  if (phase === 'O' || phase === 'D') return 'UNDERSTOOD'
  if (phase === 'E') return 'EXPLORED'
  if (phase === 'S') return 'DECIDED'
  if (phase === 'PRD') return 'SOLID'
  return 'BUILD_READY'
}

export function isActivePhaseRevision(
  revision: PhaseRevisionRecord | null | undefined,
  currentPhase: ProjectRow['current_phase'],
) {
  if (!revision || currentPhase === 'COMPLETE') return false
  return phasePosition(currentPhase) <= phasePosition(revision.sourceCurrentPhase)
}
