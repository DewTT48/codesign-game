const stages = [
  'IDEA',
  'UNDERSTOOD',
  'EXPLORED',
  'DECIDED',
  'SOLID',
  'BUILD READY',
]

type SolidificationMeterProps = {
  current?: (typeof stages)[number]
}

export function SolidificationMeter({
  current = 'IDEA',
}: SolidificationMeterProps) {
  const { isThai } = useLanguage()
  const currentIndex = stages.indexOf(current)

  return (
    <section className="solid-meter" aria-labelledby="solid-meter-title">
      <div className="solid-meter__header">
        <span className="section-label" id="solid-meter-title">
          PRODUCT DEFINITION
        </span>
        <strong>{current}</strong>
      </div>
      <div
        className="solid-meter__stages"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={stages.length - 1}
        aria-valuenow={currentIndex}
        aria-label={`Product definition stage: ${current}`}
      >
        {stages.map((stage, index) => (
          <div
            key={stage}
            className={`solid-meter__stage ${
              index === currentIndex ? 'is-current' : ''
            }`}
          >
            <span
              className={`solid-meter__block ${
                index <= currentIndex ? 'is-filled' : ''
              }`}
              aria-hidden="true"
            />
            <span className="solid-meter__label" aria-hidden="true">
              {stage}
            </span>
          </div>
        ))}
      </div>
      <p className="meter-note">
        {isThai ? 'Progress นี้แสดงขั้นของการนิยาม Product ที่บันทึกและยืนยันแล้ว ไม่ได้ใช้วัดความถูกต้อง' : 'Progress shows which product decisions are captured and locked. It is not a correctness score.'}
      </p>
    </section>
  )
}
import { useLanguage } from '../../features/i18n/LanguageContext'
