import { alignmentIsReady, type AlignmentStatus } from './crossStepAlignmentModel'

export type ImplementationRequirementKey =
  | 'workingApp'
  | 'appUrl'
  | 'alignmentStatus'
  | 'alignmentNote'
  | 'alignmentConfirmed'

export function getImplementationReadiness(input: {
  workingApp: boolean
  appUrl: string
  alignmentStatus: AlignmentStatus
  alignmentNote: string
  alignmentConfirmed: boolean
}) {
  const requirements: Record<ImplementationRequirementKey, boolean> = {
    workingApp: input.workingApp,
    appUrl: Boolean(input.appUrl.trim()),
    alignmentStatus: Boolean(input.alignmentStatus) && input.alignmentStatus !== 'revision',
    alignmentNote: input.alignmentStatus === 'clarifies' ? Boolean(input.alignmentNote.trim()) : true,
    alignmentConfirmed: input.alignmentConfirmed,
  }

  return {
    requirements,
    ready: Object.values(requirements).every(Boolean) && alignmentIsReady({
      status: input.alignmentStatus,
      note: input.alignmentNote,
      confirmed: input.alignmentConfirmed,
    }),
  }
}
