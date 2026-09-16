import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { useLanguage } from '../i18n/LanguageContext'
import { ownJourneyDefinitions, ownJourneyPhases } from './ownJourneyContent'

export function OwnJourneyCompletionPage({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  return <div className="content-page own-completion-page">
    <Link className="back-link" to="/dashboard"><ArrowLeft size={18} /> {isThai ? 'แดชบอร์ด' : 'DASHBOARD'}</Link>
    <header>
      <CheckCircle2 aria-hidden="true" size={54} />
      <span className="chapter-code">BUILD YOUR OWN · COMPLETE</span>
      <h1>{isThai ? 'Build รอบแรกพร้อมสำหรับการพัฒนาต่อ' : 'YOUR FIRST BUILD CYCLE IS COMPLETE'}</h1>
      <p>{isThai ? `Project “${project.title}” ผ่าน CODESIGN ครบตั้งแต่ Context การสร้าง การทดสอบ จนถึง Next Iteration แล้ว` : `“${project.title}” has completed the CODESIGN flow from Context through build, feedback, and Next Iteration.`}</p>
    </header>
    <section className="own-completion-summary">
      <FileText size={30} />
      <div><strong>{isThai ? 'Decision และ Evidence trail ถูกเก็บครบ' : 'COMPLETE DECISION & EVIDENCE TRAIL'}</strong><p>{isThai ? 'ทุก Step ตั้งแต่ C ถึง N ถูก Lock เป็น Version คุณจึงย้อนดูได้ทั้งเหตุผล PRD หลักฐานการสร้าง Feedback และสิ่งที่จะปรับรอบถัดไป' : 'Every step from C through N is locked as a version, preserving the rationale, PRD, build evidence, feedback, and next change.'}</p></div>
    </section>
    <nav className="own-completion-links" aria-label={isThai ? 'เปิดอ่านแต่ละขั้นตอน' : 'Review completed steps'}>
      {ownJourneyPhases.map((phase) => <Link key={phase} to={`/own-projects/${project.id}/${phase}`}><span>{phase}</span><strong>{ownJourneyDefinitions[phase].name}</strong><ArrowLeft size={17} /></Link>)}
    </nav>
    <ArcadeButton to="/dashboard">{isThai ? 'กลับ Dashboard' : 'BACK TO DASHBOARD'} <ArrowLeft size={18} /></ArcadeButton>
  </div>
}
