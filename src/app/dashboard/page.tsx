'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

type DataSource = {
  id: number
  name: string
  file_type: string
  created_at: string
}

type Report = {
  id: number
  title: string
  format: string
  status: string
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
}

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [sources, setSources] = useState<DataSource[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        router.replace('/auth/login')
        return
      }
      setEmail(data.user.email ?? null)

      const [{ data: srcs }, { data: rpts }] = await Promise.all([
        supabase
          .from('data_sources')
          .select('id,name,file_type,created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('reports')
          .select('id,title,format,status,created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setSources((srcs ?? []) as DataSource[])
      setReports((rpts ?? []) as Report[])
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

  const lastActivity =
    sources.length > 0 || reports.length > 0
      ? new Date(
          Math.max(
            ...[...sources.map((s) => +new Date(s.created_at)), ...reports.map((r) => +new Date(r.created_at))]
          )
        ).toLocaleDateString()
      : '—'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar email={email} onLogout={logout} activePath="/dashboard" />

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
            Overview
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--foreground)',
              letterSpacing: '-0.02em',
            }}
          >
            Dashboard
          </h1>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Uploads', value: loading ? '—' : String(sources.length), sub: 'data sources' },
            { label: 'Total Reports', value: loading ? '—' : String(reports.length), sub: 'generated' },
            { label: 'Last Activity', value: loading ? '—' : lastActivity, sub: 'most recent' },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '20px 22px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  marginBottom: '10px',
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: 'var(--amber-400)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {card.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && sources.length === 0 && reports.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '56px 24px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              marginBottom: '32px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>📂</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '6px' }}>
              No data yet. Start by uploading your first file.
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              Import CSV or XLSX files to generate your first report.
            </div>
            <Link
              href="/upload"
              style={{
                display: 'inline-block',
                padding: '10px 28px',
                background: 'var(--amber-500)',
                color: 'var(--navy-900)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              Upload Files
            </Link>
          </div>
        )}

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <Link
            href="/upload"
            style={{
              display: 'block',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '20px 22px',
              textDecoration: 'none',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--amber-500)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
              Action
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
              Upload Data
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Import CSV/XLSX from ERP, Bloomberg, etc.
            </div>
          </Link>
          <Link
            href="/reports/new"
            style={{
              display: 'block',
              background: 'var(--navy-800)',
              border: '1px solid var(--amber-500)',
              padding: '20px 22px',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(212,168,67,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--navy-800)')}
          >
            <div style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--amber-500)', marginBottom: '8px' }}>
              Primary Action
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
              Generate Report
            </div>
            <div style={{ fontSize: '12px', color: 'var(--slate-300)' }}>
              Create an Excel report from uploaded data
            </div>
          </Link>
        </div>

        {/* Recent uploads */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--foreground)' }}>
              Recent Uploads
            </div>
            <Link href="/upload" style={{ fontSize: '11px', color: 'var(--amber-500)', textDecoration: 'none', letterSpacing: '0.04em' }}>
              Upload more →
            </Link>
          </div>

          <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...headCell, textAlign: 'left' }}>File Name</th>
                  <th style={{ ...headCell, textAlign: 'left' }}>Type</th>
                  <th style={{ ...headCell, textAlign: 'right' }}>Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>
                      Loading…
                    </td>
                  </tr>
                ) : sources.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>
                      No uploads yet.{' '}
                      <Link href="/upload" style={{ color: 'var(--amber-500)', textDecoration: 'none' }}>
                        Upload your first file
                      </Link>
                    </td>
                  </tr>
                ) : (
                  sources.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ ...cell, fontWeight: 500 }}>{s.name}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent reports */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--foreground)' }}>
              Recent Reports
            </div>
            <Link href="/reports/new" style={{ fontSize: '11px', color: 'var(--amber-500)', textDecoration: 'none', letterSpacing: '0.04em' }}>
              New report →
            </Link>
          </div>

          <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...headCell, textAlign: 'left' }}>Report Title</th>
                  <th style={{ ...headCell, textAlign: 'left' }}>Status</th>
                  <th style={{ ...headCell, textAlign: 'right' }}>Generated</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>
                      Loading…
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>
                      No reports yet.{' '}
                      <Link href="/reports/new" style={{ color: 'var(--amber-500)', textDecoration: 'none' }}>
                        Generate your first report
                      </Link>
                    </td>
                  </tr>
                ) : (
                  reports.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ ...cell, fontWeight: 500 }}>{r.title}</td>
                      <td style={cell}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 7px',
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            background: 'rgba(212,168,67,0.15)',
                            color: 'var(--amber-400)',
                            border: '1px solid rgba(212,168,67,0.3)',
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td style={{ ...cell, textAlign: 'right', fontFamily: 'monospace', color: 'var(--muted)', fontSize: '11px' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
