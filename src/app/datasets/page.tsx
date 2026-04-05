'use client'

import { useEffect, useState } from 'react'
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '32px' }}>
                    Loading…
                  </td>
                </tr>
              ) : datasets.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '48px' }}>
                    No datasets yet
                  </td>
                </tr>
              ) : (
                datasets.map((ds, i) => (
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
