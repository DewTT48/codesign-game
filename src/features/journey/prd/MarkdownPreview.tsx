import { Fragment, type ReactNode } from 'react'

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={key}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={key}>{part.slice(1, -1)}</code>
      }
      return <Fragment key={key}>{part}</Fragment>
    })
}

export function MarkdownPreview({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []

  for (let index = 0; index < lines.length;) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim()
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      index += 1
      blocks.push(<pre key={`code-${index}`}><code data-language={language || undefined}>{codeLines.join('\n')}</code></pre>)
      continue
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed)
    if (heading) {
      const content = renderInline(heading[2], `heading-${index}`)
      const level = heading[1].length
      if (level === 1) blocks.push(<h1 key={`heading-${index}`}>{content}</h1>)
      if (level === 2) blocks.push(<h2 key={`heading-${index}`}>{content}</h2>)
      if (level === 3) blocks.push(<h3 key={`heading-${index}`}>{content}</h3>)
      if (level === 4) blocks.push(<h4 key={`heading-${index}`}>{content}</h4>)
      index += 1
      continue
    }

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push(<hr key={`rule-${index}`} />)
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: ReactNode[] = []
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        const item = lines[index].replace(/^\s*[-*]\s+/, '')
        items.push(<li key={`unordered-${index}`}>{renderInline(item, `unordered-${index}`)}</li>)
        index += 1
      }
      blocks.push(<ul key={`unordered-list-${index}`}>{items}</ul>)
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: ReactNode[] = []
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        const item = lines[index].replace(/^\s*\d+\.\s+/, '')
        items.push(<li key={`ordered-${index}`}>{renderInline(item, `ordered-${index}`)}</li>)
        index += 1
      }
      blocks.push(<ol key={`ordered-list-${index}`}>{items}</ol>)
      continue
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push(<blockquote key={`quote-${index}`}>{quoteLines.map((quote, quoteIndex) => <p key={`quote-line-${quoteIndex}`}>{renderInline(quote, `quote-${index}-${quoteIndex}`)}</p>)}</blockquote>)
      continue
    }

    blocks.push(<p key={`paragraph-${index}`}>{renderInline(trimmed, `paragraph-${index}`)}</p>)
    index += 1
  }

  return <article className="prd-markdown-preview">{blocks}</article>
}
