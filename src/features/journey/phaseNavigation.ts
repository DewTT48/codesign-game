import type { ProjectRow } from '../../lib/supabase/database.types'
import type { PhaseCode } from './journey.service'

export const phaseSequence: PhaseCode[] = ['C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N']

export function isCompletedPhase(
  phase: PhaseCode,
  currentPhase: ProjectRow['current_phase'],
) {
  if (currentPhase === 'COMPLETE') return true
  return phaseSequence.indexOf(phase) < phaseSequence.indexOf(currentPhase)
}

export function currentPhasePath(projectId: string, currentPhase: ProjectRow['current_phase']) {
  return `/projects/${projectId}/${currentPhase}`
}
