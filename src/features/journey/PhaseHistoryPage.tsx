import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Eye, FileCode2, History, LockKeyhole, PencilLine, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MissionMap } from '../../components/progress/MissionMap'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import type { Json, ProjectRow } from '../../lib/supabase/database.types'
import { useLanguage } from '../i18n/LanguageContext'
import { getPhaseEntries, getPhaseEntryHistory, startPhaseRevision, type PhaseCode, type PhaseEntry, type PhaseEntryVersion } from './journey.service'
import { currentPhasePath, isCompletedPhase, phaseSequence } from './phaseNavigation'
import { affectedRevisionPhases, revisionTargets } from './phaseRevision'
import { MarkdownPreview } from './prd/MarkdownPreview'

const phaseNames: Record<PhaseCode, { th: string; en: string }> = {
  C: { th: 'ทำความเข้าใจบริบท', en: 'CONTEXT' },
  O: { th: 'สำรวจทางเลือก', en: 'OPTIONS' },
  D: { th: 'ท้าทายสมมติฐาน', en: 'DEBATE' },
  E: { th: 'กำหนดขอบเขต', en: 'ESTABLISH' },
  S: { th: 'ระบุรายละเอียด', en: 'SPECIFY' },
  PRD: { th: 'ชุดส่งต่องาน', en: 'FINAL HANDOFF' },
  I: { th: 'สร้างแอป', en: 'IMPLEMENT' },
  G: { th: 'รับข้อเสนอแนะ', en: 'FEEDBACK' },
  N: { th: 'วางรอบถัดไป', en: 'NEXT ITERATION' },
}

const preferredFields: Record<PhaseCode, string[]> = {
  C: ['who', 'goal', 'success', 'importantContext', 'constraints', 'reflection', 'corrections'],
  O: ['favorite', 'options'],
  D: ['assumptions', 'directionResult', 'whatChanged'],
  E: ['direction', 'mustHaves', 'nonGoals', 'scopeAlignmentConfirmed'],
  S: ['productLanguage', 'brandCopy', 'dailyDuration', 'journeySummary', 'dailyCompletionRule', 'returnRule', 'sequenceRule', 'storageRule', 'contentArcs', 'contentPattern', 'exercisePattern', 'recordPattern', 'dailyContent', 'selectedExperience', 'experienceOptions', 'advancedNotes', 'acceptanceCriteria', 'alignmentStatus', 'alignmentNote', 'alignmentConfirmed'],
  PRD: ['markdownDraft', 'contentPackDraft', 'experienceDirectionDraft', 'reviewOutcomeV2'],
  I: ['githubReadiness', 'workingApp', 'appUrl', 'repositoryUrl'],
  G: ['mobile', 'start', 'dailyFlow', 'saveData', 'reopen', 'persistence', 'navigation', 'prdRules', 'expected', 'actual', 'stuck', 'worked', 'mostImportant'],
  N: ['change', 'because', 'expectedResult'],
}

const thaiLabels: Record<string, string> = {
  who: 'ผู้ใช้หลัก', goal: 'เป้าหมายของผู้ใช้', success: 'ภาพความสำเร็จ', importantContext: 'บริบทสำคัญ', constraints: 'ข้อจำกัด', reflection: 'สิ่งที่ได้จากการคุยกับ Chat', corrections: 'สิ่งที่ต้องแก้ความเข้าใจ',
  favorite: 'ทางเลือกที่เลือกไว้', options: 'ทางเลือกที่สำรวจ', name: 'ชื่อ', coreIdea: 'แนวคิดหลัก', like: 'สิ่งที่ชอบ', tradeoff: 'สิ่งที่ต้องแลก',
  assumptions: 'สมมติฐานที่ท้าทาย', text: 'สมมติฐาน', stance: 'การตัดสินใจ', why: 'เหตุผลของคุณ', directionResult: 'ผลต่อ Direction', whatChanged: 'สิ่งที่เปลี่ยนและเหตุผล',
  direction: 'เรากำลังจะสร้าง', mustHaves: 'สิ่งที่ต้องมีใน Version แรก', nonGoals: 'สิ่งที่ยังไม่ทำใน Version นี้', scopeAlignmentConfirmed: 'ยืนยันความสอดคล้องของขอบเขต',
  productLanguage: 'ภาษาของ Product', brandCopy: 'ข้อความประจำ Product', dailyDuration: 'เวลาต่อวัน', journeySummary: 'เส้นทางหลักของผู้ใช้', dailyCompletionRule: 'หนึ่งวันสำเร็จเมื่อ', returnRule: 'การย้อนกลับมา', sequenceRule: 'ลำดับการทำ', storageRule: 'การจำข้อมูล', contentArcs: 'โครงเนื้อหา 3 ช่วง', contentPattern: 'รูปแบบเนื้อหาประจำวัน', exercisePattern: 'รูปแบบแบบฝึก', recordPattern: 'รูปแบบการบันทึก', dailyContent: 'เนื้อหา 21 วัน', selectedExperience: 'Theme ที่เลือก', experienceOptions: 'แนวทางประสบการณ์ที่พิจารณา', advancedNotes: 'หมายเหตุเพิ่มเติมสำหรับการสร้าง', acceptanceCriteria: 'เกณฑ์ตรวจรับ', alignmentStatus: 'ความสัมพันธ์ระหว่าง Step E และ S', alignmentNote: 'คำอธิบายล่าสุดจาก Step S', alignmentConfirmed: 'ยืนยันการส่งต่อ E → S',
  markdownDraft: 'CODESIGN_HANDOFF.md', contentPackDraft: 'CONTENT_PACK.md', experienceDirectionDraft: 'EXPERIENCE_DIRECTION.md', reviewOutcomeV2: 'ผลการตรวจชุดส่งต่องาน',
  githubReadiness: 'ความพร้อมเรื่อง GitHub', workingApp: 'ยืนยันว่า App ทำงานแล้ว', appUrl: 'Public App URL', repositoryUrl: 'GitHub Repository URL',
  mobile: 'เปิดบนโทรศัพท์แล้ว', start: 'เริ่มโปรแกรมได้', dailyFlow: 'ทดลองหนึ่งวันจนจบแล้ว', saveData: 'บันทึกข้อมูลได้', reopen: 'เปิด App ใหม่แล้ว', persistence: 'ความคืบหน้ายังคงอยู่', navigation: 'ออกแล้วกลับมาได้', prdRules: 'ผ่านกติกาสำคัญจาก PRD', expected: 'สิ่งที่คาดว่าผู้ใช้จะทำ', actual: 'สิ่งที่ผู้ใช้ทำจริง', stuck: 'จุดที่ผู้ใช้ติดขัด', worked: 'สิ่งที่ทำงานได้ดี', mostImportant: 'ข้อเสนอแนะสำคัญที่สุด',
  change: 'สิ่งที่จะเปลี่ยน', because: 'เหตุผล', expectedResult: 'ผลลัพธ์ที่คาดหวัง',
  title: 'หัวข้อ', objective: 'เป้าหมาย', content: 'เนื้อหา', exercise: 'แบบฝึก', record: 'สิ่งที่บันทึก', completion: 'เกณฑ์จบ', duration: 'ระยะเวลา', mood: 'อารมณ์', rationale: 'เหตุผลที่เหมาะ',
}

const codeLabels: Record<string, { th: string; en: string }> = {
  agree: { th: 'ยอมรับ', en: 'AGREE' }, challenge: { th: 'ท้าทาย', en: 'CHALLENGE' },
  'OUR DIRECTION STAYED THE SAME': { th: 'ใช้ Direction เดิมต่อ', en: 'DIRECTION STAYED THE SAME' },
  'WE CHANGED OUR DIRECTION': { th: 'เปลี่ยน Direction', en: 'DIRECTION CHANGED' },
  'allow-edit': { th: 'กลับมาอ่านและแก้ได้', en: 'READ AND EDIT' }, 'read-only': { th: 'กลับมาอ่านได้อย่างเดียว', en: 'READ ONLY' }, 'no-revisit': { th: 'ย้อนกลับไม่ได้', en: 'NO REVISIT' },
  sequential: { th: 'ทำตามลำดับ', en: 'IN ORDER' }, 'allow-skip': { th: 'เลือกหรือข้ามได้', en: 'ALLOW SKIPPING' },
  'browser-device': { th: 'จำไว้ใน Browser เครื่องนี้', en: 'SAVE IN THIS BROWSER' }, 'session-only': { th: 'เก็บเฉพาะตอนเปิดใช้งาน', en: 'THIS SESSION ONLY' },
  th: { th: 'ภาษาไทย', en: 'THAI' }, en: { th: 'ภาษาอังกฤษ', en: 'ENGLISH' }, bilingual: { th: 'สองภาษา', en: 'BILINGUAL' },
  aligned: { th: 'สอดคล้องกัน', en: 'ALIGNED' }, clarifies: { th: 'ทำให้ชัดขึ้น', en: 'CLARIFIES' }, revision: { th: 'ต้องแก้คำตัดสินเดิม', en: 'REVISION REQUIRED' },
  ready: { th: 'พร้อมยืนยัน', en: 'READY TO LOCK' }, files: { th: 'ต้องอัปเดตไฟล์', en: 'FILE UPDATE REQUIRED' },
}

const markdownFields = new Set(['markdownDraft', 'contentPackDraft', 'experienceDirectionDraft'])
const patternFields = new Set(['contentPattern', 'exercisePattern', 'recordPattern'])

function fieldLabel(key: string, isThai: boolean) {
  if (isThai && thaiLabels[key]) return thaiLabels[key]
  return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toUpperCase()
}

function ReadOnlyValue({ value, isThai, depth = 0 }: { value: Json | undefined; isThai: boolean; depth?: number }) {
  if (value === null || value === undefined || value === '') return <span className="phase-history__empty">—</span>
  if (typeof value === 'boolean') return <span className={`phase-history__boolean ${value ? '' : 'is-false'}`}>{value ? <Check size={16} /> : <X size={16} />} {value ? (isThai ? 'ใช่' : 'YES') : (isThai ? 'ไม่' : 'NO')}</span>
  if (typeof value === 'number') return <p>{value}</p>
  if (typeof value === 'string') {
    const translated = codeLabels[value]
    if (/^https?:\/\//.test(value)) return <a href={value} target="_blank" rel="noreferrer">{value}</a>
    return <p>{translated ? (isThai ? translated.th : translated.en) : value}</p>
  }
  if (Array.isArray(value)) {
    if (!value.length) return <span className="phase-history__empty">—</span>
    if (value.every((item) => typeof item !== 'object' || item === null)) {
      return <ul>{value.map((item, index) => <li key={index}><ReadOnlyValue value={item} isThai={isThai} depth={depth + 1} /></li>)}</ul>
    }
    return <div className="phase-history__collection">{value.map((item, index) => {
      const record = item && typeof item === 'object' && !Array.isArray(item) ? item : null
      const itemNumber = typeof record?.day === 'number' ? record.day : index + 1
      const itemName = typeof record?.title === 'string' ? record.title : typeof record?.name === 'string' ? record.name : ''
      return <details key={index} open={value.length <= 5}>
        <summary>{typeof record?.day === 'number' ? 'DAY' : (isThai ? 'รายการ' : 'ITEM')} {String(itemNumber).padStart(2, '0')}{itemName ? ` — ${itemName}` : ''}</summary>
        <ReadOnlyValue value={item} isThai={isThai} depth={depth + 1} />
      </details>
    })}</div>
  }
  return <dl className={`phase-history__object phase-history__object--${Math.min(depth, 2)}`}>
    {Object.entries(value).map(([key, item]) => <div key={key}><dt>{fieldLabel(key, isThai)}</dt><dd><ReadOnlyValue value={item} isThai={isThai} depth={depth + 1} /></dd></div>)}
  </dl>
}

function visibleEntries(phase: PhaseCode, entries: PhaseEntry[]) {
  const byKey = new Map(entries.map((entry) => [entry.fieldKey, entry]))
  const selected = preferredFields[phase].map((key) => byKey.get(key)).filter((entry): entry is PhaseEntry => Boolean(entry))
  return selected.length ? selected : entries
}

export function PhaseHistoryPage({ project, phase }: { project: ProjectRow; phase: PhaseCode }) {
  const { isThai } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const entries = useQuery({ queryKey: ['phase-entries', project.id, phase], queryFn: () => getPhaseEntries(project.id, phase) })
  const history = useQuery({
    queryKey: ['phase-entry-history', project.id, phase],
    queryFn: () => getPhaseEntryHistory(project.id, phase),
    enabled: revisionTargets.includes(phase),
  })
  const currentPath = currentPhasePath(project.id, project.current_phase)
  const name = isThai ? phaseNames[phase].th : phaseNames[phase].en
  const affectedPhases = affectedRevisionPhases(phase, project.current_phase)
  const revision = useMutation({
    mutationFn: () => startPhaseRevision({ projectId: project.id, targetPhase: phase, reason }),
    onSuccess: async (nextProject) => {
      queryClient.setQueryData(['project', project.id], nextProject)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase-entries', project.id] }),
        queryClient.invalidateQueries({ queryKey: ['phase-entry-history', project.id] }),
        queryClient.invalidateQueries({ queryKey: ['phase-revision', project.id] }),
        queryClient.invalidateQueries({ queryKey: ['phase-revisions', project.id] }),
        queryClient.invalidateQueries({ queryKey: ['guidance-source', project.id] }),
        queryClient.invalidateQueries({ queryKey: ['prd-source', project.id] }),
        queryClient.invalidateQueries({ queryKey: ['journey-export', project.id] }),
      ])
      navigate(`/projects/${project.id}/${phase}`, { replace: true })
    },
  })

  if (entries.isLoading) return <div className="route-loading" role="status">{isThai ? 'กำลังโหลดข้อมูลย้อนหลัง…' : 'LOADING STEP HISTORY…'}</div>
  if (entries.isError) return <div className="route-loading" role="alert">{isThai ? 'โหลดข้อมูลย้อนหลังไม่สำเร็จ' : 'STEP HISTORY COULD NOT BE LOADED.'}</div>

  const displayed = visibleEntries(phase, entries.data ?? [])
  const entryMap = new Map((entries.data ?? []).map((entry) => [entry.fieldKey, entry.content]))
  const reviewablePhases = phaseSequence.filter((item) => isCompletedPhase(item, project.current_phase))
  const revisionImpact = phase === 'S'
    ? (isThai ? 'การยืนยัน Content Pack และ Experience Direction จะถูกล้าง และไฟล์ PRD ทั้ง 3 ฉบับต้องตรวจใหม่' : 'Content Pack and Experience confirmations will reset, and all three PRD files must be reviewed again.')
    : phase === 'PRD'
      ? (isThai ? 'สถานะยืนยันไฟล์ทั้ง 3 ฉบับจะถูกล้าง คุณต้องอ่าน Preview ถึงท้ายไฟล์และยืนยันใหม่ทีละไฟล์' : 'All three file confirmations will reset. Read every preview to the end and confirm each file again.')
      : (isThai ? 'คำตอบเดิมจะถูกนำมาเป็นจุดเริ่มต้น แต่ Step ที่ได้รับผลกระทบต้องตรวจยืนยันใหม่' : 'Existing answers remain as a starting point, but affected steps must be reconfirmed.')
  const historyGroups = Array.from((history.data ?? []).reduce((groups, entry) => {
    const group = groups.get(entry.version) ?? []
    group.push(entry)
    groups.set(entry.version, group)
    return groups
  }, new Map<number, PhaseEntryVersion[]>()))

  const displayContent = (entry: PhaseEntry) => {
    if (phase === 'O' && entry.fieldKey === 'favorite' && typeof entry.content === 'number') {
      const options = entryMap.get('options')
      const favorite = Array.isArray(options) ? options[entry.content] : null
      if (favorite && typeof favorite === 'object' && !Array.isArray(favorite) && typeof favorite.name === 'string') return favorite.name
      return isThai ? `ทางเลือก ${entry.content + 1}` : `OPTION ${entry.content + 1}`
    }
    return entry.content
  }

  return <div className="content-page phase-history-page">
    <div className="journey-utility-row">
      <Link className="back-link" to="/dashboard"><ArrowLeft size={18} /> {isThai ? 'แดชบอร์ด' : 'DASHBOARD'}</Link>
      <span className="phase-history__readonly"><LockKeyhole size={15} /> {isThai ? 'ดูย้อนหลัง · ฉบับเดิมยังปลอดภัย' : 'HISTORY · ORIGINAL SAVED'}</span>
    </div>

    <header className="phase-history__hero">
      <div className={`phase-token ${phase.length > 1 ? 'phase-token--wide' : ''}`} aria-hidden="true">{phase}</div>
      <div><span>{isThai ? 'ผลลัพธ์ที่ยืนยันแล้วจาก Step' : 'CONFIRMED STEP OUTPUT'}</span><h1>{name}</h1><p>{isThai ? 'เปิดดูได้โดยไม่เปลี่ยนคำตอบ หากต้องการแก้ไขให้เริ่ม Revision ใหม่เพื่อเก็บฉบับเดิมไว้' : 'Review without changing answers. Start a new revision to edit while preserving this version.'}</p></div>
      <Link to={currentPath}>{isThai ? (project.current_phase === 'COMPLETE' ? 'กลับไปหน้าสรุป' : 'กลับไป Step ปัจจุบัน') : (project.current_phase === 'COMPLETE' ? 'RETURN TO SUMMARY' : 'RETURN TO CURRENT STEP')} <ArrowRight size={17} /></Link>
    </header>

    <div className="journey-status-grid">
      <MissionMap activeMission={project.current_phase} viewedMission={phase} projectId={project.id} compact />
      <SolidificationMeter current={project.solidification_stage.replace('_', ' ') as 'IDEA'} />
    </div>

    <nav className="phase-history__nav" aria-label={isThai ? 'เลือก Step ที่ต้องการดูย้อนหลัง' : 'Choose a completed step to review'}>
      <span>{isThai ? 'ดูย้อนหลัง' : 'HISTORY'}</span>
      <div>{reviewablePhases.map((item) => <Link className={item === phase ? 'is-active' : ''} key={item} to={`/projects/${project.id}/${item}`}>{item} · {isThai ? phaseNames[item].th : phaseNames[item].en}</Link>)}<Link className="phase-history__revision-link" to={`/projects/${project.id}/revisions`}><History size={15} /> {isThai ? 'ประวัติ Revision ทั้งหมด' : 'ALL REVISIONS'}</Link></div>
    </nav>

    <section className="phase-history__results" aria-labelledby="history-results-title">
      <header><Eye size={22} /><div><span>{isThai ? 'ข้อมูลที่ยืนยันแล้ว' : 'CONFIRMED OUTPUT'}</span><h2 id="history-results-title">{isThai ? `สิ่งที่ได้จาก Step ${phase}` : `STEP ${phase} OUTPUT`}</h2></div></header>
      {displayed.length ? <div className="phase-history__fields">{displayed.map((entry) => (
        <article
          key={entry.fieldKey}
          className={[
            markdownFields.has(entry.fieldKey) ? 'is-markdown' : '',
            patternFields.has(entry.fieldKey) ? 'is-pattern' : '',
          ].filter(Boolean).join(' ')}
        >
          <h3>{fieldLabel(entry.fieldKey, isThai)}</h3>
          {markdownFields.has(entry.fieldKey) && typeof entry.content === 'string'
            ? <details><summary><FileCode2 size={17} /> {isThai ? 'เปิดดูไฟล์' : 'OPEN FILE'}</summary><MarkdownPreview markdown={entry.content} /></details>
            : <ReadOnlyValue value={displayContent(entry)} isThai={isThai} />}
        </article>
      ))}</div> : <p className="phase-history__empty-state">{isThai ? 'ยังไม่พบข้อมูลที่บันทึกไว้สำหรับ Step นี้' : 'NO SAVED OUTPUT WAS FOUND FOR THIS STEP.'}</p>}
    </section>

    {historyGroups.length ? <section className="phase-revision-history" aria-labelledby="revision-history-title">
      <header><History size={21} /><div><span>{isThai ? 'ฉบับเดิมที่เก็บไว้' : 'PRESERVED VERSIONS'}</span><h2 id="revision-history-title">{isThai ? 'ประวัติ Revision' : 'REVISION HISTORY'}</h2></div></header>
      <div>{historyGroups.map(([version, versionEntries]) => {
        const savedAt = versionEntries[0]?.updatedAt
        return <details key={version}>
          <summary><span>{isThai ? `ฉบับ v${version}` : `VERSION ${version}`}</span><small>{savedAt ? new Intl.DateTimeFormat(isThai ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(savedAt)) : ''}</small></summary>
          <div className="phase-history__fields">{visibleEntries(phase, versionEntries).map((entry) => <article key={`${version}-${entry.fieldKey}`}>
            <h3>{fieldLabel(entry.fieldKey, isThai)}</h3>
            {markdownFields.has(entry.fieldKey) && typeof entry.content === 'string'
              ? <details><summary><FileCode2 size={17} /> {isThai ? 'เปิดดูไฟล์ฉบับนี้' : 'OPEN THIS VERSION'}</summary><MarkdownPreview markdown={entry.content} /></details>
              : <ReadOnlyValue value={entry.content} isThai={isThai} />}
          </article>)}</div>
        </details>
      })}</div>
    </section> : null}

    {affectedPhases.length ? <aside className="phase-history__revision-note phase-history__revision-note--action">
      <RotateCcw size={21} />
      <div><strong>{isThai ? `ต้องการกลับไปแก้ Step ${phase}?` : `REVISE STEP ${phase}?`}</strong><p>{isThai ? 'ระบบจะเก็บข้อมูลฉบับนี้ไว้ แล้วสร้างฉบับใหม่ที่แก้ไขได้' : 'The app will preserve this version and create a new editable copy.'}</p></div>
      <button type="button" onClick={() => setRevisionOpen(true)}><PencilLine size={17} /> {isThai ? 'สร้าง Revision เพื่อแก้ไข' : 'START A REVISION'}</button>
    </aside> : <aside className="phase-history__revision-note"><LockKeyhole size={20} /><div><strong>{isThai ? 'Step นี้เปิดดูย้อนหลังได้' : 'THIS STEP IS AVAILABLE AS HISTORY'}</strong><p>{isThai ? 'ระบบ Revision รองรับช่วงนิยาม Product ตั้งแต่ Step C ถึง PRD ส่วน Step หลังจากนั้นยังคงเป็นข้อมูลแบบอ่านอย่างเดียว' : 'Revision is available for product-definition Steps C through PRD. Later steps remain read-only for now.'}</p></div></aside>}

    {revisionOpen ? <section className="phase-revision-panel" role="dialog" aria-modal="true" aria-labelledby="phase-revision-title">
      <header><div><span>{isThai ? 'สร้างฉบับใหม่โดยไม่ลบฉบับเดิม' : 'CREATE A NEW VERSION'}</span><h2 id="phase-revision-title">{isThai ? `ย้อนกลับไปแก้ Step ${phase}` : `REVISE STEP ${phase}`}</h2></div><button type="button" aria-label={isThai ? 'ปิด' : 'Close'} onClick={() => setRevisionOpen(false)}><X size={20} /></button></header>
      <div className="phase-revision-panel__warning"><AlertTriangle size={25} /><div><strong>{isThai ? 'การแก้ครั้งนี้มีผลต่อ Step ถัดไป' : 'THIS CHANGE AFFECTS LATER STEPS'}</strong><p>{isThai ? `Step ${affectedPhases.join(' → ')} จะต้องผ่านการตรวจและยืนยันใหม่ เพราะข้อมูลช่วงหลังอาจอ้างอิงคำตอบที่กำลังแก้` : `Steps ${affectedPhases.join(' → ')} must be reviewed and confirmed again because later work may depend on this answer.`}</p><p>{revisionImpact}</p></div></div>
      <label className="phase-revision-panel__reason"><span>{isThai ? 'เหตุผลที่ต้องการแก้ไข' : 'WHY IS THIS REVISION NEEDED?'}</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={isThai ? 'เช่น พบว่ากลุ่มผู้ใช้หลักยังไม่ตรงกับสิ่งที่ต้องการสร้าง' : 'For example: the primary user no longer matches the intended product.'} rows={3} /></label>
      <label className="phase-revision-panel__ack"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>{isThai ? 'ฉันเข้าใจว่า Step ด้านบนต้องตรวจและยืนยันใหม่ แต่ข้อมูลฉบับเดิมจะยังถูกเก็บไว้' : 'I understand the listed steps must be reviewed again and the prior version will remain saved.'}</span></label>
      {revision.isError ? <p className="phase-revision-panel__error" role="alert">{isThai ? 'ยังเริ่ม Revision ไม่สำเร็จ กรุณาลองอีกครั้ง' : 'THE REVISION COULD NOT BE STARTED. PLEASE TRY AGAIN.'}</p> : null}
      <footer><button type="button" className="button-secondary" onClick={() => setRevisionOpen(false)} disabled={revision.isPending}>{isThai ? 'ยกเลิก' : 'CANCEL'}</button><button type="button" className="button-primary" onClick={() => revision.mutate()} disabled={!reason.trim() || !acknowledged || revision.isPending}><RotateCcw size={17} /> {revision.isPending ? (isThai ? 'กำลังสร้าง Revision…' : 'STARTING REVISION…') : (isThai ? 'ยืนยันและเริ่มแก้ไข' : 'CONFIRM AND START')}</button></footer>
    </section> : null}
  </div>
}
