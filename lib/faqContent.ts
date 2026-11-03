/**
 * An event's FAQ is one free-text box in the admin screen, and it comes out
 * however somebody typed it. This turns it into questions and answers so the
 * page can set them apart, and it is deliberately forgiving: text that follows
 * none of the patterns below still renders as ordinary readable paragraphs
 * rather than disappearing.
 *
 * A line is a QUESTION when it either carries a "Q:" marker or simply ends in
 * a question mark and is short enough to be a heading rather than a sentence
 * inside an answer. The length test is what stops "...so can you let us know
 * by Friday?" at the end of a paragraph from being promoted to a heading.
 */

/** Past this many characters a line ending in "?" is a sentence, not a heading. */
const QUESTION_MAX_LENGTH = 140

export type FaqBlock =
  | { kind: 'question'; text: string }
  | { kind: 'answer'; text: string }
  | { kind: 'list'; items: string[] }

/** Strips a leading Q:, Q., Q) or A:, A., A) marker. Returns null if absent. */
function stripMarker(line: string, letter: 'Q' | 'A'): string | null {
  const match = new RegExp(`^${letter}\\s*[:.)-]\\s*(.*)$`, 'i').exec(line)
  return match ? match[1].trim() : null
}

function readQuestion(line: string): string | null {
  const marked = stripMarker(line, 'Q')
  // An explicit marker is taken at its word: somebody who typed "Q:" meant it,
  // whether or not they remembered the question mark.
  if (marked !== null) return marked || null
  if (line.endsWith('?') && line.length <= QUESTION_MAX_LENGTH) return line
  return null
}

/** A "- ", "* " or "• " line. The space matters: it keeps a hyphenated word
 *  or a negative number from being read as a bullet. */
function readBullet(line: string): string | null {
  const match = /^[-*\u2022]\s+(.*)$/.exec(line)
  return match && match[1].trim() ? match[1].trim() : null
}

/**
 * Questions, answers and lists, in the order they were written.
 *
 * A blank line ends whatever was being collected, so paragraphs stay apart.
 * Lines inside one answer keep their own breaks. Runs of bullets become one
 * list — which is what most of these boxes actually contain: not questions at
 * all but a handful of things somebody needs to know before their shift.
 */
export function parseFaq(content: string | null | undefined): FaqBlock[] {
  if (typeof content !== 'string') return []

  const blocks: FaqBlock[] = []
  let answer: string[] = []
  let items: string[] = []

  const flushAnswer = () => {
    const text = answer.join('\n').trim()
    if (text) blocks.push({ kind: 'answer', text })
    answer = []
  }
  const flushList = () => {
    if (items.length) blocks.push({ kind: 'list', items })
    items = []
  }
  const flushAll = () => {
    // Order matters only in that one of the two is always empty: a bullet
    // flushes the answer before joining the list, and prose flushes the list.
    flushAnswer()
    flushList()
  }

  for (const raw of content.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim()

    if (!line) {
      flushAll()
      continue
    }

    const question = readQuestion(line)
    if (question) {
      flushAll()
      blocks.push({ kind: 'question', text: question })
      continue
    }

    const bullet = readBullet(line)
    if (bullet) {
      flushAnswer()
      items.push(bullet)
      continue
    }

    flushList()
    const answered = stripMarker(line, 'A')
    answer.push(answered !== null ? answered : line)
  }

  flushAll()
  return blocks
}
