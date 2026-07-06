import Link from 'next/link'

interface SiteHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  rightLinkHref?: string
  rightLinkLabel?: string
}

export default function SiteHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  rightLinkHref,
  rightLinkLabel,
}: SiteHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 py-5 px-4">
      <div className="max-w-5xl mx-auto">
        {backHref && (
          <Link
            href={backHref}
            className="text-brand-700 text-sm font-semibold hover:text-brand-800 transition mb-3 inline-block"
          >
            ← {backLabel}
          </Link>
        )}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="w-11 h-11 shrink-0" />
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
              {subtitle && <p className="text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {rightLinkHref && rightLinkLabel && (
            <Link
              href={rightLinkHref}
              className="text-sm font-semibold text-brand-700 hover:text-brand-800 underline shrink-0 mt-2"
            >
              {rightLinkLabel}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
