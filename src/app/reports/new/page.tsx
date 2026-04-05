'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

type DataSource = {
  id: number
  name: string
  file_type: string
  file_url: string
  created_at: string
}

const cell: React.CSSProperties = {
  padding: '9px 14px',
  fontSize: '12px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--foreground)',
  letterSpacing: '0.01em',
}

const headCell: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--muted)',
  background: 'var(--navy-800)',
  borderBottom: '1px solid var(--border)',
}

// Helper to create a styled cell
function sc(v: string | number, s: object): XLSX.CellObject {
  return { v, s, t: typeof v === 'number' ? 'n' : 's' } as XLSX.CellObject
}

const NAV_FILL = { fgColor: { rgb: '0F1A2E' } }
const NAV_800_FILL = { fgColor: { rgb: '1B2B4B' } }
const AMBER_FILL = { fgColor: { rgb: 'D4A843' } }
const ALT_FILL = { fgColor: { rgb: 'F0F4F8' } }
const WHITE_FILL = { fgColor: { rgb: 'FFFFFF' } }
const GRAY_FILL = { fgColor: { rgb: 'E2E8F0' } }

const WHITE_BOLD = { font: { bold: true, color: { rgb: 'FFFFFF' } } }
const NAVY_BOLD = { font: { bold: true, color: { rgb: '0F1A2E' } } }
const GRAY_ITALIC = { font: { italic: true, color: { rgb: '718096' } } }
const LABEL_STYLE = { font: { bold: true, color: { rgb: '4A5568' } } }
const VALUE_STYLE = { font: { color: { rgb: '1A202C' } } }

function getLogColor(line: string): string {
  const l = line.toLowerCase()
  if (l.includes('error')) return '#EF4444'
  if (l.includes('done') || l.includes('downloaded successfully')) return '#22C55E'
  if (l.includes('saving') || l.includes('metadata')) return '#94A3B8'
  if (l.includes('building') || l.includes('writing') || l.includes('downloading workbook')) return '#60A5FA'
  return '#D4A843' // fetching / initializing / parsing = amber
}

export default function NewReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const datasetId = searchParams?.get('datasetId') ?? null
  const datasetName = searchParams?.get('datasetName') ?? null

  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sources, setSources] = useState<DataSource[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [datasetRows, setDatasetRows] = useState<Record<string, unknown>[]>([])

  const [title, setTitle] = useState('Monthly Report')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/auth/login')
        return
      }
      setUserId(data.user.id)
      setEmail(data.user.email ?? null)

      if (datasetId) {
        const { data: recs, error: recErr } = await supabase
          .from('dataset_records')
          .select('data')
          .eq('dataset_id', datasetId)
          .order('recorded_at', { ascending: true })
        if (recErr) {
          setError(recErr.message)
          return
        }
        setDatasetRows(((recs ?? []) as { data: Record<string, unknown> }[]).map((r) => r.data))
      } else {
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
    }

    init()
  }, [router, datasetId])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  const selectedIds = useMemo(
    () => sources.filter((s) => selected[s.id]).map((s) => s.id),
    [sources, selected]
  )

  const toggle = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const addLog = (line: string) => {
    setLog((prev) => [...prev, `> ${line}`])
    setStatus(line)
  }

  const copyError = () => {
    if (error) navigator.clipboard.writeText(error).catch(() => {})
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

  const generateFromDataset = async () => {
    setError(null)
    setStatus(null)
    setLog([])

    if (!userId || !datasetId) return
    if (datasetRows.length === 0) {
      setError('No records found in this dataset.')
      return
    }

    setLoading(true)
    addLog('Initializing report generation…')

    try {
      addLog(`Building report from dataset: ${datasetName ?? datasetId}`)
      let wb: XLSX.WorkBook

      try {
        wb = XLSX.utils.book_new()
        const generatedDate = new Date().toLocaleString()

        // ── Cover Sheet ──
        addLog('Writing cover sheet…')
        const coverWs: XLSX.WorkSheet = {}
        coverWs['A1'] = sc('REPORTA', { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: NAV_FILL, alignment: { horizontal: 'center' } })
        coverWs['A2'] = sc('Financial Data Report', { font: { bold: true, color: { rgb: '0F1A2E' } }, fill: AMBER_FILL, alignment: { horizontal: 'center' } })
        coverWs['A4'] = sc('Report Title:', LABEL_STYLE)
        coverWs['B4'] = sc(title, VALUE_STYLE)
        coverWs['A5'] = sc('Generated:', LABEL_STYLE)
        coverWs['B5'] = sc(generatedDate, VALUE_STYLE)
        coverWs['A6'] = sc('Dataset:', LABEL_STYLE)
        coverWs['B6'] = sc(datasetName ?? datasetId!, VALUE_STYLE)
        coverWs['A7'] = sc('Total Records:', LABEL_STYLE)
        coverWs['B7'] = sc(datasetRows.length, VALUE_STYLE)
        coverWs['A9'] = sc('CONFIDENTIAL – FOR INTERNAL USE ONLY', { ...GRAY_ITALIC, fill: GRAY_FILL, alignment: { horizontal: 'center' } })
        coverWs['!ref'] = 'A1:B9'
        coverWs['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
          { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
        ]
        coverWs['!cols'] = [{ wch: 18 }, { wch: 40 }]
        XLSX.utils.book_append_sheet(wb, coverWs, 'Cover')

        // ── Data Sheet ──
        addLog(`Writing data sheet…`)
        const rows = datasetRows.slice(0, 5000)
        const ws = XLSX.utils.json_to_sheet(rows)

        const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1:A1')
        for (let col = range.s.c; col <= range.e.c; col++) {
          const addr = XLSX.utils.encode_cell({ r: 0, c: col })
          if (ws[addr]) ws[addr].s = { ...WHITE_BOLD, fill: NAV_800_FILL }
        }
        for (let row = 1; row <= range.e.r; row++) {
          const fill = row % 2 === 0 ? ALT_FILL : WHITE_FILL
          for (let col = range.s.c; col <= range.e.c; col++) {
            const addr = XLSX.utils.encode_cell({ r: row, c: col })
            if (ws[addr]) ws[addr].s = { fill }
          }
        }
        ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' }

        const sheetName = (datasetName ?? 'Data').slice(0, 31)
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      } catch (xlsxErr: any) {
        throw new Error(`Report generation failed: ${xlsxErr?.message ?? 'Unknown error'}. Your data was not lost.`)
      }

      addLog('Saving report metadata…')
      const { error: insertError } = await supabase
        .from('reports')
        .insert({ user_id: userId, title, format: 'excel', status: 'generated' })
        .select('id')
        .single()

      if (insertError) throw insertError

      addLog('Downloading workbook…')
      downloadExcel(wb, `${title.replace(/\s+/g, '_')}.xlsx`)
      addLog('Done — report downloaded successfully.')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to generate report')
      addLog(`ERROR: ${err?.message ?? 'Failed to generate report'}`)
    } finally {
      setLoading(false)
    }
  }

  const generate = async () => {
    setError(null)
    setStatus(null)
    setLog([])

    if (!userId) return
    if (selectedIds.length === 0) {
      setError('Select at least one data source.')
      return
    }

    setLoading(true)
    addLog('Initializing report generation…')

    try {
      // 1) Fetch each selected file and parse first sheet
      const parsed: { source: DataSource; rows: any[] }[] = []

      for (const id of selectedIds) {
        const src = sources.find((s) => s.id === id)!
        addLog(`Fetching: ${src.name}`)

        // Generate a short-lived signed URL from the storage path
        const { data: signedData, error: signedError } = await supabase.storage
          .from('uploads')
          .createSignedUrl(src.file_url, 60)
        if (signedError || !signedData?.signedUrl)
          throw new Error(`Failed to get signed URL for ${src.name}`)

        const res = await fetch(signedData.signedUrl)
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('Access denied - please re-upload this file')
          }
          throw new Error(`Failed to fetch ${src.name}`)
        }

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
        addLog(`Parsed ${parsed[parsed.length - 1].rows.length} records from ${src.name}`)
      }

      // 2) Build workbook
      addLog('Building report workbook…')
      let wb: XLSX.WorkBook
      try {
        wb = XLSX.utils.book_new()
        const totalRecords = parsed.reduce((sum, p) => sum + p.rows.length, 0)
        const generatedDate = new Date().toLocaleString()

        // ── Cover Sheet ──
        addLog('Writing cover sheet…')
        const coverWs: XLSX.WorkSheet = {}

        coverWs['A1'] = sc('REPORTA', { font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } }, fill: NAV_FILL, alignment: { horizontal: 'center' } })
        coverWs['A2'] = sc('Financial Data Report', { font: { bold: true, color: { rgb: '0F1A2E' } }, fill: AMBER_FILL, alignment: { horizontal: 'center' } })
        coverWs['A4'] = sc('Report Title:', LABEL_STYLE)
        coverWs['B4'] = sc(title, VALUE_STYLE)
        coverWs['A5'] = sc('Generated:', LABEL_STYLE)
        coverWs['B5'] = sc(generatedDate, VALUE_STYLE)
        coverWs['A6'] = sc('Data Sources:', LABEL_STYLE)
        coverWs['B6'] = sc(parsed.length, VALUE_STYLE)
        coverWs['A7'] = sc('Total Records:', LABEL_STYLE)
        coverWs['B7'] = sc(totalRecords, VALUE_STYLE)
        coverWs['A9'] = sc('CONFIDENTIAL – FOR INTERNAL USE ONLY', { ...GRAY_ITALIC, fill: GRAY_FILL, alignment: { horizontal: 'center' } })

        coverWs['!ref'] = 'A1:B9'
        coverWs['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // A1:B1
          { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // A2:B2
          { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } }, // A9:B9
        ]
        coverWs['!cols'] = [{ wch: 18 }, { wch: 40 }]
        XLSX.utils.book_append_sheet(wb, coverWs, 'Cover')

        // ── Executive Summary Sheet ──
        addLog('Writing executive summary…')
        const summaryWs: XLSX.WorkSheet = {}

        // Header row
        summaryWs['A1'] = sc('Source Name', { ...WHITE_BOLD, fill: NAV_800_FILL })
        summaryWs['B1'] = sc('File Type', { ...WHITE_BOLD, fill: NAV_800_FILL })
        summaryWs['C1'] = sc('Record Count', { ...WHITE_BOLD, fill: NAV_800_FILL })
        summaryWs['D1'] = sc('Uploaded At', { ...WHITE_BOLD, fill: NAV_800_FILL })

        parsed.forEach((p, i) => {
          const row = i + 2
          const fill = i % 2 === 0 ? WHITE_FILL : ALT_FILL
          summaryWs[`A${row}`] = sc(p.source.name, { fill })
          summaryWs[`B${row}`] = sc(p.source.file_type.toUpperCase(), { fill })
          summaryWs[`C${row}`] = sc(p.rows.length, { fill, alignment: { horizontal: 'right' } })
          summaryWs[`D${row}`] = sc(new Date(p.source.created_at).toLocaleString(), { fill })
        })

        // Total row
        const totalRow = parsed.length + 2
        const totalFill = { fgColor: { rgb: 'E2E8F0' } }
        summaryWs[`A${totalRow}`] = sc('TOTAL', { font: { bold: true, color: { rgb: '1A202C' } }, fill: totalFill })
        summaryWs[`B${totalRow}`] = sc('', { fill: totalFill })
        summaryWs[`C${totalRow}`] = sc(totalRecords, { font: { bold: true, color: { rgb: '1A202C' } }, fill: totalFill, alignment: { horizontal: 'right' } })
        summaryWs[`D${totalRow}`] = sc('', { fill: totalFill })

        summaryWs['!ref'] = `A1:D${totalRow}`
        summaryWs['!cols'] = [{ wch: 36 }, { wch: 12 }, { wch: 14 }, { wch: 22 }]
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Executive Summary')

        // ── Data Sheets ──
        for (const p of parsed) {
          addLog(`Writing sheet: ${p.source.name}`)
          const rows = p.rows.slice(0, 5000)
          const ws = XLSX.utils.json_to_sheet(rows)

          // Style header row
          const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1:A1')
          for (let col = range.s.c; col <= range.e.c; col++) {
            const addr = XLSX.utils.encode_cell({ r: 0, c: col })
            if (ws[addr]) {
              ws[addr].s = { ...WHITE_BOLD, fill: NAV_800_FILL }
            }
          }

          // Style alternating data rows
          for (let row = 1; row <= range.e.r; row++) {
            const fill = row % 2 === 0 ? ALT_FILL : WHITE_FILL
            for (let col = range.s.c; col <= range.e.c; col++) {
              const addr = XLSX.utils.encode_cell({ r: row, c: col })
              if (ws[addr]) {
                ws[addr].s = { fill }
              }
            }
          }

          // Freeze top row
          ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' }

          const sheetName = p.source.name.replace(/\.[^/.]+$/, '').slice(0, 31) || 'Data'
          XLSX.utils.book_append_sheet(wb, ws, sheetName)
        }
      } catch (xlsxErr: any) {
        throw new Error(
          `Report generation failed: ${xlsxErr?.message ?? 'Unknown error'}. Your data was not lost.`
        )
      }

      // 3) Store a reports row
      addLog('Saving report metadata…')
      const { error: insertError } = await supabase
        .from('reports')
        .insert({ user_id: userId, title, format: 'excel', status: 'generated' })
        .select('id')
        .single()

      if (insertError) throw insertError

      addLog('Downloading workbook…')
      downloadExcel(wb, `${title.replace(/\s+/g, '_')}.xlsx`)

      addLog('Done — report downloaded successfully.')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to generate report')
      addLog(`ERROR: ${err?.message ?? 'Failed to generate report'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar email={email} onLogout={logout} activePath="/reports/new" />

      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--amber-500)',
              marginBottom: '6px',
            }}
          >
            Report Builder
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--foreground)',
              letterSpacing: '-0.02em',
            }}
          >
            Generate Excel Report
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            Select data sources and export a formatted workbook.
          </p>
          {datasetId && (
            <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.01em' }}>
              📊 Dataset: {datasetName ?? datasetId}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '20px', maxWidth: '860px' }}>
          {/* Report title input */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px 22px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '10px' }}>
              Report Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                background: 'var(--navy-900)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                outline: 'none',
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--amber-500)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Data source selection */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px 22px' }}>
            {datasetId ? (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
                  Data Source
                </div>
                <div style={{ fontSize: '13px', color: 'var(--foreground)', padding: '10px 14px', border: '1px solid var(--border)', background: 'rgba(212,168,67,0.07)', borderLeft: '3px solid var(--amber-500)' }}>
                  📊 {datasetName ?? datasetId}
                  <span style={{ marginLeft: '12px', fontSize: '11px', color: 'var(--muted)' }}>
                    {datasetRows.length} records
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Data Sources
                  </div>
                  <Link href="/upload" style={{ fontSize: '11px', color: 'var(--amber-500)', textDecoration: 'none', letterSpacing: '0.04em' }}>
                    Upload more →
                  </Link>
                </div>

                {sources.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--muted)', padding: '16px 0' }}>
                    No sources yet.{' '}
                    <Link href="/upload" style={{ color: 'var(--amber-500)', textDecoration: 'none' }}>
                      Upload files first
                    </Link>
                  </p>
                ) : (
                  <div style={{ border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ ...headCell, width: '40px', textAlign: 'center' }}></th>
                          <th style={{ ...headCell, textAlign: 'left' }}>File Name</th>
                          <th style={{ ...headCell, textAlign: 'left' }}>Type</th>
                          <th style={{ ...headCell, textAlign: 'right' }}>Uploaded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sources.map((s, i) => (
                          <tr
                            key={s.id}
                            onClick={() => toggle(s.id)}
                            style={{
                              background: selected[s.id]
                                ? 'rgba(212,168,67,0.07)'
                                : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                              cursor: 'pointer',
                              borderLeft: selected[s.id] ? '3px solid var(--amber-500)' : '3px solid transparent',
                            }}
                          >
                            <td style={{ ...cell, textAlign: 'center', width: '40px' }}>
                              <input
                                type="checkbox"
                                checked={!!selected[s.id]}
                                onChange={() => toggle(s.id)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ accentColor: 'var(--amber-500)', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ ...cell, fontWeight: selected[s.id] ? 600 : 400 }}>{s.name}</td>
                            <td style={cell}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 7px',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  letterSpacing: '0.06em',
                                  textTransform: 'uppercase',
                                  background: s.file_type === 'csv' ? 'rgba(72,187,120,0.15)' : 'rgba(99,179,237,0.15)',
                                  color: s.file_type === 'csv' ? 'var(--green-400)' : 'var(--blue-400)',
                                  border: `1px solid ${s.file_type === 'csv' ? 'rgba(72,187,120,0.3)' : 'rgba(99,179,237,0.3)'}`,
                                }}
                              >
                                {s.file_type}
                              </span>
                            </td>
                            <td style={{ ...cell, textAlign: 'right', fontFamily: 'monospace', color: 'var(--muted)', fontSize: '11px' }}>
                              {new Date(s.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Generate button */}
            <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              {datasetId ? (
                <button
                  onClick={generateFromDataset}
                  disabled={loading || datasetRows.length === 0}
                  style={{
                    padding: '10px 28px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: loading || datasetRows.length === 0 ? 'var(--surface-2)' : 'var(--amber-500)',
                    color: loading || datasetRows.length === 0 ? 'var(--muted)' : 'var(--navy-900)',
                    border: `1px solid ${loading || datasetRows.length === 0 ? 'var(--border)' : 'transparent'}`,
                    cursor: loading || datasetRows.length === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!loading && datasetRows.length > 0) e.currentTarget.style.background = 'var(--amber-400)' }}
                  onMouseLeave={(e) => { if (!loading && datasetRows.length > 0) e.currentTarget.style.background = 'var(--amber-500)' }}
                >
                  {loading ? 'Generating…' : `Generate (${datasetRows.length} record${datasetRows.length !== 1 ? 's' : ''})`}
                </button>
              ) : (
                <button
                  onClick={generate}
                  disabled={loading || sources.length === 0 || selectedIds.length === 0}
                  style={{
                    padding: '10px 28px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: loading || selectedIds.length === 0 ? 'var(--surface-2)' : 'var(--amber-500)',
                    color: loading || selectedIds.length === 0 ? 'var(--muted)' : 'var(--navy-900)',
                    border: `1px solid ${loading || selectedIds.length === 0 ? 'var(--border)' : 'transparent'}`,
                    cursor: loading || selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!loading && selectedIds.length > 0) e.currentTarget.style.background = 'var(--amber-400)' }}
                  onMouseLeave={(e) => { if (!loading && selectedIds.length > 0) e.currentTarget.style.background = 'var(--amber-500)' }}
                >
                  {loading ? 'Generating…' : `Generate (${selectedIds.length} source${selectedIds.length !== 1 ? 's' : ''})`}
                </button>
              )}
              {status && !loading && (
                <span style={{ fontSize: '12px', color: 'var(--green-400)', letterSpacing: '0.02em' }}>
                  {status}
                </span>
              )}
            </div>

            {error && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: 'rgba(252,129,129,0.1)',
                  border: '1px solid rgba(252,129,129,0.3)',
                  fontSize: '12px',
                  color: 'var(--red-400)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <span>{error}</span>
                <button
                  onClick={copyError}
                  style={{
                    flexShrink: 0,
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--red-400)',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Copy error
                </button>
              </div>
            )}
          </div>

          {/* Terminal log output */}
          {log.length > 0 && (
            <div style={{ background: 'var(--navy-900)', border: '1px solid var(--border)', padding: '16px 18px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
                Output Log
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.8',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {log.map((line, i) => (
                  <div key={i} style={{ color: getLogColor(line) }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div style={{ fontSize: '12px', color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            Output workbook contains: Cover sheet · Executive Summary · One data sheet per source (max 5,000 rows each)
          </div>
        </div>
      </main>
    </div>
  )
}
