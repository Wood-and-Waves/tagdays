'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const TEMPLATE = `location_name,address,notes,date,start_time,end_time,max_students,max_parents
Jewel - East Door,11500 Haligus Rd Huntley IL,,2026-07-10,08:00,18:00,3,1
Jewel - West Door,11500 Haligus Rd Huntley IL,,2026-07-10,08:00,18:00,3,1
Culvers,12160 Ridgefield Pkwy Huntley IL,Cover both entrance and drive-thru,2026-07-11,10:00,16:00,2,1`

export default function ImportClient({ existingLocationNames }: { existingLocationNames: string[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const delimiter = lines[0].includes('\t') ? '\t' : ','
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))
      const row: any = {}
      headers.forEach((h, i) => { row[h] = values[i] || '' })
      return row
    })
  }

  const generatePreview = async () => {
    setError(null)
    setResult(null)
    setLoading(true)

    const rows = parseCSV(csvText)
    if (rows.length === 0) {
      setError('No valid rows found. Make sure your CSV includes a header row.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/admin/import/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Preview failed.')
      setLoading(false)
      return
    }

    setParsedRows(rows)
    setPreview(data.locationSummary)
    setPreviewing(true)
    setLoading(false)
  }

  const handleImport = async () => {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: parsedRows }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Import failed.')
      setLoading(false)
      return
    }

    setResult(data)
    setPreview(null)
    setPreviewing(false)
    setCsvText('')
    router.refresh()
    setLoading(false)
  }

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tagdays-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetPreview = () => {
    setPreviewing(false)
    setPreview(null)
    setError(null)
  }

  const totalNew = preview ? Object.values(preview).reduce((acc: number, loc: any) => acc + loc.newSlots.length, 0) : 0
  const totalExisting = preview ? Object.values(preview).reduce((acc: number, loc: any) => acc + loc.existingSlots.length, 0) : 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50 transition"
      >
        <div>
          <p className="font-bold text-gray-900">Import from CSV</p>
          <p className="text-sm text-gray-500">Bulk create locations and slots from a spreadsheet</p>
        </div>
        <span className="text-gray-400 text-xl">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-4 text-sm">
              <p className="font-semibold mb-1">Import complete!</p>
              <p>Locations added: {result.locationsAdded}</p>
              <p>Slots created: {result.slotsCreated}</p>
              <p>Slots skipped (already exist): {result.skipped}</p>
            </div>
          )}

          {previewing && preview ? (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-yellow-800 mb-1">Preview — review before importing</p>
                <p className="text-sm text-yellow-700 mb-3">
                  {totalNew} new slots to create · {totalExisting} already exist (will be skipped)
                </p>
                <div className="space-y-2">
                  {Object.entries(preview).map(([name, info]: [string, any]) => (
                    <div key={name} className="bg-white border border-yellow-100 rounded p-3 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{name}</p>
                        {info.isNew ? (
                          <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            New Location
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Existing
                          </span>
                        )}
                      </div>
                      {info.address && <p className="text-gray-500 text-xs">{info.address}</p>}
                      {info.notes && <p className="text-yellow-600 text-xs">{info.notes}</p>}
                      <p className="text-green-700 text-xs mt-1">
                        {info.newSlots.length} new slots to create
                      </p>
                      {info.existingSlots.length > 0 && (
                        <p className="text-gray-400 text-xs">
                          {info.existingSlots.length} slots already exist (will skip): {info.existingSlots.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={loading || totalNew === 0}
                  className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? 'Importing...' : `Confirm — Create ${totalNew} Slots`}
                </button>
                <button
                  onClick={resetPreview}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
                >
                  Back — Fix CSV
                </button>
              </div>
              {totalNew === 0 && (
                <p className="text-sm text-gray-500 mt-2">All slots already exist — nothing to import.</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-3">
                Works with comma or tab-separated values. Compatible with Excel, Numbers, and Google Sheets.
                Each row creates a location (if new) and generates 2-hour slots between start and end time.
              </p>
              <button
                onClick={downloadTemplate}
                className="mb-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition text-sm font-semibold"
              >
                Download Template
              </button>
              <textarea
                value={csvText}
                onChange={e => { setCsvText(e.target.value); setResult(null) }}
                placeholder="Paste CSV or spreadsheet data here..."
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              />
              <button
                onClick={generatePreview}
                disabled={!csvText.trim() || loading}
                className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Preview Import'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
