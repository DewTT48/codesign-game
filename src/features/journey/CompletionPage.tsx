import { useQuery } from '@tanstack/react-query'
import { Clipboard, Download, ExternalLink, FileText, Home, Printer, Trophy } from 'lucide-react'
import { useState } from 'react'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import { MissionMap } from '../../components/progress/MissionMap'
import { SolidificationMeter } from '../../components/progress/SolidificationMeter'
import type { ProjectRow } from '../../lib/supabase/database.types'
import { getJourneyExportData } from './journey.service'
import { assembleJournal } from './journal/assembleJournal'
import { useLanguage } from '../i18n/LanguageContext'

const downloadText = (content: string, filename: string) => {
  const file = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function CompletionPage({ project }: { project: ProjectRow }) {
  const { isThai } = useLanguage()
  const [status, setStatus] = useState('')
  const [showJournal, setShowJournal] = useState(false)
  const exportData = useQuery({ queryKey: ['journey-export', project.id], queryFn: () => getJourneyExportData(project.id) })

  if (exportData.isLoading) return <div className="route-loading" role="status">ASSEMBLING YOUR JOURNEY…</div>
  if (exportData.isError || !exportData.data) return <div className="route-loading" role="alert">JOURNEY EXPORT COULD NOT BE LOADED.</div>

  const journal = assembleJournal(project, exportData.data)
  const prd = exportData.data.prd?.markdown_content ?? ''
  const slug = project.topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'codesign'

  const copy = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setStatus(`${label} COPIED`)
    } catch {
      setStatus('COPY FAILED')
    }
  }

  return (
    <div className="content-page completion-page">
      <header className="completion-hero">
        <Trophy size={48} aria-hidden="true" />
        <span>GUIDED BUILD COMPLETE</span>
        <h1>YOU STARTED WITH AN IDEA.</h1>
        <p>{isThai ? 'ตอนนี้คุณมี Product, PRD และบันทึกการตัดสินใจที่อธิบายได้ว่า Product นี้เกิดขึ้นอย่างไร' : 'You now have a product, a PRD, and a decision trail that explains how this product came to be.'}</p>
      </header>

      <MissionMap activeMission="N" compact />
      <SolidificationMeter current="BUILD READY" />

      <section className="completion-artifacts" aria-label="Completed artifacts">
        <article><ExternalLink size={28} /><span>A PRODUCT</span><h2>{project.title}</h2><p>{isThai ? 'Working build ที่ผ่านการทดสอบรอบแรก' : 'A working build that has completed its first test.'}</p>{exportData.data.build ? <a href={exportData.data.build.app_url} target="_blank" rel="noreferrer">VIEW MY APP <ExternalLink size={16} /></a> : null}</article>
        <article><FileText size={28} /><span>A PRD</span><h2>BUILD DEFINITION</h2><p>{isThai ? 'สิ่งที่ Product ควรทำและไม่ควรทำ' : 'What the product should and should not do.'}</p><div><button type="button" disabled={!prd} onClick={() => void copy(prd, 'PRD')}><Clipboard size={16} /> COPY</button><button type="button" disabled={!prd} onClick={() => downloadText(prd, `${slug}-prd.md`)}><Download size={16} /> DOWNLOAD</button></div></article>
        <article><FileText size={28} /><span>A CODESIGN JOURNAL</span><h2>DECISION TRAIL</h2><p>{isThai ? 'เส้นทางจาก Context ถึง Next Iteration' : 'Your path from Context to Next Iteration.'}</p><div><button type="button" onClick={() => setShowJournal((current) => !current)}><FileText size={16} /> {showJournal ? 'HIDE' : 'VIEW'}</button><button type="button" onClick={() => downloadText(journal, `${slug}-journal.md`)}><Download size={16} /> DOWNLOAD</button></div></article>
      </section>

      {showJournal ? <section className="journal-preview"><div><h2>CODESIGN JOURNAL</h2><button type="button" onClick={() => window.print()}><Printer size={16} /> PRINT / PDF</button></div><pre>{journal}</pre></section> : null}

      <blockquote className="completion-principle">You don&apos;t need the perfect first prompt. You need a process that turns uncertainty into decisions.</blockquote>
      {status ? <p className="completion-status" role="status">{status}</p> : null}
      <div className="completion-actions"><ArcadeButton to="/dashboard"><Home size={18} /> RETURN TO DASHBOARD</ArcadeButton><span>BUILD ON YOUR OWN — COMING NEXT</span></div>
    </div>
  )
}
