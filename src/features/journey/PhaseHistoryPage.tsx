import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, Eye, FileCode2, LockKeyhole, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MissionMap } from '../../components/progress/MissionMap'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import type { Json, ProjectRow } from '../../lib/supabase/database.types'
import { useLanguage } from '../i18n/LanguageContext'
import { getPhaseEntries, type PhaseCode, type PhaseEntry } from './journey.service'
import { currentPhasePath, isCompletedPhase, phaseSequence } from './phaseNavigation'
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
  E: ['direction', 'mustHaves', 'nonGoals'],
  S: ['productLanguage', 'brandCopy', 'dailyDuration', 'journeySummary', 'dailyCompletionRule', 'returnRule', 'sequenceRule', 'storageRule', 'contentArcs', 'contentPattern', 'exercisePattern', 'recordPattern', 'dailyContent', 'selectedExperience', 'experienceOptions', 'advancedNotes', 'acceptanceCriteria'],
  PRD: ['markdownDraft', 'contentPackDraft', 'experienceDirectionDraft'],
  I: ['githubReadiness', 'workingApp', 'appUrl', 'repositoryUrl'],
  G: ['mobile', 'start', 'dailyFlow', 'saveData', 'reopen', 'persistence', 'navigation', 'prdRules', 'expected', 'actual', 'stuck', 'worked', 'mostImportant'],
  N: ['change', 'because', 'expectedResult'],
}

const thaiLabels: Record<string, string> = {
  who: 'ผู้ใช้หลัก', goal: 'เป้าหมายของผู้ใช้', success: 'ภาพความสำเร็จ', importantContext: 'บริบทสำคัญ', constraints: 'ข้อจำกัด', reflection: 'สิ่งที่ได้จากการคุยกับ Chat', corrections: 'สิ่งที่ต้องแก้ความเข้าใจ',
  favorite: 'ทางเลือกที่เลือกไว้', options: 'ทางเลือกที่สำรวจ', name: 'ชื่อ', coreIdea: 'แนวคิดหลัก', like: 'สิ่งที่ชอบ', tradeoff: 'สิ่งที่ต้องแลก',
  assumptions: 'สมมติฐานที่ท้าทาย', text: 'สมมติฐาน', stance: 'การตัดสินใจ', why: 'เหตุผลของคุณ', directionResult: 'ผลต่อ Direction', whatChanged: 'สิ่งที่เปลี่ยนและเหตุผล',
  direction: 'เรากำลังจะสร้าง', mustHaves: 'สิ่งที่ต้องมีใน Version แรก', nonGoals: 'สิ่งที่ยังไม่ทำใน Version นี้',
  productLanguage: 'ภาษาของ Product', brandCopy: 'ข้อความประจำ Product', dailyDuration: 'เวลาต่อวัน', journeySummary: 'เส้นทางหลักของผู้ใช้', dailyCompletionRule: 'หนึ่งวันสำเร็จเมื่อ', returnRule: 'การย้อนกลับมา', sequenceRule: 'ลำดับการทำ', storageRule: 'การจำข้อมูล', contentArcs: 'โครงเนื้อหา 3 ช่วง', contentPattern: 'รูปแบบเนื้อหาประจำวัน', exercisePattern: 'รูปแบบแบบฝึก', recordPattern: 'รูปแบบการบันทึก', dailyContent: 'เนื้อหา 21 วัน', selectedExperience: 'Theme ที่เลือก', experienceOptions: 'แนวทางประสบการณ์ที่พิจารณา', advancedNotes: 'หมายเหตุเพิ่มเติมสำหรับการสร้าง', acceptanceCriteria: 'เกณฑ์ตรวจรับ',
  markdownDraft: 'CODESIGN_HANDOFF.md', contentPackDraft: 'CONTENT_PACK.md', experienceDirectionDraft: 'EXPERIENCE_DIRECTION.md',
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
}

const markdownFields = new Set(['markdownDraft', 'contentPackDraft', 'experienceDirectionDraft'])

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
  const entries = useQuery({ queryKey: ['phase-entries', project.id, phase], queryFn: () => getPhaseEntries(project.id, phase) })
  const currentPath = currentPhasePath(project.id, project.current_phase)
  const name = isThai ? phaseNames[phase].th : phaseNames[phase].en

  if (entries.isLoading) return <div className="route-loading" role="status">{isThai ? 'กำลังโหลดข้อมูลย้อนหลัง…' : 'LOADING STEP HISTORY…'}</div>
  if (entries.isError) return <div className="route-loading" role="alert">{isThai ? 'โหลดข้อมูลย้อนหลังไม่สำเร็จ' : 'STEP HISTORY COULD NOT BE LOADED.'}</div>

  const displayed = visibleEntries(phase, entries.data ?? [])
  const entryMap = new Map((entries.data ?? []).map((entry) => [entry.fieldKey, entry.content]))
  const reviewablePhases = phaseSequence.filter((item) => isCompletedPhase(item, project.current_phase))

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
      <span className="phase-history__readonly"><LockKeyhole size={15} /> {isThai ? 'ดูย้อนหลัง · แก้ไขไม่ได้' : 'HISTORY · READ ONLY'}</span>
    </div>

    <header className="phase-history__hero">
      <div className={`phase-token ${phase.length > 1 ? 'phase-token--wide' : ''}`} aria-hidden="true">{phase}</div>
      <div><span>{isThai ? 'ผลลัพธ์ที่ยืนยันแล้วจาก Step' : 'CONFIRMED STEP OUTPUT'}</span><h1>{name}</h1><p>{isThai ? 'หน้านี้ใช้สำหรับทบทวนข้อมูลเดิมเท่านั้น การเปิดดูจะไม่เปลี่ยนคำตอบหรือสร้าง Revision ใหม่' : 'This page is for reviewing prior work. Opening it never changes answers or creates a revision.'}</p></div>
      <Link to={currentPath}>{isThai ? (project.current_phase === 'COMPLETE' ? 'กลับไปหน้าสรุป' : 'กลับไป Step ปัจจุบัน') : (project.current_phase === 'COMPLETE' ? 'RETURN TO SUMMARY' : 'RETURN TO CURRENT STEP')} <ArrowRight size={17} /></Link>
    </header>

    <div className="journey-status-grid">
      <MissionMap activeMission={project.current_phase} viewedMission={phase} projectId={project.id} compact />
      <SolidificationMeter current={project.solidification_stage.replace('_', ' ') as 'IDEA'} />
    </div>

    <nav className="phase-history__nav" aria-label={isThai ? 'เลือก Step ที่ต้องการดูย้อนหลัง' : 'Choose a completed step to review'}>
      <span>{isThai ? 'ดูย้อนหลัง' : 'HISTORY'}</span>
      <div>{reviewablePhases.map((item) => <Link className={item === phase ? 'is-active' : ''} key={item} to={`/projects/${project.id}/${item}`}>{item} · {isThai ? phaseNames[item].th : phaseNames[item].en}</Link>)}</div>
    </nav>

    <section className="phase-history__results" aria-labelledby="history-results-title">
      <header><Eye size={22} /><div><span>{isThai ? 'ข้อมูลที่ยืนยันแล้ว' : 'CONFIRMED OUTPUT'}</span><h2 id="history-results-title">{isThai ? `สิ่งที่ได้จาก Step ${phase}` : `STEP ${phase} OUTPUT`}</h2></div></header>
      {displayed.length ? <div className="phase-history__fields">{displayed.map((entry) => (
        <article key={entry.fieldKey} className={markdownFields.has(entry.fieldKey) ? 'is-markdown' : ''}>
          <h3>{fieldLabel(entry.fieldKey, isThai)}</h3>
          {markdownFields.has(entry.fieldKey) && typeof entry.content === 'string'
            ? <details><summary><FileCode2 size={17} /> {isThai ? 'เปิดดูไฟล์' : 'OPEN FILE'}</summary><MarkdownPreview markdown={entry.content} /></details>
            : <ReadOnlyValue value={displayContent(entry)} isThai={isThai} />}
        </article>
      ))}</div> : <p className="phase-history__empty-state">{isThai ? 'ยังไม่พบข้อมูลที่บันทึกไว้สำหรับ Step นี้' : 'NO SAVED OUTPUT WAS FOUND FOR THIS STEP.'}</p>}
    </section>

    <aside className="phase-history__revision-note"><LockKeyhole size={20} /><div><strong>{isThai ? 'ยังไม่มีการแก้ไขในหน้านี้' : 'EDITING IS NOT ENABLED HERE'}</strong><p>{isThai ? 'การแก้ไข Step ที่ผ่านแล้วและการสร้าง Revision ใหม่จะเพิ่มในขั้นถัดไป เพื่อให้ข้อมูลฉบับเดิมยังคงปลอดภัย' : 'Editing completed steps and creating a new revision will be added next so the current version remains protected.'}</p></div></aside>
  </div>
}
