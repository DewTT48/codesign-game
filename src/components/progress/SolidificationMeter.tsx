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
        className="solid-meter__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={stages.length - 1}
        aria-valuenow={currentIndex}
        aria-label={`Product definition stage: ${current}`}
      >
        {stages.map((stage, index) => (
          <span
            key={stage}
            className={`solid-meter__block ${
              index <= currentIndex ? 'is-filled' : ''
            }`}
          />
        ))}
      </div>
      <ol className="solid-meter__labels" aria-hidden="true">
        {stages.map((stage, index) => (
          <li className={index === currentIndex ? 'is-current' : ''} key={stage}>
            {stage}
          </li>
        ))}
      </ol>
      <p className="meter-note">
        Progress แสดงว่างานนิยาม Product ถูกบันทึกและ Lock แล้ว ไม่ใช่คะแนนความถูกต้อง
      </p>
    </section>
  )
}
