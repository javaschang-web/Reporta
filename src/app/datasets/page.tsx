'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  textTransform: 'uppercase',
  color: 'var(--muted)',
  background: 'var(--navy-800)',
  borderBottom: '1px solid var(--border)',
  textAlign: 'left',
}

function sourceTypeBadge(type: string) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    n8n: {
      bg: 'rgba(212,168,67,0.15)',
      color: 'var(--amber-400)',
      border: '1px solid rgba(212,168,67,0.3)',
    },
    manual: {
      bg: 'rgba(160,160,160,0.15)',
      color: '#a0a0a0',
      border: '1px solid rgba(160,160,160,0.3)',
    },
    api: {
      bg: 'rgba(99,179,237,0.15)',
      color: 'var(--blue-400)',
      border: '1px solid rgba(99,179,237,0.3)',
    },
  }
  const s = styles[type] ?? styles['manual']
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        background: s.bg,
        color: s.color,
        border: s.border,
      }}
    >
      {type}
    </span>
  )
}

export default function DatasetsPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [showZeroRowsOnly, setShowZeroRowsOnly] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        router.replace('/auth/login')
        return
      }
      setEmail(data.user.email ?? null)

      const { data: rows } = await supabase
        .from('datasets')
        .select('id,name,source_type,row_count,tags,created_at')
        .order('created_at', { ascending: false })

      setDatasets((rows ?? []) as Dataset[])
      setLoading(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) router.replace('/auth/login')
    })

    return () => sub.subscription.unsubscribe()
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  const visibleDatasets = useMemo(() => {
    if (!showZeroRowsOnly) return datasets
    return datasets.filter((ds) => (ds.row_count ?? 0) === 0)
  }, [datasets, showZeroRowsOnly])

  const deleteDataset = async (dataset: Dataset) => {
    const confirmed = window.confirm(`Delete dataset "${dataset.name}"? This will also remove its records.`)
    if (!confirmed) return

    setDeletingId(dataset.id)
    setError(null)

    const { error: recordsError } = await supabase
      .from('dataset_records')
      .delete()
      .eq('dataset_id', dataset.id)

    if (recordsError) {
      setDeletingId(null)
      setError(recordsError.message)
      return
    }

    const { error: datasetError } = await supabase
      .from('datasets')
      .delete()
      .eq('id', dataset.id)

    setDeletingId(null)

    if (datasetError) {
      setError(datasetError.message)
      return
    }

    setDatasets((prev) => prev.filter((ds) => ds.id !== dataset.id))
  }

  const zeroRowDatasets = datasets.filter((ds) => (ds.row_count ?? 0) === 0)

  const deleteZeroRowDatasets = async () => {
    if (zeroRowDatasets.length === 0) return
    const confirmed = window.confirm(`Delete ${zeroRowDatasets.length} zero-row datasets?`)
    if (!confirmed) return

    setBulkDeleting(true)
    setError(null)

    for (const dataset of zeroRowDatasets) {
      const { error: recordsError } = await supabase
        .from('dataset_records')
        .delete()
        .eq('dataset_id', dataset.id)

      if (recordsError) {
        setBulkDeleting(false)
        setError(recordsError.message)
        return
      }

      const { error: datasetError } = await supabase
        .from('datasets')
        .delete()
        .eq('id', dataset.id)

      if (datasetError) {
        setBulkDeleting(false)
        setError(datasetError.message)
        return
      }
    }

    setDatasets((prev) => prev.filter((ds) => (ds.row_count ?? 0) !== 0))
    setBulkDeleting(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar email={email} onLogout={logout} activePath="/datasets" />

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
            Data
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--foreground)',
              letterSpacing: '-0.02em',
            }}
          >
            Data Explorer
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)' }}>
            <input
              type="checkbox"
              checked={showZeroRowsOnly}
              onChange={(e) => setShowZeroRowsOnly(e.target.checked)}
              style={{ accentColor: 'var(--amber-500)', cursor: 'pointer' }}
            />
            Show only 0-row datasets
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {visibleDatasets.length} shown / {datasets.length} total
            </div>
            <button
              onClick={() => void deleteZeroRowDatasets()}
              disabled={bulkDeleting || zeroRowDatasets.length === 0}
              style={{
                padding: '7px 10px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'rgba(239,68,68,0.1)',
                color: 'var(--red-400)',
                border: '1px solid rgba(239,68,68,0.3)',
                cursor: bulkDeleting || zeroRowDatasets.length === 0 ? 'not-allowed' : 'pointer',
                opacity: bulkDeleting || zeroRowDatasets.length === 0 ? 0.6 : 1,
              }}
            >
              {bulkDeleting ? 'Deleting…' : `Delete all 0-row (${zeroRowDatasets.length})`}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', fontSize: '12px', color: 'var(--red-400)' }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headCell}>Name</th>
                <th style={headCell}>Source</th>
                <th style={{ ...headCell, textAlign: 'right' }}>Rows</th>
                <th style={headCell}>Tags</th>
                <th style={{ ...headCell, textAlign: 'right' }}>Created</th>
                <th style={{ ...headCell, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '32px' }}>
                    Loading…
                  </td>
                </tr>
              ) : visibleDatasets.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '48px' }}>
                    {showZeroRowsOnly ? 'No 0-row datasets' : 'No datasets yet'}
                  </td>
                </tr>
              ) : (
                visibleDatasets.map((ds, i) => (
                  <tr
                    key={ds.id}
                    onClick={() => router.push('/datasets/' + ds.id)}
                    style={{
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(212,168,67,0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <td style={{ ...cell, fontWeight: 500 }}>{ds.name}</td>
                    <td style={cell}>{sourceTypeBadge(ds.source_type ?? 'manual')}</td>
                    <td
                      style={{
                        ...cell,
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        color: 'var(--muted)',
                        fontSize: '11px',
                      }}
                    >
                      {ds.row_count != null ? ds.row_count.toLocaleString() : '—'}
                    </td>
                    <td style={cell}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(ds.tags ?? []).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              fontSize: '10px',
                              letterSpacing: '0.04em',
                              background: 'rgba(255,255,255,0.06)',
                              color: 'var(--muted)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td
                      style={{
                        ...cell,
                        textAlign: 'right',
                        fontFamily: 'monospace',
                        color: 'var(--muted)',
                        fontSize: '11px',
                      }}
                    >
                      {new Date(ds.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ ...cell, textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          void deleteDataset(ds)
                        }}
                        disabled={deletingId === ds.id}
                        style={{
                          padding: '6px 10px',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          background: 'rgba(239,68,68,0.1)',
                          color: 'var(--red-400)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          cursor: deletingId === ds.id ? 'not-allowed' : 'pointer',
                          opacity: deletingId === ds.id ? 0.6 : 1,
                        }}
                      >
                        {deletingId === ds.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
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
