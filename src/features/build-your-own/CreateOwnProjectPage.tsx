import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole, Sparkles, TicketCheck, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import { useLanguage } from '../i18n/LanguageContext'
import {
  listMyProjectPasses,
  summarizeProjectPasses,
} from '../project-pass/projectPass.service'
import {
  createOwnProjectSchema,
  type CreateOwnProjectInput,
} from './buildYourOwn.schemas'
import { createOwnProject } from './buildYourOwn.service'

function createCreationKey() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `own:${globalThis.crypto.randomUUID()}`
  }

  const randomValues = new Uint32Array(4)
  globalThis.crypto.getRandomValues(randomValues)
  return `own:${Array.from(randomValues, (value) => value.toString(16)).join('-')}`
}

function creationErrorMessage(error: unknown, isThai: boolean) {
  const message = error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : ''

  if (/available Project Pass is required/i.test(message)) {
    return isThai
      ? 'ไม่มี Project Pass ที่พร้อมใช้ กรุณากลับไปตรวจสอบสิทธิ์อีกครั้ง'
      : 'No Project Pass is available. Return to the dashboard and check your access.'
  }
  if (/already completed/i.test(message)) {
    return isThai
      ? 'รายการนี้เคยสร้าง Project สำเร็จแล้ว กรุณากลับไปที่ Dashboard'
      : 'This request already created a Project. Return to the dashboard.'
  }

  return isThai
    ? 'สร้าง Project ไม่สำเร็จ ระบบยังไม่หัก Pass หากไม่เห็น Project ใหม่ใน Dashboard สามารถลองอีกครั้งได้'
    : 'Could not create the Project. The Pass was not consumed if no new Project appears on the dashboard.'
}

export function CreateOwnProjectPage() {
  const { isThai } = useLanguage()
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [pendingInput, setPendingInput] = useState<CreateOwnProjectInput | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const passes = useQuery({
    queryKey: ['project-passes'],
    queryFn: listMyProjectPasses,
    retry: false,
  })
  const summary = summarizeProjectPasses(passes.data ?? [])
  const createProject = useMutation({
    mutationFn: createOwnProject,
    onSuccess: async (project) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-passes'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
      ])
      navigate(`/own-projects/${project.id}`)
    },
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = createOwnProjectSchema.safeParse({
      title,
      topic,
      creationKey: createCreationKey(),
    })
    if (!result.success) {
      setValidationError(
        result.error.issues[0]?.message
        ?? (isThai ? 'ตรวจสอบข้อมูลอีกครั้ง' : 'Please check the information again.'),
      )
      return
    }
    if (summary.available < 1) return
    setValidationError(null)
    setPendingInput(result.data)
    createProject.reset()
  }

  function closeConfirmation() {
    if (createProject.isPending) return
    setPendingInput(null)
    createProject.reset()
  }

  return (
    <div className="content-page own-create-page">
      <Link className="back-link" to="/dashboard">
        <ArrowLeft aria-hidden="true" size={18} /> DASHBOARD
      </Link>

      <header className="page-heading own-create-heading">
        <div>
          <span className="chapter-code">BUILD YOUR OWN · V2</span>
          <h1>CREATE YOUR OWN PROJECT</h1>
          <p>
            {isThai
              ? 'เริ่มจากผลิตภัณฑ์ที่คุณอยากทำจริง โดยไม่ใช้ข้อจำกัด 21 Days'
              : 'Start with the real product you want to define, without the 21 Days constraint.'}
          </p>
        </div>
        <span className="mission-badge">PROJECT PASS</span>
      </header>

      <section className="own-pass-status" aria-labelledby="pass-status-title">
        <div className="own-pass-status__icon" aria-hidden="true">
          <TicketCheck size={32} />
        </div>
        <div>
          <span className="panel-kicker">YOUR ACCESS</span>
          <h2 id="pass-status-title">
            {passes.isLoading
              ? 'CHECKING PROJECT PASS…'
              : `${summary.available} PROJECT ${summary.available === 1 ? 'PASS' : 'PASSES'} AVAILABLE`}
          </h2>
          <p>
            {isThai
              ? '1 Pass ใช้เปิด 1 Project ระบบจะหักเมื่อคุณกดยืนยันในขั้นตอนสุดท้ายเท่านั้น'
              : 'One Pass opens one Project. It is consumed only when you confirm the final creation step.'}
          </p>
        </div>
      </section>

      {passes.isError ? (
        <section className="dashboard-state dashboard-state--error own-pass-error" role="alert">
          <strong>PROJECT PASS SERVICE NOT READY</strong>
          <p>
            {isThai
              ? 'Environment นี้ยังอ่าน Project Pass ไม่ได้ กรุณาตรวจว่า apply migration ของ Phase 1 แล้ว'
              : 'This environment cannot read Project Passes yet. Confirm that the Phase 1 migration has been applied.'}
          </p>
          <button type="button" onClick={() => void passes.refetch()}>RETRY</button>
        </section>
      ) : null}

      {!passes.isLoading && !passes.isError && summary.available === 0 ? (
        <section className="own-no-pass" role="status">
          <LockKeyhole aria-hidden="true" size={28} />
          <div>
            <strong>{isThai ? 'ยังไม่มี Project Pass ที่พร้อมใช้' : 'NO PROJECT PASS AVAILABLE'}</strong>
            <p>
              {isThai
                ? 'Build Your Own ไม่มี Free Tier การซื้อผ่าน Stripe ยังไม่เปิดใน Phase นี้'
                : 'Build Your Own has no Free Tier. Stripe purchase is not open in this phase.'}
            </p>
          </div>
        </section>
      ) : null}

      <form className="own-project-form arcade-panel" onSubmit={handleSubmit}>
        <div className="own-form-intro">
          <Sparkles aria-hidden="true" size={28} />
          <div>
            <span className="panel-kicker">PROJECT START</span>
            <h2>{isThai ? 'ตั้งชื่อสิ่งที่คุณกำลังจะสร้าง' : 'NAME WHAT YOU WANT TO BUILD'}</h2>
            <p>
              {isThai
                ? 'การกรอกและแก้ไขข้อมูลในหน้านี้ยังไม่ใช้ Pass'
                : 'Typing and editing on this page does not consume a Pass.'}
            </p>
          </div>
        </div>

        <label className="own-form-field" htmlFor="own-project-title">
          <span>{isThai ? 'ชื่อ Project' : 'PROJECT NAME'}</span>
          <input
            id="own-project-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={isThai ? 'เช่น ระบบช่วยวางแผนการเรียนรู้' : 'e.g. Learning Plan Companion'}
            maxLength={120}
            autoComplete="off"
            aria-describedby="own-title-help"
          />
          <small id="own-title-help">
            {isThai ? 'ใช้ชื่อที่สื่อว่านี่คือผลิตภัณฑ์อะไร เปลี่ยนภายหลังได้' : 'Use a clear product name. You can refine it later.'}
          </small>
        </label>

        <label className="own-form-field" htmlFor="own-project-topic">
          <span>{isThai ? 'หัวข้อหรือปัญหาที่อยากสำรวจ' : 'TOPIC OR PROBLEM SPACE'}</span>
          <textarea
            id="own-project-topic"
            name="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={isThai ? 'สรุปสั้น ๆ ว่าคุณกำลังสนใจเรื่องอะไร' : 'Briefly describe what you want to explore.'}
            maxLength={80}
            rows={3}
            aria-describedby="own-topic-help"
          />
          <small id="own-topic-help">
            {isThai ? 'ยังไม่ต้องระบุ Feature หรือ Solution' : 'Do not define features or a solution yet.'}
          </small>
        </label>

        {validationError ? <p className="field-error" role="alert">{validationError}</p> : null}

        <div className="own-form-actions">
          <p>
            <KeyRound aria-hidden="true" size={18} />
            {isThai ? 'Pass จะยังไม่ถูกใช้จนกว่าจะกดยืนยันในหน้าต่างถัดไป' : 'Your Pass stays available until the next confirmation.'}
          </p>
          <ArcadeButton
            type="submit"
            disabled={passes.isLoading || passes.isError || summary.available < 1}
          >
            REVIEW & CONFIRM <ArrowRight aria-hidden="true" size={18} />
          </ArcadeButton>
        </div>
      </form>

      {pendingInput ? (
        <div
          className="delete-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeConfirmation()
          }}
        >
          <section className="delete-dialog own-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="own-confirm-title">
            <button
              className="delete-dialog__close"
              type="button"
              aria-label={isThai ? 'ปิด' : 'Close'}
              disabled={createProject.isPending}
              onClick={closeConfirmation}
            >
              <X aria-hidden="true" size={22} />
            </button>
            <TicketCheck className="own-confirm-dialog__icon" aria-hidden="true" size={36} />
            <span className="chapter-code">FINAL CONFIRMATION</span>
            <h2 id="own-confirm-title">USE 1 PROJECT PASS?</h2>
            <p>
              {isThai
                ? 'เมื่อยืนยัน ระบบจะสร้าง Project และหัก Pass พร้อมกัน หากสร้างไม่สำเร็จ Pass จะไม่ถูกหัก'
                : 'Confirming creates the Project and consumes the Pass together. A failed creation does not consume it.'}
            </p>
            <dl className="own-confirm-summary">
              <div><dt>{isThai ? 'Project' : 'PROJECT'}</dt><dd>{pendingInput.title}</dd></div>
              <div><dt>{isThai ? 'หัวข้อ' : 'TOPIC'}</dt><dd>{pendingInput.topic}</dd></div>
              <div><dt>{isThai ? 'ใช้สิทธิ์' : 'ACCESS'}</dt><dd>1 PROJECT PASS</dd></div>
            </dl>
            <p className="own-confirm-warning">
              {isThai
                ? 'การลบ Project ภายหลังจะไม่คืน Pass อัตโนมัติ'
                : 'Deleting this Project later will not automatically restore the Pass.'}
            </p>
            {createProject.isError ? (
              <p className="field-error" role="alert">{creationErrorMessage(createProject.error, isThai)}</p>
            ) : null}
            <div className="delete-dialog__actions">
              <button type="button" disabled={createProject.isPending} onClick={closeConfirmation}>
                {isThai ? 'กลับไปแก้ไข' : 'GO BACK'}
              </button>
              <ArcadeButton
                type="button"
                disabled={createProject.isPending}
                onClick={() => createProject.mutate(pendingInput)}
              >
                {createProject.isPending
                  ? 'CREATING…'
                  : createProject.isError
                    ? 'TRY AGAIN'
                    : 'CONFIRM & CREATE'}
              </ArcadeButton>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
