import { describe, it, expect } from 'vitest'
import { parseFaq } from './faqContent'

describe('parseFaq', () => {
  it('reads a question mark as a question and what follows as its answer', () => {
    expect(parseFaq('What should I wear?\nComfortable shoes and a band shirt.')).toEqual([
      { kind: 'question', text: 'What should I wear?' },
      { kind: 'answer', text: 'Comfortable shoes and a band shirt.' },
    ])
  })

  it('takes Q: and A: markers off the front', () => {
    expect(parseFaq('Q: Can I bring my child\nA: Yes, as long as they stay with you.')).toEqual([
      { kind: 'question', text: 'Can I bring my child' },
      { kind: 'answer', text: 'Yes, as long as they stay with you.' },
    ])
  })

  // A marker is taken at its word — somebody who typed Q: meant it, question
  // mark or not — and so are Q. and Q) which is how people actually type lists.
  it('accepts the punctuation people really use after the marker', () => {
    for (const marker of ['Q:', 'Q.', 'Q)', 'q:', 'Q -']) {
      expect(parseFaq(`${marker} Where do we meet`)[0]).toEqual({
        kind: 'question', text: 'Where do we meet',
      })
    }
  })

  // The whole reason for the length test: a sentence that happens to end in a
  // question mark is not a heading, and promoting it would split an answer in
  // half at the wrong place.
  it('leaves a long sentence ending in a question mark inside the answer', () => {
    const long = 'If something comes up and you cannot make the shift you signed up for, could you please let the fundraising team know before Friday so we have time to find somebody else?'
    expect(long.length).toBeGreaterThan(140)
    expect(parseFaq(long)).toEqual([{ kind: 'answer', text: long }])
  })

  it('turns a run of bullets into a list', () => {
    const faq = 'What should I bring?\n- Water bottle\n- Band shirt\n- A smile'
    expect(parseFaq(faq)).toEqual([
      { kind: 'question', text: 'What should I bring?' },
      { kind: 'list', items: ['Water bottle', 'Band shirt', 'A smile'] },
    ])
  })

  it('takes the other bullet characters people type', () => {
    expect(parseFaq('* Star\n\u2022 Dot\n- Dash')).toEqual([
      { kind: 'list', items: ['Star', 'Dot', 'Dash'] },
    ])
  })

  // The space after the mark is what stops a hyphenated word or a minus sign
  // at the start of a line from being read as a bullet.
  it('needs a space after the bullet mark', () => {
    expect(parseFaq('-5 degrees is too cold')).toEqual([
      { kind: 'answer', text: '-5 degrees is too cold' },
    ])
  })

  // This is the shape the live event actually uses: no questions anywhere,
  // just three things somebody needs to know.
  it('reads a bare list with no question above it', () => {
    const faq = [
      '- Students can take orders, adults handle the cash.',
      '- Let Angela know if you cannot make your shift.',
      '- We keep 50% of sales.',
    ].join('\n')
    expect(parseFaq(faq)).toEqual([
      {
        kind: 'list',
        items: [
          'Students can take orders, adults handle the cash.',
          'Let Angela know if you cannot make your shift.',
          'We keep 50% of sales.',
        ],
      },
    ])
  })

  it('keeps prose and a list apart when they run together', () => {
    expect(parseFaq('Please read these.\n- One\n- Two\nThanks.')).toEqual([
      { kind: 'answer', text: 'Please read these.' },
      { kind: 'list', items: ['One', 'Two'] },
      { kind: 'answer', text: 'Thanks.' },
    ])
  })

  it('keeps the line breaks inside one answer', () => {
    expect(parseFaq('Where do we meet?\nBand room.\nSide door.')).toEqual([
      { kind: 'question', text: 'Where do we meet?' },
      { kind: 'answer', text: 'Band room.\nSide door.' },
    ])
  })

  it('ends an answer at a blank line so paragraphs stay apart', () => {
    expect(parseFaq('First paragraph.\n\nSecond paragraph.')).toEqual([
      { kind: 'answer', text: 'First paragraph.' },
      { kind: 'answer', text: 'Second paragraph.' },
    ])
  })

  it('reads several questions in a row with no blank lines between them', () => {
    const faq = 'Where do we meet?\nAt the band room.\nWhat time?\nTen minutes before your shift.'
    expect(parseFaq(faq)).toEqual([
      { kind: 'question', text: 'Where do we meet?' },
      { kind: 'answer', text: 'At the band room.' },
      { kind: 'question', text: 'What time?' },
      { kind: 'answer', text: 'Ten minutes before your shift.' },
    ])
  })

  // Text that follows none of the patterns still has to come out whole: this
  // is one free-text box and most of what goes in it is just prose.
  it('renders ordinary prose as readable paragraphs rather than dropping it', () => {
    expect(parseFaq('Thanks for volunteering.\n\nPark in the north lot.')).toEqual([
      { kind: 'answer', text: 'Thanks for volunteering.' },
      { kind: 'answer', text: 'Park in the north lot.' },
    ])
  })

  it('has nothing to say about nothing', () => {
    expect(parseFaq('')).toEqual([])
    expect(parseFaq('   \n\n  ')).toEqual([])
    expect(parseFaq(null)).toEqual([])
    expect(parseFaq(undefined)).toEqual([])
  })

  it('survives Windows line endings', () => {
    expect(parseFaq('What time?\r\nNoon.')).toEqual([
      { kind: 'question', text: 'What time?' },
      { kind: 'answer', text: 'Noon.' },
    ])
  })
})
