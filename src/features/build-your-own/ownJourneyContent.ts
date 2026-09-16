import type { AiAction } from './ai/aiPolicy'

export const ownJourneyPhases = ['C', 'O', 'D', 'E', 'S', 'PRD', 'I', 'G', 'N'] as const

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
  aiAction?: AiAction
  aiTitle?: { th: string; en: string }
  aiDescription?: { th: string; en: string }
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
  I: {
    phase: 'I',
    name: 'IMPLEMENT',
    headline: { th: 'เปลี่ยน PRD ที่ Lock แล้วให้เป็น Product ที่ใช้งานได้จริง', en: 'Turn the locked PRD into a working product' },
    principle: { th: 'การสร้างคือการพิสูจน์ว่า Requirement ชัดพอจะกลายเป็นพฤติกรรมจริงได้ โดยไม่เติม Product decision ใหม่อย่างเงียบ ๆ', en: 'Implementation proves that requirements can become real behavior without silently inventing new product decisions.' },
    outcome: { th: 'ได้ Build ที่เปิดใช้งานได้ หลักฐานการทดสอบเส้นทางหลัก และรายการความต่างจาก PRD ที่ตรวจสอบย้อนกลับได้', en: 'A reachable build, evidence that the primary journey works, and a traceable record of any differences from the PRD.' },
    sections: [
      {
        title: { th: 'แผนการสร้าง', en: 'Build plan' },
        description: { th: 'แปลง Scope และ Acceptance criteria เป็นลำดับงานที่สร้างและตรวจสอบได้', en: 'Translate scope and acceptance criteria into a buildable, verifiable sequence.' },
        fields: [
          { key: 'implementationApproach', required, minLength: 60, rows: 7, label: { th: 'แนวทางการสร้าง', en: 'Implementation approach' }, question: { th: 'จะสร้าง Product นี้ด้วยสถาปัตยกรรม เครื่องมือ และขอบเขตทางเทคนิคแบบใด?', en: 'Which architecture, tools, and technical boundaries will be used to build this product?' }, placeholder: { th: 'อธิบาย Frontend, Backend, Data, Auth, Hosting และ dependency สำคัญ โดยไม่ใส่ Secret', en: 'Describe frontend, backend, data, auth, hosting, and key dependencies. Never include secrets.' } },
          { key: 'buildSequence', required, minLength: 60, rows: 7, label: { th: 'ลำดับการสร้างและตรวจสอบ', en: 'Build and verification sequence' }, question: { th: 'จะสร้างอะไรตามลำดับ และแต่ละช่วงพิสูจน์ Acceptance criteria ข้อใด?', en: 'What will be built in sequence, and which acceptance criteria will each stage prove?' }, placeholder: { th: 'MILESTONE 1 → สิ่งที่สร้าง → วิธีตรวจ\nMILESTONE 2 → …', en: 'MILESTONE 1 → build → verification\nMILESTONE 2 → …' } },
        ],
      },
      {
        title: { th: 'ความสอดคล้องกับ PRD', en: 'PRD traceability' },
        description: { th: 'บันทึกว่า Build อ้างอิง Requirement ใด และมีจุดใดต้องย้อนกลับไปตัดสินใจแทนการแก้ใน Code', en: 'Record which requirements the build implements and which issues require a product decision rather than a code-only fix.' },
        fields: [
          { key: 'requirementTraceability', required, minLength: 50, rows: 7, label: { th: 'Requirement ที่สร้างและวิธีตรวจ', en: 'Implemented requirements and checks' }, question: { th: 'Requirement สำคัญแต่ละข้ออยู่ตรงไหนใน Build และตรวจว่าใช้งานได้อย่างไร?', en: 'Where does each important requirement appear in the build, and how was it verified?' }, placeholder: { th: 'FR-01 → หน้าหรือ Flow → วิธีตรวจ → ผล', en: 'FR-01 → screen or flow → verification → result.' } },
          { key: 'implementationChanges', required, minLength: 20, rows: 5, label: { th: 'ความต่างจาก PRD', en: 'Differences from the PRD' }, question: { th: 'ระหว่างสร้างมีอะไรต่างจาก PRD เพราะเหตุใด และเป็นเพียง Implementation detail หรือเปลี่ยน Product decision?', en: 'What differs from the PRD, why, and is it an implementation detail or a changed product decision?' }, placeholder: { th: 'หากไม่มีให้ระบุว่า “ไม่พบความต่างจาก PRD” พร้อมสิ่งที่ตรวจแล้ว', en: 'If none, state “No known PRD differences” and what was checked.' } },
        ],
      },
      {
        title: { th: 'หลักฐานของ Working Build', en: 'Working-build evidence' },
        description: { th: 'ใช้ URL และผลการตรวจจริง ไม่ใช้ความรู้สึกว่า “น่าจะทำงานได้”', en: 'Use a real URL and observed test results, not a belief that the product should work.' },
        fields: [
          { key: 'appUrl', required, minLength: 10, rows: 2, label: { th: 'Public URL ของ Build', en: 'Public build URL' }, question: { th: 'ผู้ทดสอบจะเปิด Product เวอร์ชันนี้จาก URL ใด?', en: 'Which URL can testers use to open this version of the product?' }, placeholder: { th: 'https://… (ห้ามใส่ Token, API Key หรือ Private repository URL)', en: 'https://… (never include tokens, API keys, or private repository URLs)' } },
          { key: 'testEvidence', required, minLength: 60, rows: 7, label: { th: 'ผลการทดสอบเส้นทางหลัก', en: 'Primary-journey test evidence' }, question: { th: 'ทดสอบเส้นทางหลัก อุปกรณ์ ข้อมูล และกรณีผิดพลาดใดแล้ว ผลเป็นอย่างไร?', en: 'Which primary journeys, devices, data conditions, and failure cases were tested, and what happened?' }, placeholder: { th: 'TEST / สภาพแวดล้อม / ผลที่คาด / ผลจริง / PASS หรือ ISSUE', en: 'TEST / environment / expected / observed / PASS or ISSUE.' } },
          { key: 'knownLimitations', required, minLength: 20, rows: 5, label: { th: 'ข้อจำกัดและ Known issue', en: 'Limitations and known issues' }, question: { th: 'อะไรยังไม่สมบูรณ์ ยังไม่รองรับ หรือควรระวังในการทดสอบ?', en: 'What remains incomplete, unsupported, or important for testers to know?' }, placeholder: { th: 'หากไม่มีให้ระบุสิ่งที่ตรวจแล้วและเหตุผลที่มั่นใจ', en: 'If none are known, state what was checked and why that conclusion is reasonable.' } },
        ],
      },
    ],
  },
  G: {
    phase: 'G',
    name: 'GATHER FEEDBACK',
    headline: { th: 'สังเกตสิ่งที่ผู้ใช้ทำจริงก่อนอธิบายแทน Product', en: 'Observe what users actually do before explaining the product for them' },
    principle: { th: 'Feedback ที่มีคุณค่าแยกสิ่งที่คาด สิ่งที่เกิด และการตีความออกจากกัน เพื่อไม่ให้ความเห็นหนึ่งกลายเป็นข้อสรุปเร็วเกินไป', en: 'Useful feedback separates expectations, observations, and interpretations so one opinion does not become a premature conclusion.' },
    outcome: { th: 'ได้หลักฐานการใช้งานจริง จุดติดขัด สิ่งที่ทำงานได้ และ Learning สำคัญที่สุดสำหรับการตัดสินใจรอบต่อไป', en: 'Observed usage evidence, friction, strengths, and the most important learning for the next decision.' },
    sections: [
      {
        title: { th: 'ออกแบบการทดสอบ', en: 'Test design' },
        description: { th: 'กำหนดผู้ทดสอบ สถานการณ์ และสัญญาณก่อนเห็นผล เพื่อลดการเลือกหลักฐานเข้าข้างตนเอง', en: 'Define participants, scenarios, and signals before seeing results to reduce confirmation bias.' },
        fields: [
          { key: 'testParticipants', required, minLength: 30, rows: 4, label: { th: 'ผู้ทดสอบและเหตุผลที่เลือก', en: 'Participants and selection rationale' }, question: { th: 'ใครเป็นผู้ทดสอบ พวกเขาใกล้เคียง Target user อย่างไร และมีข้อจำกัดใด?', en: 'Who tested, how do they resemble the target users, and what limitations apply?' }, placeholder: { th: 'จำนวน / ลักษณะ / ความเกี่ยวข้อง / ข้อจำกัดของ sample', en: 'Count / characteristics / relevance / sample limitations.' } },
          { key: 'testScenario', required, minLength: 50, rows: 6, label: { th: 'สถานการณ์และงานที่ให้ทำ', en: 'Scenario and task' }, question: { th: 'ผู้ทดสอบได้รับสถานการณ์และเป้าหมายอะไร โดยไม่ถูกบอกวิธีใช้?', en: 'What situation and goal did testers receive without being coached through the interface?' }, placeholder: { th: 'CONTEXT → TASK → จุดที่หยุดช่วย → เวลาหรือเงื่อนไข', en: 'CONTEXT → TASK → no-help boundary → time or conditions.' } },
          { key: 'successSignals', required, minLength: 30, rows: 5, label: { th: 'สัญญาณที่ใช้ประเมิน', en: 'Evaluation signals' }, question: { th: 'จะดูพฤติกรรมหรือผลลัพธ์ใดเพื่อบอกว่า Journey สำเร็จ ติดขัด หรือไม่สร้างคุณค่า?', en: 'Which behaviors or outcomes indicate success, friction, or missing value?' }, placeholder: { th: 'เช่น ทำงานสำเร็จโดยไม่ถาม, เวลา, error, การย้อนกลับ, คำพูดหลังใช้', en: 'Examples: unassisted completion, time, errors, backtracking, and post-use comments.' } },
        ],
      },
      {
        title: { th: 'สิ่งที่เกิดขึ้นจริง', en: 'What actually happened' },
        description: { th: 'บันทึก observation ก่อนสรุปเหตุผลหรือเสนอวิธีแก้', en: 'Capture observations before explaining causes or proposing fixes.' },
        fields: [
          { key: 'expectedBehavior', required, minLength: 30, rows: 4, label: { th: 'สิ่งที่คาดว่าจะเกิด', en: 'Expected behavior' }, question: { th: 'ก่อนทดสอบ คุณคาดว่าผู้ใช้จะทำอะไรและเข้าใจอะไร?', en: 'Before the test, what did you expect users to do and understand?' }, placeholder: { th: 'ระบุพฤติกรรมที่คาดโดยไม่แก้คำตอบย้อนหลัง', en: 'State the expectation without rewriting it after seeing the result.' } },
          { key: 'observedBehavior', required, minLength: 50, rows: 7, label: { th: 'สิ่งที่สังเกตได้', en: 'Observed behavior' }, question: { th: 'ผู้ใช้ทำอะไรตามลำดับ พูดอะไร ถอยกลับหรือหยุดตรงไหน?', en: 'What did users do in sequence, say aloud, revisit, or stop at?' }, placeholder: { th: 'เวลา/เหตุการณ์ → สิ่งที่ผู้ใช้ทำหรือพูด → ผลที่เกิด', en: 'Moment/event → observed action or quote → result.' } },
          { key: 'frictionAndFailures', required, minLength: 30, rows: 5, label: { th: 'จุดติดขัดและความล้มเหลว', en: 'Friction and failures' }, question: { th: 'จุดใดทำให้ช้า สับสน ผิดพลาด หยุด หรือขอความช่วยเหลือ?', en: 'Where did users slow down, become confused, make errors, stop, or ask for help?' }, placeholder: { th: 'จุด / หลักฐาน / ผลกระทบ / จำนวนครั้งที่พบ', en: 'Moment / evidence / impact / frequency.' } },
          { key: 'workedWell', required, minLength: 30, rows: 5, label: { th: 'สิ่งที่ทำงานได้ดี', en: 'What worked well' }, question: { th: 'ส่วนใดผู้ใช้เข้าใจ ใช้งานสำเร็จ หรือได้รับคุณค่าโดยไม่ต้องอธิบาย?', en: 'What did users understand, complete, or value without explanation?' }, placeholder: { th: 'ระบุพฤติกรรมหรือผลลัพธ์ ไม่ใช้เพียงคำว่า “ชอบ”', en: 'Record behavior or outcomes, not only that someone “liked it”.' } },
        ],
      },
      {
        title: { th: 'สังเคราะห์อย่างระมัดระวัง', en: 'Careful synthesis' },
        description: { th: 'เปลี่ยน observation เป็น Learning โดยยังรักษาความไม่แน่นอนและข้อจำกัดของหลักฐาน', en: 'Turn observations into learning while preserving uncertainty and evidence limitations.' },
        fields: [
          { key: 'feedbackEvidence', required, minLength: 40, rows: 6, label: { th: 'หลักฐานที่สนับสนุน Learning', en: 'Evidence supporting the learning' }, question: { th: 'ข้อความ เหตุการณ์ ตัวเลข หรือ pattern ใดสนับสนุนข้อสรุปนี้?', en: 'Which quotes, events, measures, or patterns support the interpretation?' }, placeholder: { th: 'EVIDENCE → สิ่งที่บอกได้ → สิ่งที่ยังบอกไม่ได้', en: 'EVIDENCE → what it supports → what it does not prove.' } },
          { key: 'mostImportantLearning', required, minLength: 40, rows: 6, label: { th: 'Learning สำคัญที่สุด', en: 'Most important learning' }, question: { th: 'หากเก็บ Learning ได้เพียงหนึ่งเรื่อง อะไรมีผลต่อ Goal หรือความเสี่ยงมากที่สุด?', en: 'If only one learning is retained, which most affects the goal or major risk?' }, placeholder: { th: 'เราเรียนรู้ว่า… เพราะ… และสิ่งนี้มีผลต่อ…', en: 'We learned that… because… and this affects…' } },
          { key: 'confidenceAndLimits', required, minLength: 30, rows: 4, label: { th: 'ระดับความมั่นใจและข้อจำกัด', en: 'Confidence and limitations' }, question: { th: 'มั่นใจเพียงใด เพราะอะไร และต้องเก็บหลักฐานอะไรเพิ่ม?', en: 'How confident is this learning, why, and what further evidence is needed?' }, placeholder: { th: 'CONFIDENCE: ต่ำ/กลาง/สูง → เหตุผล → หลักฐานที่ยังขาด', en: 'CONFIDENCE: low/medium/high → rationale → missing evidence.' } },
        ],
      },
    ],
  },
  N: {
    phase: 'N',
    name: 'NEXT ITERATION',
    headline: { th: 'เลือกหนึ่งการเปลี่ยนแปลงที่เรียนรู้ได้มากที่สุดในรอบถัดไป', en: 'Choose the next change that creates the most useful learning' },
    principle: { th: 'Next Iteration ไม่ใช่รายการทุกอย่างที่อยากแก้ แต่คือคำตัดสินที่เชื่อม Learning กับผลลัพธ์และสัญญาณตรวจสอบได้', en: 'The next iteration is not a backlog of everything to fix; it is a decision linking learning to an outcome and a verifiable signal.' },
    outcome: { th: 'ได้ Iteration brief หนึ่งเรื่องที่มีเหตุผล ขอบเขต Owner Timebox และเกณฑ์พิสูจน์ โดยรักษาคำตัดสินที่ยังถูกต้องไว้', en: 'One iteration brief with rationale, scope, owner, timebox, and proof criteria while preserving decisions that remain valid.' },
    sections: [
      {
        title: { th: 'จัดลำดับการเปลี่ยนแปลง', en: 'Prioritize the change' },
        description: { th: 'พิจารณาผลต่อ Goal ความเสี่ยง ความถี่ และการเรียนรู้ ก่อนเลือกจากความง่ายในการทำ', en: 'Consider goal impact, risk, frequency, and learning before choosing what is easiest to build.' },
        fields: [
          { key: 'candidateChanges', required, minLength: 60, rows: 7, label: { th: 'การเปลี่ยนแปลงที่เป็นไปได้', en: 'Candidate changes' }, question: { th: 'จาก Feedback มีทางเลือกปรับอะไรบ้าง และแต่ละทางเลือกตอบ Learning ใด?', en: 'Which changes could respond to the feedback, and which learning does each address?' }, placeholder: { th: 'OPTION A → Learning → ผลต่อ Goal → ต้นทุน/ความเสี่ยง\nOPTION B → …', en: 'OPTION A → learning → goal impact → cost/risk\nOPTION B → …' } },
          { key: 'selectedChange', required, minLength: 30, rows: 5, label: { th: 'การเปลี่ยนแปลงที่เลือก', en: 'Selected change' }, question: { th: 'รอบถัดไปจะเปลี่ยนอะไรเพียงหนึ่งเรื่อง และอะไรไม่อยู่ในรอบนี้?', en: 'What single change will this iteration make, and what remains outside this iteration?' }, placeholder: { th: 'CHANGE: …\nNOT IN THIS ITERATION: …', en: 'CHANGE: …\nNOT IN THIS ITERATION: …' } },
          { key: 'selectionRationale', required, minLength: 40, rows: 5, label: { th: 'เหตุผลที่เลือก', en: 'Selection rationale' }, question: { th: 'เหตุใดเรื่องนี้สำคัญกว่าทางเลือกอื่น และอ้างอิงหลักฐานใด?', en: 'Why is this more important than the alternatives, and which evidence supports it?' }, placeholder: { th: 'เชื่อม Feedback → Risk/Goal → Trade-off ที่ยอมรับ', en: 'Connect feedback → risk/goal → accepted trade-off.' } },
        ],
      },
      {
        title: { th: 'กำหนดผลลัพธ์และการพิสูจน์', en: 'Define outcome and proof' },
        description: { th: 'ทำให้ทีมรู้ว่าเมื่อใดควรหยุด สังเกตผล และตัดสินใจต่อ', en: 'Make it clear when to stop, observe results, and make the next decision.' },
        fields: [
          { key: 'expectedResult', required, minLength: 30, rows: 5, label: { th: 'ผลลัพธ์ที่คาดหวัง', en: 'Expected result' }, question: { th: 'หลังเปลี่ยนแล้ว ผู้ใช้หรือระบบควรทำอะไรได้ดีขึ้นอย่างสังเกตได้?', en: 'What observable user or system outcome should improve after the change?' }, placeholder: { th: 'ผู้ใช้จะ… จากเดิม… เป็น…', en: 'Users will… changing from… to…' } },
          { key: 'validationSignal', required, minLength: 30, rows: 5, label: { th: 'สัญญาณยืนยันหรือหักล้าง', en: 'Confirming or disconfirming signal' }, question: { th: 'หลักฐานใดจะทำให้เดินหน้า หยุด หรือเลือกทางใหม่?', en: 'Which evidence will support continuing, stopping, or choosing another direction?' }, placeholder: { th: 'CONTINUE IF…\nRECONSIDER IF…\nSTOP IF…', en: 'CONTINUE IF…\nRECONSIDER IF…\nSTOP IF…' } },
          { key: 'timeboxOwner', required, minLength: 20, rows: 4, label: { th: 'Owner และ Timebox', en: 'Owner and timebox' }, question: { th: 'ใครรับผิดชอบ จะจบเมื่อใด และมี dependency สำคัญอะไร?', en: 'Who owns this iteration, when will it end, and what dependencies matter?' }, placeholder: { th: 'OWNER / START / REVIEW DATE / DEPENDENCIES', en: 'OWNER / START / REVIEW DATE / DEPENDENCIES.' } },
        ],
      },
      {
        title: { th: 'รักษาความต่อเนื่องของ Decision', en: 'Preserve decision continuity' },
        description: { th: 'แยกสิ่งที่ยังถูกต้องออกจากสิ่งที่ต้องเปิด Revision เพื่อไม่ให้การแก้หนึ่งเรื่องทำให้ Scope ไหล', en: 'Separate decisions that remain valid from those requiring revision so one change does not create silent scope drift.' },
        fields: [
          { key: 'decisionsToKeep', required, minLength: 30, rows: 5, label: { th: 'คำตัดสินที่ยังคงเดิม', en: 'Decisions that remain locked' }, question: { th: 'Context, Direction, Scope, Requirement หรือ Non-goal ใดยังถูกต้องและห้ามเปลี่ยนในรอบนี้?', en: 'Which context, direction, scope, requirements, or non-goals remain valid and must not change in this iteration?' }, placeholder: { th: 'KEEP: Step/Decision → เหตุผลที่ยังคงเดิม', en: 'KEEP: step/decision → why it remains valid.' } },
          { key: 'decisionsToRevisit', minLength: 0, rows: 5, label: { th: 'คำตัดสินที่ต้องเปิดทบทวน', en: 'Decisions to revisit' }, question: { th: 'Learning นี้บังคับให้ย้อนกลับไปทบทวน Step ใดหรือไม่?', en: 'Does this learning require reopening an earlier step?' }, placeholder: { th: 'หากมี: STEP → Decision → หลักฐาน\nหากไม่มี: ระบุว่าเป็น Implementation iteration เท่านั้น', en: 'If yes: STEP → decision → evidence\nIf no: state that this is an implementation-only iteration.' } },
          { key: 'nextIterationBrief', required, minLength: 80, rows: 9, label: { th: 'Next Iteration brief', en: 'Next iteration brief' }, question: { th: 'ทีมสามารถอ่านสรุปนี้แล้วลงมือสร้าง ทดสอบ และกลับมาตัดสินใจได้โดยไม่เดาเพิ่มหรือไม่?', en: 'Can the team use this brief to build, test, and return for a decision without inventing missing scope?' }, placeholder: { th: '# NEXT ITERATION\n## Learning\n## Change\n## Non-goals\n## Expected result\n## Validation\n## Owner & timebox', en: '# NEXT ITERATION\n## Learning\n## Change\n## Non-goals\n## Expected result\n## Validation\n## Owner & timebox' } },
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
