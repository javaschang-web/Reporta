'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

type Dataset = {
  id: string
  name: string
  source_type: string
  row_count: number | null
  tags: string[] | null
  created_at: string
}

type DataRecord = {
  id: string
  data: { [key: string]: unknown }
  recorded_at: string
}

const cell: React.CSSProperties = {
  padding: '9px 14px',
  fontSize: '12px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--foreground)',
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
}

const headCell: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  background: 'var(--navy-800)',
  borderBottom: '1px solid var(--border)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
}

function formatValue(val: unknown): string {
  if (val == null) return '—'
  if (typeof val === 'number') return val.toLocaleString()
  return String(val)
}

export default function DatasetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [email, setEmail] = useState<string | null>(null)
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [records, setRecords] = useState<DataRecord[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        router.replace('/auth/login')
        return
      }
      setEmail(data.user.email ?? null)

      const [{ data: ds }, { data: recs }] = await Promise.all([
        supabase.from('datasets').select('id,name,source_type,row_count,tags,created_at').eq('id', id).single(),
        supabase
          .from('dataset_records')
          .select('id,data,recorded_at')
          .eq('dataset_id', id)
          .order('recorded_at', { ascending: false })
          .limit(100),
      ])

      if (ds) setDataset(ds as Dataset)

      const rows = (recs ?? []) as DataRecord[]
      setRecords(rows)

      if (rows.length > 0 && rows[0].data) {
        setColumns(Object.keys(rows[0].data))
      }

      setLoading(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.replace('/auth/login')
    })

    return () => sub.subscription.unsubscribe()
  }, [router, id])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar email={email} onLogout={logout} activePath="/datasets" />

      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', overflowX: 'auto' }}>
        {/* Back link */}
        <Link
          href="/datasets"
          style={{
            display: 'inline-block',
            fontSize: '12px',
            color: 'var(--amber-500)',
            textDecoration: 'none',
            letterSpacing: '0.04em',
            marginBottom: '20px',
          }}
        >
          ← Back to Datasets
        </Link>

        {/* Page header */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div
              style={{
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--amber-500)',
                marginBottom: '6px',
              }}
            >
              Data Explorer
            </div>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--foreground)',
                letterSpacing: '-0.02em',
              }}
            >
              {loading ? '—' : (dataset?.name ?? 'Dataset')}
            </h1>
            {dataset && (
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
                {dataset.source_type && (
                  <span style={{ marginRight: '16px' }}>Source: {dataset.source_type}</span>
                )}
                {dataset.row_count != null && (
                  <span>{dataset.row_count.toLocaleString()} rows</span>
                )}
              </div>
            )}
          </div>
          {dataset && (
            <button
              onClick={() =>
                router.push(
                  '/reports/new?datasetId=' + id + '&datasetName=' + encodeURIComponent(dataset.name)
                )
              }
              style={{
                marginTop: '22px',
                padding: '9px 20px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'var(--amber-500)',
                color: 'var(--navy-900)',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--amber-400)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--amber-500)')}
            >
              Generate Report
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {loading ? (
                  <th style={headCell}>—</th>
                ) : columns.length === 0 ? (
                  <th style={headCell}>—</th>
                ) : (
                  columns.map((col) => (
                    <th key={col} style={headCell}>
                      {col}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '32px' }}>
                    Loading…
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(columns.length, 1)}
                    style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '48px' }}
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((rec, i) => (
                  <tr
                    key={rec.id}
                    style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                  >
                    {columns.map((col) => {
                      const val = rec.data[col]
                      const isNum = typeof val === 'number'
                      return (
                        <td
                          key={col}
                          style={{
                            ...cell,
                            textAlign: isNum ? 'right' : 'left',
                            fontFamily: isNum ? 'monospace' : 'inherit',
                            color: isNum ? 'var(--foreground)' : 'var(--foreground)',
                          }}
                        >
                          {formatValue(val)}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
