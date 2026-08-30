import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import { useLanguage } from '../i18n/LanguageContext'
import { createProjectSchema, type CreateProjectInput } from './project.schemas'
import { createGuidedProject } from './project.service'

const readinessOptions: Array<{
  value: CreateProjectInput['contentReadiness']
  label: string
  th: string
  en: string
}> = [
  { value: 'ready', label: 'I HAVE IT READY', th: 'มีเนื้อหา 21 วันพร้อมแล้ว', en: 'All 21 days of content are ready' },
  { value: 'some', label: 'I HAVE SOME', th: 'มีบางส่วนและจะทำต่อระหว่างทาง', en: 'Some content exists; more will be created' },
  { value: 'idea', label: 'I ONLY HAVE AN IDEA', th: 'เริ่มจากไอเดียก็เพียงพอ', en: 'A starting idea is enough' },
]

export function CreateProjectPage() {
  const { isThai } = useLanguage()
  const [topic, setTopic] = useState('')
  const [contentReadiness, setContentReadiness] =
    useState<CreateProjectInput['contentReadiness']>('idea')
  const [validationError, setValidationError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createProject = useMutation({
    mutationFn: createGuidedProject,
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate(`/projects/${project.id}/C`)
    },
  })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = createProjectSchema.safeParse({ topic, contentReadiness })
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? (isThai ? 'ตรวจสอบข้อมูลอีกครั้ง' : 'Please check the information again.'))
      return
    }
    setValidationError(null)
    createProject.mutate(result.data)
  }

  return (
    <div className="content-page create-project-page">
      <Link className="back-link" to="/dashboard">
        <ArrowLeft aria-hidden="true" size={18} /> DASHBOARD
      </Link>
      <header className="page-heading">
        <div>
          <span className="chapter-code">NEW GUIDED BUILD</span>
          <h1>CREATE YOUR PROJECT</h1>
        </div>
        <span className="mission-badge">IDEA</span>
      </header>

      <form className="project-form arcade-panel" onSubmit={handleSubmit}>
        <div className="topic-field">
          <label htmlFor="project-topic">21 DAYS OF</label>
          <input
            id="project-topic"
            name="topic"
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="WRITING"
            autoComplete="off"
            maxLength={80}
            aria-describedby="topic-help topic-error"
          />
          <p id="topic-help">Writing · Exercise · Drawing · Meditation · Learning · Anything</p>
          {validationError ? (
            <p className="field-error" id="topic-error" role="alert">
              {validationError}
            </p>
          ) : null}
        </div>

        <fieldset className="readiness-fieldset">
          <legend>HOW READY IS YOUR CONTENT RIGHT NOW?</legend>
          <p>{isThai ? 'คำตอบนี้ใช้บันทึกจุดเริ่มต้นเท่านั้น ไม่มีตัวเลือกที่ผิด' : 'This only records your starting point. There is no wrong answer.'}</p>
          <div className="readiness-options">
            {readinessOptions.map((option) => (
              <label className="readiness-option" key={option.value}>
                <input
                  type="radio"
                  name="content-readiness"
                  value={option.value}
                  checked={contentReadiness === option.value}
                  onChange={() => setContentReadiness(option.value)}
                />
                <span className="readiness-check" aria-hidden="true">
                  <Check size={16} />
                </span>
                <span>
                  <strong>{option.label}</strong>
                  <small>{isThai ? option.th : option.en}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {createProject.isError ? (
          <div className="form-error" role="alert">
            {isThai ? 'สร้าง Project ไม่สำเร็จ ข้อมูลของคุณยังไม่ถูกบันทึก กรุณาลองใหม่' : 'Could not create the project. Nothing was saved; please try again.'}
          </div>
        ) : null}

        <div className="form-actions">
          <span>AUTOSAVE STARTS AFTER PROJECT CREATION</span>
          <ArcadeButton type="submit" disabled={createProject.isPending}>
            {createProject.isPending ? 'CREATING…' : 'CREATE PROJECT'}
            {!createProject.isPending ? <ArrowRight aria-hidden="true" size={19} /> : null}
          </ArcadeButton>
        </div>
      </form>
    </div>
  )
}
