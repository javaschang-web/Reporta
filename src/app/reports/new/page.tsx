'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase/client'

type DataSource = {
  id: number
  name: string
  file_type: string
  file_url: string
  created_at: string
}

export default function NewReportPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [sources, setSources] = useState<DataSource[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})

  const [title, setTitle] = useState('Monthly Report')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/auth/login')
        return
      }
      setUserId(data.user.id)

      const { data: rows, error } = await supabase
        .from('data_sources')
        .select('id,name,file_type,file_url,created_at')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        return
      }
      setSources((rows ?? []) as DataSource[])
    }

    init()
  }, [router])

  const selectedIds = useMemo(
    () => sources.filter((s) => selected[s.id]).map((s) => s.id),
    [sources, selected]
  )

  const toggle = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const downloadExcel = (wb: XLSX.WorkBook, filename: string) => {
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    const blob = new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const generate = async () => {
    setError(null)
    setStatus(null)

    if (!userId) return
    if (selectedIds.length === 0) {
      setError('Select at least one data source.')
      return
    }

    setLoading(true)
    setStatus('Fetching selected files…')

    try {
      // 1) Fetch each selected file and parse first sheet (basic MVP)
      const parsed: { source: DataSource; rows: any[] }[] = []

      for (const id of selectedIds) {
        const src = sources.find((s) => s.id === id)!
        setStatus(`Fetching: ${src.name}`)

        const res = await fetch(src.file_url)
        if (!res.ok) throw new Error(`Failed to fetch ${src.name}`)

        const buf = await res.arrayBuffer()

        if (src.file_type === 'csv') {
          const text = new TextDecoder().decode(new Uint8Array(buf))
          const wb = XLSX.read(text, { type: 'string' })
          const sheetName = wb.SheetNames[0]
          const ws = wb.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[]
          parsed.push({ source: src, rows })
        } else {
          const wb = XLSX.read(buf, { type: 'array' })
          const sheetName = wb.SheetNames[0]
          const ws = wb.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[]
          parsed.push({ source: src, rows })
        }
      }

      // 2) Build a workbook: Summary + one sheet per data source
      setStatus('Building report…')
      const wb = XLSX.utils.book_new()

      const summaryRows = parsed.map((p) => ({
        Source: p.source.name,
        Type: p.source.file_type,
        Rows: p.rows.length,
        CreatedAt: p.source.created_at,
      }))
      const summaryWs = XLSX.utils.json_to_sheet(summaryRows)
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

      for (const p of parsed) {
        const ws = XLSX.utils.json_to_sheet(p.rows.slice(0, 5000))
        // Sheet names max 31 chars
        const sheetName = p.source.name.replace(/\.[^/.]+$/, '').slice(0, 31) || 'Data'
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }

      // 3) Store a reports row
      setStatus('Saving report metadata…')
      const { data: reportRow, error: insertError } = await supabase
        .from('reports')
        .insert({ user_id: userId, title, format: 'excel', status: 'generated' })
        .select('id')
        .single()

      if (insertError) throw insertError

      setStatus('Downloading…')
      downloadExcel(wb, `${title.replace(/\s+/g, '_')}.xlsx`)

      setStatus('Done ✅')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Generate report (Excel)</h1>
            <p className="text-sm text-gray-600">Select uploaded sources and export a workbook.</p>
          </div>
          <Link className="border rounded px-3 py-2" href="/dashboard">
            Back
          </Link>
        </header>

        <div className="mt-8 grid gap-6">
          <section className="border rounded p-4">
            <label className="text-sm font-medium">Report title</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </section>

          <section className="border rounded p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Data sources</h2>
              <Link className="text-blue-600 underline" href="/upload">
                Upload more
              </Link>
            </div>

            {sources.length === 0 ? (
              <p className="text-sm text-gray-600 mt-3">No sources yet. Upload files first.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {sources.map((s) => (
                  <li key={s.id} className="border rounded p-3">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" checked={!!selected[s.id]} onChange={() => toggle(s.id)} />
                      <div className="flex-1">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-600">
                          {s.file_type} • {new Date(s.created_at).toLocaleString()}
                        </div>
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                className="bg-blue-600 text-white rounded px-3 py-2 disabled:opacity-50"
                onClick={generate}
                disabled={loading || sources.length === 0 || selectedIds.length === 0}
              >
                {loading ? 'Working…' : `Generate (${selectedIds.length})`}
              </button>
              <div className="text-sm text-gray-600">{status ?? ''}</div>
            </div>

            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </section>

          <section className="text-sm text-gray-600">
            <p>Output workbook contains:</p>
            <ul className="list-disc ml-5 mt-2">
              <li>Summary sheet (rows count per source)</li>
              <li>One sheet per source (up to 5000 rows each)</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
