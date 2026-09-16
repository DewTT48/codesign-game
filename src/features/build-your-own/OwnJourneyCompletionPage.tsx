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
      <h1>{isThai ? 'Product Definition พร้อมส่งต่อแล้ว' : 'YOUR PRODUCT DEFINITION IS READY'}</h1>
      <p>{isThai ? `Project “${project.title}” ผ่าน CODESIGN ครบตั้งแต่ Context ถึง PRD แล้ว` : `“${project.title}” has completed the CODESIGN flow from Context through PRD.`}</p>
    </header>
    <section className="own-completion-summary">
      <FileText size={30} />
      <div><strong>{isThai ? 'Decision trail ถูกเก็บครบ' : 'COMPLETE DECISION TRAIL'}</strong><p>{isThai ? 'ทุก Step ถูก Lock เป็น Version และสามารถเปิดอ่านย้อนหลังได้โดยไม่เปลี่ยนคำตัดสินเดิม' : 'Every step is locked as a version and remains available for review without silently changing prior decisions.'}</p></div>
    </section>
    <nav className="own-completion-links" aria-label={isThai ? 'เปิดอ่านแต่ละขั้นตอน' : 'Review completed steps'}>
      {ownJourneyPhases.map((phase) => <Link key={phase} to={`/own-projects/${project.id}/${phase}`}><span>{phase}</span><strong>{ownJourneyDefinitions[phase].name}</strong><ArrowLeft size={17} /></Link>)}
    </nav>
    <ArcadeButton to="/dashboard">{isThai ? 'กลับ Dashboard' : 'BACK TO DASHBOARD'} <ArrowLeft size={18} /></ArcadeButton>
  </div>
}
