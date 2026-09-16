import type { AiAction } from './ai/aiPolicy'

export const ownJourneyPhases = ['C', 'O', 'D', 'E', 'S', 'PRD'] as const

export type OwnJourneyPhase = (typeof ownJourneyPhases)[number]

export type OwnJourneyField = {
  key: string
  label: { th: string; en: string }
  question: { th: string; en: string }
  placeholder: { th: string; en: string }
  minLength: number
  required?: boolean
  rows?: number
}

export type OwnJourneySection = {
  title: { th: string; en: string }
  description: { th: string; en: string }
  fields: OwnJourneyField[]
}

export type OwnJourneyDefinition = {
  phase: OwnJourneyPhase
  name: string
  headline: { th: string; en: string }
  principle: { th: string; en: string }
  outcome: { th: string; en: string }
  aiAction: AiAction
  aiTitle: { th: string; en: string }
  aiDescription: { th: string; en: string }
  sections: OwnJourneySection[]
}

const required = true

export const ownJourneyDefinitions: Record<OwnJourneyPhase, OwnJourneyDefinition> = {
  C: {
    phase: 'C',
    name: 'CONTEXT',
    headline: {
      th: 'เข้าใจสถานการณ์ก่อนรีบออกแบบคำตอบ',
      en: 'Understand the situation before designing an answer',
    },
    principle: {
      th: 'แยกสิ่งที่รู้ สิ่งที่เชื่อ และสิ่งที่ยังต้องพิสูจน์ เพื่อให้ Project เริ่มจากปัญหาจริง',
      en: 'Separate what is known, assumed, and still unproven so the project starts from a real problem.',
    },
    outcome: {
      th: 'ได้ Problem Frame ที่ระบุผู้ใช้ หลักฐาน ขอบเขต และผลลัพธ์ที่ต้องการอย่างชัดเจน',
      en: 'A clear problem frame covering users, evidence, boundaries, and the desired outcome.',
    },
    aiAction: 'frame_context',
    aiTitle: { th: 'ให้ AI ช่วยตีกรอบ Context', en: 'Let AI frame the context' },
    aiDescription: {
      th: 'AI จะสรุปภาพรวมและชี้ช่องว่างของหลักฐาน โดยไม่เปลี่ยนสิ่งที่คุณระบุให้กลายเป็นข้อเท็จจริง',
      en: 'AI will frame the situation and surface evidence gaps without turning assumptions into facts.',
    },
    sections: [
      {
        title: { th: 'ปัญหาและคนที่เกี่ยวข้อง', en: 'Problem and people' },
        description: { th: 'อธิบายสิ่งที่เกิดขึ้นด้วยภาษาที่สังเกตได้ ไม่เริ่มจากชื่อฟีเจอร์หรือคำตอบ', en: 'Describe what is happening in observable terms, not as a feature or solution.' },
        fields: [
          { key: 'problemStatement', required, minLength: 40, rows: 5, label: { th: 'สถานการณ์หรือปัญหาหลัก', en: 'Core situation or problem' }, question: { th: 'ตอนนี้เกิดอะไรขึ้น และเหตุใดเรื่องนี้จึงควรได้รับการแก้ไข?', en: 'What is happening now, and why is it worth addressing?' }, placeholder: { th: 'เช่น ผู้จัดการใหม่ใช้เวลาหลายชั่วโมงรวบรวมข้อมูลก่อนคุยพัฒนาทีม แต่ยังไม่มั่นใจว่าควรเริ่มจากประเด็นใด', en: 'Example: New managers spend hours gathering information before development conversations and still do not know where to begin.' } },
          { key: 'targetUsers', required, minLength: 20, rows: 4, label: { th: 'ผู้ใช้และผู้ได้รับผลกระทบ', en: 'Users and affected people' }, question: { th: 'ใครพบปัญหานี้ ในบริบทใด และมีใครได้รับผลต่อเนื่อง?', en: 'Who experiences this, in what context, and who else is affected?' }, placeholder: { th: 'ระบุกลุ่มหลัก บทบาท ช่วงเวลาที่พบปัญหา และผู้เกี่ยวข้องรอง', en: 'Name the primary group, role, moment of need, and secondary stakeholders.' } },
        ],
      },
      {
        title: { th: 'หลักฐานและสภาพปัจจุบัน', en: 'Evidence and current state' },
        description: { th: 'เก็บทั้งหลักฐานที่มี และยอมรับสิ่งที่ยังเป็นเพียงข้อสันนิษฐาน', en: 'Capture available evidence while naming what remains an assumption.' },
        fields: [
          { key: 'currentSituation', required, minLength: 30, rows: 4, label: { th: 'วิธีที่ผู้ใช้รับมืออยู่ตอนนี้', en: 'Current workaround' }, question: { th: 'วันนี้ผู้ใช้แก้ปัญหาอย่างไร และติดขัดตรงไหน?', en: 'How do people handle this today, and where does it break down?' }, placeholder: { th: 'เล่าขั้นตอน เครื่องมือ คนที่ต้องพึ่ง และ friction สำคัญ', en: 'Describe the steps, tools, dependencies, and the main friction.' } },
          { key: 'evidence', required, minLength: 20, rows: 4, label: { th: 'หลักฐานที่มี', en: 'Available evidence' }, question: { th: 'อะไรยืนยันว่าปัญหานี้เกิดขึ้นจริง และส่วนใดยังเป็น assumption?', en: 'What shows this problem is real, and what is still assumed?' }, placeholder: { th: 'เช่น คำพูดผู้ใช้ 5 คน, เวลาที่ใช้, error log, observation หรือ “ยังไม่มีหลักฐาน”', en: 'Examples: five user quotes, time spent, error logs, observations, or “no evidence yet”.' } },
        ],
      },
      {
        title: { th: 'ขอบเขตและผลลัพธ์', en: 'Boundaries and outcome' },
        description: { th: 'กำหนดสนามของ Project ให้กว้างพอจะสร้างคุณค่า แต่แคบพอจะตัดสินใจได้', en: 'Set a scope broad enough to create value and narrow enough to make decisions.' },
        fields: [
          { key: 'scope', required, minLength: 20, rows: 4, label: { th: 'อยู่ในขอบเขต / นอกขอบเขต', en: 'In scope / out of scope' }, question: { th: 'Project นี้จะรับผิดชอบอะไร และตั้งใจยังไม่แก้อะไร?', en: 'What will this project address, and what will it deliberately leave out?' }, placeholder: { th: 'IN: …\nOUT: …', en: 'IN: …\nOUT: …' } },
          { key: 'desiredOutcome', required, minLength: 20, rows: 4, label: { th: 'การเปลี่ยนแปลงที่ต้องการเห็น', en: 'Desired change' }, question: { th: 'หากดีขึ้น ผู้ใช้จะทำอะไรได้ต่างจากเดิม และเราจะสังเกตเห็นอย่างไร?', en: 'If this improves, what can users do differently and how will we notice?' }, placeholder: { th: 'เขียนเป็นการเปลี่ยนพฤติกรรมหรือผลลัพธ์ ไม่ใช่รายการฟีเจอร์', en: 'State a behavioral or outcome change, not a feature list.' } },
          { key: 'constraints', minLength: 0, rows: 3, label: { th: 'ข้อจำกัดที่ทราบ', en: 'Known constraints' }, question: { th: 'มีข้อจำกัดด้านเวลา งบ ข้อมูล เทคโนโลยี นโยบาย หรือทีมอะไรบ้าง?', en: 'What time, budget, data, technology, policy, or team constraints are known?' }, placeholder: { th: 'ระบุข้อจำกัดที่มีผลต่อทางเลือก หรือเว้นว่างหากยังไม่ทราบ', en: 'List constraints that shape the options, or leave blank if unknown.' } },
        ],
      },
    ],
  },
  O: {
    phase: 'O',
    name: 'OPTIONS',
    headline: { th: 'สร้างทางเลือกที่ต่างกันจริงก่อนเลือกทิศทาง', en: 'Create genuinely different options before choosing a direction' },
    principle: { th: 'ทางเลือกที่ดีไม่ใช่ชื่อฟีเจอร์หลายชื่อ แต่คือวิธีสร้างคุณค่าที่มี trade-off ต่างกัน', en: 'Good options are not multiple feature names; they are different ways to create value with distinct trade-offs.' },
    outcome: { th: 'ได้อย่างน้อย 3 ทางเลือก เกณฑ์เปรียบเทียบ และทิศทางเบื้องต้นที่ยังพร้อมรับการท้าทาย', en: 'At least three options, comparison criteria, and a provisional direction ready to be challenged.' },
    aiAction: 'generate_options',
    aiTitle: { th: 'ให้ AI ช่วยแตกทางเลือก', en: 'Let AI expand the options' },
    aiDescription: { th: 'AI จะเสนอทางเลือกที่ต่างกันและทำให้ trade-off มองเห็นได้ชัด โดยยังไม่เลือกแทนคุณ', en: 'AI will propose distinct approaches and make trade-offs visible without choosing for you.' },
    sections: [
      {
        title: { th: 'ชุดทางเลือก', en: 'Option set' },
        description: { th: 'เขียนแต่ละทางเลือกให้เห็นกลไกสร้างคุณค่า ไม่ใช่แค่ชื่อ', en: 'Describe the value mechanism of each option, not just its name.' },
        fields: [
          { key: 'optionIdeas', required, minLength: 80, rows: 9, label: { th: 'ทางเลือกอย่างน้อย 3 แบบ', en: 'At least three options' }, question: { th: 'เราสามารถช่วยผู้ใช้ด้วยแนวทางที่แตกต่างกันอย่างมีนัยสำคัญได้อย่างไร?', en: 'How could we help users through meaningfully different approaches?' }, placeholder: { th: 'OPTION A — ชื่อ / วิธีทำงาน / คุณค่าหลัก\nOPTION B — …\nOPTION C — …', en: 'OPTION A — name / mechanism / core value\nOPTION B — …\nOPTION C — …' } },
          { key: 'evaluationCriteria', required, minLength: 30, rows: 5, label: { th: 'เกณฑ์เปรียบเทียบ', en: 'Comparison criteria' }, question: { th: 'จะใช้เกณฑ์อะไรตัดสินโดยไม่เข้าข้างทางเลือกที่ชอบ?', en: 'Which criteria let you compare without favoring a preferred idea?' }, placeholder: { th: 'เช่น คุณค่าต่อผู้ใช้ ความเสี่ยง เวลา ความสามารถของทีม การเรียนรู้ และต้นทุน', en: 'Examples: user value, risk, time, team capability, learning, and cost.' } },
        ],
      },
      {
        title: { th: 'การเปรียบเทียบและทิศทาง', en: 'Comparison and direction' },
        description: { th: 'บันทึกทั้งเหตุผลที่ชอบและราคาที่ต้องจ่ายของแต่ละทางเลือก', en: 'Record both the appeal and the price of each option.' },
        fields: [
          { key: 'tradeoffs', required, minLength: 40, rows: 6, label: { th: 'Trade-off สำคัญ', en: 'Key trade-offs' }, question: { th: 'แต่ละทางเลือกได้อะไร เสียอะไร และสร้างความเสี่ยงชนิดใด?', en: 'What does each option gain, sacrifice, and risk?' }, placeholder: { th: 'เปรียบเทียบทีละทางเลือกกับเกณฑ์ด้านบน', en: 'Compare each option against the criteria above.' } },
          { key: 'preferredDirection', required, minLength: 20, rows: 4, label: { th: 'ทิศทางที่เอนเอียงในตอนนี้', en: 'Current leaning' }, question: { th: 'ตอนนี้คุณเอนเอียงไปทางไหน เพราะอะไร และอะไรอาจทำให้เปลี่ยนใจ?', en: 'Which direction do you currently favor, why, and what could change your mind?' }, placeholder: { th: 'ยังไม่ใช่คำตัดสินสุดท้าย ระบุเหตุผลและเงื่อนไขที่จะทบทวน', en: 'This is not final. State the rationale and conditions for reconsideration.' } },
          { key: 'rejectedOptions', minLength: 0, rows: 3, label: { th: 'ทางเลือกที่พักไว้', en: 'Parked options' }, question: { th: 'มีทางเลือกใดที่ยังไม่เลือก และควรเก็บเหตุผลไว้หรือไม่?', en: 'Which options are not being pursued, and why should that rationale be preserved?' }, placeholder: { th: 'ทางเลือก / เหตุผลที่พัก / สัญญาณที่จะหยิบกลับมา', en: 'Option / reason parked / signal to revisit.' } },
        ],
      },
    ],
  },
  D: {
    phase: 'D',
    name: 'DEBATE',
    headline: { th: 'ท้าทายสิ่งที่เราอยากเชื่อก่อนผูกมัดการตัดสินใจ', en: 'Challenge what we want to believe before committing' },
    principle: { th: 'เปลี่ยน assumption ให้เป็นคำถามที่ตรวจสอบได้ และมอง failure mode ก่อนต้นทุนการเปลี่ยนใจสูงขึ้น', en: 'Turn assumptions into testable questions and examine failure modes before changing direction becomes expensive.' },
    outcome: { th: 'ได้รายการ assumption ตามระดับผลกระทบ ความเสี่ยงหลัก และแผนลดความไม่แน่นอน', en: 'Prioritized assumptions, major risks, and a plan to reduce uncertainty.' },
    aiAction: 'challenge_assumptions',
    aiTitle: { th: 'ให้ AI ช่วยเป็นฝ่ายคัดค้าน', en: 'Let AI take the dissenting side' },
    aiDescription: { th: 'AI จะชี้ assumption, failure mode และคำถามที่เจ้าของ Project ต้องตอบ โดยไม่ตัดสินว่าคุณผิดหรือถูก', en: 'AI will surface assumptions, failure modes, and owner questions without deciding whether you are right or wrong.' },
    sections: [
      {
        title: { th: 'Assumption และความเสี่ยง', en: 'Assumptions and risks' },
        description: { th: 'ให้ความสำคัญกับสิ่งที่หากผิดแล้วกระทบคุณค่าหรือความเป็นไปได้ของ Product', en: 'Prioritize beliefs that would undermine product value or viability if wrong.' },
        fields: [
          { key: 'assumptions', required, minLength: 50, rows: 7, label: { th: 'Assumption ที่กำลังใช้', en: 'Working assumptions' }, question: { th: 'เรากำลังเชื่ออะไรเกี่ยวกับผู้ใช้ ปัญหา พฤติกรรม ช่องทาง หรือความสามารถของทีม?', en: 'What are we assuming about users, problems, behavior, channels, or team capability?' }, placeholder: { th: 'ระบุแต่ละ assumption พร้อมสถานะ KNOWN / ASSUMED / UNKNOWN', en: 'List each assumption with KNOWN / ASSUMED / UNKNOWN.' } },
          { key: 'keyRisks', required, minLength: 30, rows: 5, label: { th: 'ความเสี่ยงและ Failure mode', en: 'Risks and failure modes' }, question: { th: 'Product อาจล้มเหลวได้อย่างไร แม้ทีมสร้างตามแผนครบ?', en: 'How could the product fail even if the team builds the plan correctly?' }, placeholder: { th: 'ความเสี่ยง / ผลกระทบ / สัญญาณเตือน', en: 'Risk / impact / warning signal.' } },
          { key: 'counterArguments', required, minLength: 30, rows: 5, label: { th: 'ข้อโต้แย้งที่แข็งแรงที่สุด', en: 'Strongest counterarguments' }, question: { th: 'คนที่ไม่เห็นด้วยอย่างมีเหตุผลจะคัดค้านทิศทางนี้ว่าอย่างไร?', en: 'What would a thoughtful skeptic say against this direction?' }, placeholder: { th: 'เขียนข้อโต้แย้งให้แข็งแรงก่อนตอบกลับ', en: 'Steelman the objections before responding.' } },
        ],
      },
      {
        title: { th: 'ลดความไม่แน่นอน', en: 'Reduce uncertainty' },
        description: { th: 'ไม่จำเป็นต้องพิสูจน์ทุกเรื่อง ให้เริ่มจากเรื่องที่ผลกระทบสูงและเรียนรู้ได้เร็ว', en: 'You do not need to prove everything. Start with high-impact questions that can be learned quickly.' },
        fields: [
          { key: 'validationPlan', required, minLength: 30, rows: 5, label: { th: 'แผนตรวจสอบ', en: 'Validation plan' }, question: { th: 'จะหาหลักฐานอะไร ด้วยวิธีใด และใช้เกณฑ์ใดตัดสินว่าจะเดินหน้าหรือเปลี่ยน?', en: 'What evidence will you seek, how, and what criteria determine whether to continue or change?' }, placeholder: { th: 'ASSUMPTION → วิธีตรวจ → เกณฑ์ผ่าน/ไม่ผ่าน → เจ้าของ → เวลา', en: 'ASSUMPTION → test → pass/fail signal → owner → timing.' } },
          { key: 'openQuestions', required, minLength: 20, rows: 4, label: { th: 'คำถามที่ยังเปิดอยู่', en: 'Open questions' }, question: { th: 'เรื่องใดต้องได้รับคำตอบก่อน Commit ทิศทาง?', en: 'Which questions must be answered before committing?' }, placeholder: { th: 'เรียงตามผลกระทบหากตอบผิดหรือยังไม่รู้', en: 'Order by the impact of being wrong or not knowing.' } },
        ],
      },
    ],
  },
  E: {
    phase: 'E',
    name: 'ESTABLISH',
    headline: { th: 'เปลี่ยนการสำรวจให้เป็นคำตัดสินที่ชัดและย้อนตรวจได้', en: 'Turn exploration into a clear, traceable decision' },
    principle: { th: 'การตัดสินใจที่ดีระบุทั้งสิ่งที่เลือก สิ่งที่ไม่เลือก เหตุผล และเงื่อนไขที่จะกลับมาทบทวน', en: 'A sound decision states what is chosen, what is not, why, and when it should be revisited.' },
    outcome: { th: 'ได้ Product Direction ที่มี rationale, must-have, non-goal และ success criteria', en: 'A product direction with rationale, must-haves, non-goals, and success criteria.' },
    aiAction: 'check_alignment',
    aiTitle: { th: 'ให้ AI ตรวจความสอดคล้องก่อนตัดสินใจ', en: 'Let AI check alignment before commitment' },
    aiDescription: { th: 'AI จะเทียบทิศทางกับ Context, Options และ Debate ที่ Lock แล้ว พร้อมชี้ conflict ให้คุณตัดสินใจเอง', en: 'AI will compare the direction against locked Context, Options, and Debate decisions and surface conflicts for you to resolve.' },
    sections: [
      {
        title: { th: 'คำตัดสิน', en: 'The decision' },
        description: { th: 'เขียนให้ทีมที่ไม่ได้ร่วมการสนทนาสามารถเข้าใจและนำไปใช้ได้', en: 'Write so a teammate who missed the discussion can understand and act on it.' },
        fields: [
          { key: 'selectedDirection', required, minLength: 40, rows: 6, label: { th: 'ทิศทางที่เลือก', en: 'Selected direction' }, question: { th: 'เราจะสร้างคุณค่าให้ใคร ด้วยกลไกหลักอะไร และผลลัพธ์สำคัญคืออะไร?', en: 'For whom will we create value, through what core mechanism, and toward what result?' }, placeholder: { th: 'เราตัดสินใจที่จะ… สำหรับ… เพราะ…', en: 'We have decided to… for… because…' } },
          { key: 'rationale', required, minLength: 40, rows: 5, label: { th: 'เหตุผลและหลักฐาน', en: 'Rationale and evidence' }, question: { th: 'เหตุใดทิศทางนี้จึงเหมาะกว่าทางเลือกอื่นจากสิ่งที่เรารู้ตอนนี้?', en: 'Why is this direction preferable to the alternatives based on what is known now?' }, placeholder: { th: 'เชื่อมกลับไปยัง Context เกณฑ์เปรียบเทียบ และผลจาก Debate', en: 'Connect back to Context, comparison criteria, and Debate findings.' } },
        ],
      },
      {
        title: { th: 'ขอบเขตของคำตัดสิน', en: 'Decision boundaries' },
        description: { th: 'ป้องกัน scope creep ด้วยการเขียน Must-have และ Non-goal ให้สมดุลกัน', en: 'Prevent scope creep by balancing must-haves with explicit non-goals.' },
        fields: [
          { key: 'mustHaves', required, minLength: 25, rows: 5, label: { th: 'Must-have', en: 'Must-haves' }, question: { th: 'อะไรต้องมีเพื่อให้ทิศทางนี้ยังคงสร้างคุณค่าตามที่ตัดสินใจ?', en: 'What must be true or present for this direction to deliver its intended value?' }, placeholder: { th: 'รายการสิ่งจำเป็น พร้อมเหตุผลสั้น ๆ', en: 'List essentials with a short reason for each.' } },
          { key: 'nonGoals', required, minLength: 20, rows: 4, label: { th: 'Non-goal', en: 'Non-goals' }, question: { th: 'อะไรดูเกี่ยวข้องแต่ตั้งใจไม่ทำในรอบนี้?', en: 'What seems related but is deliberately excluded from this iteration?' }, placeholder: { th: 'ไม่ทำ… เพราะ…', en: 'We will not… because…' } },
          { key: 'successMetrics', required, minLength: 25, rows: 5, label: { th: 'Success criteria', en: 'Success criteria' }, question: { th: 'สัญญาณใดบอกว่าทิศทางนี้สร้างการเปลี่ยนแปลงที่ต้องการ?', en: 'Which signals show that this direction creates the intended change?' }, placeholder: { th: 'Outcome / วิธีวัด / baseline หรือเป้าหมาย / ช่วงเวลา', en: 'Outcome / measure / baseline or target / time window.' } },
          { key: 'decisionConditions', minLength: 0, rows: 3, label: { th: 'เงื่อนไขทบทวน', en: 'Revisit conditions' }, question: { th: 'หากพบหลักฐานหรือเหตุการณ์ใด เราควรเปิดคำตัดสินนี้ใหม่?', en: 'What evidence or event should trigger a review of this decision?' }, placeholder: { th: 'สัญญาณที่ทำให้หยุด ปรับ หรือเปลี่ยนทิศทาง', en: 'Signals that should cause a pause, adjustment, or direction change.' } },
        ],
      },
    ],
  },
  S: {
    phase: 'S',
    name: 'SPECIFY',
    headline: { th: 'แปลงทิศทางให้เป็นข้อกำหนดที่สร้างและทดสอบได้', en: 'Turn the direction into buildable, testable specifications' },
    principle: { th: 'Specification ที่ดีบอกพฤติกรรม กติกา ข้อมูล และเกณฑ์ยอมรับ โดยไม่บังคับ implementation เกินจำเป็น', en: 'A good specification defines behavior, rules, data, and acceptance without over-prescribing implementation.' },
    outcome: { th: 'ได้ User journey, requirements, business rules, edge cases และ acceptance criteria ที่พร้อมประกอบ PRD', en: 'A user journey, requirements, business rules, edge cases, and acceptance criteria ready for the PRD.' },
    aiAction: 'check_alignment',
    aiTitle: { th: 'ให้ AI ตรวจ Spec กับคำตัดสินก่อนหน้า', en: 'Let AI check the spec against prior decisions' },
    aiDescription: { th: 'AI จะหาความขัดแย้ง ช่องว่าง และ requirement ที่อาจหลุดจาก Must-have หรือ Non-goal', en: 'AI will identify conflicts, gaps, and requirements that drift from must-haves or non-goals.' },
    sections: [
      {
        title: { th: 'ประสบการณ์หลัก', en: 'Core experience' },
        description: { th: 'เล่าตั้งแต่ Trigger จนผู้ใช้ได้รับคุณค่าและรู้ว่าควรทำอะไรต่อ', en: 'Describe the experience from trigger through value realization and the next step.' },
        fields: [
          { key: 'userJourney', required, minLength: 80, rows: 9, label: { th: 'User journey', en: 'User journey' }, question: { th: 'ผู้ใช้เริ่มจากอะไร ทำขั้นตอนใด ตัดสินใจตรงไหน และจบด้วยผลลัพธ์อะไร?', en: 'What triggers the journey, what steps and decisions follow, and what outcome ends it?' }, placeholder: { th: '1. Trigger…\n2. ผู้ใช้…\n3. ระบบ…\n4. ผู้ใช้ได้รับ…', en: '1. Trigger…\n2. The user…\n3. The system…\n4. The user receives…' } },
          { key: 'experienceDirection', required, minLength: 25, rows: 4, label: { th: 'Experience direction', en: 'Experience direction' }, question: { th: 'ประสบการณ์ควรให้ความรู้สึกอย่างไร และมีหลักการออกแบบใดต้องรักษา?', en: 'How should the experience feel, and which design principles must be preserved?' }, placeholder: { th: 'เช่น มั่นใจ ไม่ถูกตัดสิน เห็นความคืบหน้า และแก้ไขย้อนหลังได้', en: 'Examples: confident, non-judgmental, visible progress, and reversible.' } },
        ],
      },
      {
        title: { th: 'พฤติกรรมและกติกา', en: 'Behavior and rules' },
        description: { th: 'เขียนสิ่งที่ระบบต้องทำให้ตรวจสอบได้ โดยแยกจากวิธีเขียนโค้ด', en: 'State testable system behavior separately from implementation choices.' },
        fields: [
          { key: 'functionalRequirements', required, minLength: 80, rows: 9, label: { th: 'Functional requirements', en: 'Functional requirements' }, question: { th: 'ระบบต้องรองรับพฤติกรรมใดเพื่อให้ User journey สำเร็จ?', en: 'Which behaviors must the system support for the user journey to succeed?' }, placeholder: { th: 'FR-01 ระบบต้อง…\nFR-02 ผู้ใช้สามารถ…', en: 'FR-01 The system must…\nFR-02 The user can…' } },
          { key: 'businessRules', required, minLength: 30, rows: 6, label: { th: 'Business rules และสถานะ', en: 'Business rules and states' }, question: { th: 'มีกติกา สิทธิ์ เงื่อนไข สถานะ หรือ transition ใดที่ต้องไม่คลุมเครือ?', en: 'Which rules, permissions, conditions, states, or transitions must be unambiguous?' }, placeholder: { th: 'RULE-01 หาก… ระบบต้อง…\nSTATE: draft → confirmed → locked', en: 'RULE-01 If… the system must…\nSTATE: draft → confirmed → locked' } },
          { key: 'dataInputsOutputs', required, minLength: 25, rows: 5, label: { th: 'ข้อมูลเข้าและผลลัพธ์', en: 'Inputs and outputs' }, question: { th: 'ผู้ใช้หรือระบบส่งข้อมูลอะไร และต้องได้ผลลัพธ์อะไรกลับมา?', en: 'What data enters the flow and what outputs must be produced?' }, placeholder: { th: 'INPUT / แหล่งที่มา / validation / OUTPUT / ผู้ใช้ผลลัพธ์', en: 'INPUT / source / validation / OUTPUT / consumer.' } },
        ],
      },
      {
        title: { th: 'ความพร้อมสำหรับการทดสอบ', en: 'Test readiness' },
        description: { th: 'ครอบคลุมทั้งเส้นทางปกติ ข้อมูลไม่ครบ ความล้มเหลว และการกลับมาทำต่อ', en: 'Cover the happy path, incomplete data, failures, and resuming work.' },
        fields: [
          { key: 'edgeCases', required, minLength: 30, rows: 6, label: { th: 'Edge cases และ failure behavior', en: 'Edge cases and failure behavior' }, question: { th: 'อะไรอาจผิดปกติ ขาดหาย ซ้ำ ล่าช้า หรือถูกทำพร้อมกัน และระบบควรตอบอย่างไร?', en: 'What can be missing, duplicated, delayed, concurrent, or fail, and how should the system respond?' }, placeholder: { th: 'CASE / พฤติกรรมที่คาดหวัง / ข้อความหรือ recovery', en: 'CASE / expected behavior / message or recovery.' } },
          { key: 'acceptanceCriteria', required, minLength: 60, rows: 8, label: { th: 'Acceptance criteria', en: 'Acceptance criteria' }, question: { th: 'ทีมจะพิสูจน์ได้อย่างไรว่า requirement สำเร็จและไม่หลุดจากคำตัดสิน?', en: 'How will the team prove each requirement works and remains aligned with the decision?' }, placeholder: { th: 'GIVEN… WHEN… THEN…\nรวม positive, negative และ permission cases', en: 'GIVEN… WHEN… THEN…\nInclude positive, negative, and permission cases.' } },
        ],
      },
    ],
  },
  PRD: {
    phase: 'PRD',
    name: 'PRODUCT REQUIREMENTS',
    headline: { th: 'ประกอบคำตัดสินทั้งหมดเป็นเอกสารพร้อมส่งต่อ', en: 'Assemble every decision into a build-ready handoff' },
    principle: { th: 'PRD ต้องสังเคราะห์จาก decision ที่ Lock แล้ว ไม่เติม scope ใหม่เงียบ ๆ และต้องย้อนกลับไปยังที่มาของข้อกำหนดได้', en: 'The PRD must synthesize locked decisions, avoid silent scope expansion, and keep requirements traceable to their source.' },
    outcome: { th: 'ได้ PRD Markdown ที่ตรวจความครบ ความสอดคล้อง และพร้อมส่งต่อให้ทีมสร้าง', en: 'A Markdown PRD reviewed for completeness, consistency, and implementation handoff.' },
    aiAction: 'draft_prd',
    aiTitle: { th: 'ให้ AI ร่าง PRD จาก Decision ที่ Lock แล้ว', en: 'Let AI draft the PRD from locked decisions' },
    aiDescription: { th: 'AI จะใช้เฉพาะ decision และ phase entry ที่ยืนยันแล้ว คุณต้องอ่าน แก้ไข และ Accept ก่อน Lock', en: 'AI will use only accepted decisions and locked entries. You must review, edit, and accept before locking.' },
    sections: [
      {
        title: { th: 'เอกสาร PRD', en: 'PRD document' },
        description: { th: 'ใช้โครงด้านล่างเพื่อให้ทีม Product, Design และ Engineering เห็นภาพเดียวกัน', en: 'Use the structure below to align Product, Design, and Engineering.' },
        fields: [
          { key: 'prdMarkdown', required, minLength: 300, rows: 30, label: { th: 'PRD Markdown', en: 'PRD Markdown' }, question: { th: 'เอกสารนี้อธิบายปัญหา คำตัดสิน ขอบเขต Journey Requirements และ Acceptance criteria ครบหรือยัง?', en: 'Does this document fully cover the problem, decisions, scope, journey, requirements, and acceptance criteria?' }, placeholder: { th: '# Product Requirements Document\n\n## 1. Context and problem\n## 2. Users and outcome\n## 3. Goals and non-goals\n## 4. Product direction\n## 5. User journey\n## 6. Functional requirements\n## 7. Business rules and data\n## 8. Acceptance criteria\n## 9. Risks and open questions\n## 10. Release and measurement', en: '# Product Requirements Document\n\n## 1. Context and problem\n## 2. Users and outcome\n## 3. Goals and non-goals\n## 4. Product direction\n## 5. User journey\n## 6. Functional requirements\n## 7. Business rules and data\n## 8. Acceptance criteria\n## 9. Risks and open questions\n## 10. Release and measurement' } },
          { key: 'handoffNotes', minLength: 0, rows: 5, label: { th: 'Handoff notes', en: 'Handoff notes' }, question: { th: 'ทีมสร้างต้องรู้อะไรเพิ่มเติมเกี่ยวกับลำดับ ความเสี่ยง dependency หรือเรื่องที่ยังต้องตัดสินใจ?', en: 'What else should the build team know about sequencing, risks, dependencies, or unresolved decisions?' }, placeholder: { th: 'ระบุ dependency, rollout, owner และ open question ที่ไม่ควรถูกตีความเอง', en: 'List dependencies, rollout notes, owners, and open questions that should not be guessed.' } },
        ],
      },
    ],
  },
}

export function nextOwnJourneyPhase(phase: OwnJourneyPhase): OwnJourneyPhase | 'COMPLETE' {
  const index = ownJourneyPhases.indexOf(phase)
  return ownJourneyPhases[index + 1] ?? 'COMPLETE'
}

export function isOwnJourneyPhase(value: string | undefined): value is OwnJourneyPhase {
  return Boolean(value && ownJourneyPhases.includes(value as OwnJourneyPhase))
}

export function getOwnJourneyInitialValues(definition: OwnJourneyDefinition) {
  return Object.fromEntries(
    definition.sections.flatMap((section) => section.fields.map((field) => [field.key, ''])),
  )
}

export function validateOwnJourneyValues(
  definition: OwnJourneyDefinition,
  values: Record<string, string>,
) {
  return definition.sections.flatMap((section) => section.fields.flatMap((field) => {
    const length = values[field.key]?.trim().length ?? 0
    if (!field.required || length >= field.minLength) return []
    return [{
      fieldKey: field.key,
      message: {
        th: length === 0
          ? `กรุณาตอบ “${field.label.th}”`
          : `“${field.label.th}” ควรมีรายละเอียดอย่างน้อย ${field.minLength} ตัวอักษร`,
        en: length === 0
          ? `Please complete “${field.label.en}”.`
          : `“${field.label.en}” needs at least ${field.minLength} characters.`,
      },
    }]
  }))
}
