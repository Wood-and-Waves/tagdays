import { parseFaq } from '@/lib/faqContent'

/**
 * The FAQ, open on the event page itself.
 *
 * It used to be a page of its own behind a small "FAQ" link in the header, so
 * somebody had to go looking for it to find out they had a question answered.
 * It sits BELOW the schedule rather than above it: the page's job is the
 * shifts, and a few hundred words of FAQ in front of them would push every
 * slot off a phone screen. Reading down the list is how people use this page,
 * so the foot of it is where they already end up.
 */
export default function EventFAQ({ content }: { content: string | null }) {
  const blocks = parseFaq(content)
  if (blocks.length === 0) return null

  return (
    // scroll-mt keeps the heading off the very top edge when the header link
    // jumps here.
    <section id="faq" className="mt-10 scroll-mt-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="font-bold text-lg text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        {blocks.map((block, i) => {
          if (block.kind === 'question') {
            return (
              <h3 key={i} className="font-semibold text-gray-900 mt-7 first:mt-0">
                {block.text}
              </h3>
            )
          }
          if (block.kind === 'list') {
            return (
              <ul key={i} className="mt-2 first:mt-0 pl-5 list-disc marker:text-gray-400 space-y-2">
                {block.items.map((item, j) => (
                  <li key={j} className="text-gray-700 leading-relaxed pl-1">
                    {item}
                  </li>
                ))}
              </ul>
            )
          }
          return (
            // whitespace-pre-line so breaks somebody typed inside one answer survive.
            <p key={i} className="text-gray-700 leading-relaxed whitespace-pre-line mt-2 first:mt-0">
              {block.text}
            </p>
          )
        })}
      </div>
    </section>
  )
}
