'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

type UploadResult = {
  name: string
  size: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  message?: string
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

export default function UploadPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<UploadResult[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/auth/login')
        return
      }
      setUserId(data.user.id)
      setEmail(data.user.email ?? null)
    }
    init()
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  const accept = useMemo(() => '.csv,.xlsx', [])

  const pickFiles = (picked: File[]) => {
    setFiles(picked)
    setResults(picked.map((f) => ({ name: f.name, size: f.size, status: 'pending' as const })))
  }

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    pickFiles(Array.from(e.target.files ?? []))
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith('.csv') || f.name.endsWith('.xlsx')
    )
    if (dropped.length > 0) pickFiles(dropped)
  }

  const uploadAll = async () => {
    if (!userId) return
    if (files.length === 0) return

    const next = [...results]

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      next[i] = { ...next[i], status: 'uploading', message: undefined }
      setResults([...next])

      try {
        const ext = file.name.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'csv'
        const path = `${userId}/${Date.now()}-${file.name}`

        const { error: storageError } = await supabase.storage
          .from('uploads')
          .upload(path, file, { upsert: false, contentType: file.type || undefined })
        if (storageError) throw storageError

        // Store the storage path (not public URL) so we can generate signed URLs later
        const { error: insertError } = await supabase.from('data_sources').insert({
          user_id: userId,
          name: file.name,
          file_type: ext,
          file_url: path,
        })

        if (insertError) throw insertError

        next[i] = { ...next[i], status: 'done' }
        setResults([...next])
      } catch (err: any) {
        next[i] = {
          ...next[i],
          status: 'error',
          message: err?.message ?? 'Upload failed',
        }
        setResults([...next])
      }
    }
  }

  const statusColor: Record<string, string> = {
    pending: 'var(--muted)',
    uploading: 'var(--amber-400)',
    done: 'var(--green-400)',
    error: 'var(--red-400)',
  }

  const statusLabel: Record<string, string> = {
    pending: 'PENDING',
    uploading: 'UPLOADING…',
    done: 'DONE',
    error: 'ERROR',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar email={email} onLogout={logout} activePath="/upload" />

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
            Data Ingestion
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--foreground)',
              letterSpacing: '-0.02em',
            }}
          >
            Upload Data Sources
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            Import CSV/XLSX exports from ERP, Bloomberg, or any system.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--amber-500)' : 'var(--border)'}`,
            background: dragOver ? 'rgba(212,168,67,0.05)' : 'var(--surface)',
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              marginBottom: '12px',
              color: dragOver ? 'var(--amber-500)' : 'var(--muted)',
            }}
          >
            ↑
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
            Drop files here or click to browse
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Accepts .csv and .xlsx files
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={onPick}
            style={{ display: 'none' }}
          />
        </div>

        {/* Upload button */}
        {files.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={uploadAll}
              disabled={!userId || files.length === 0}
              style={{
                padding: '10px 24px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'var(--amber-500)',
                color: 'var(--navy-900)',
                border: 'none',
                cursor: 'pointer',
                opacity: !userId || files.length === 0 ? 0.5 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (userId && files.length > 0) e.currentTarget.style.background = 'var(--amber-400)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--amber-500)' }}
            >
              Upload {files.length} file{files.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* Results table */}
        {results.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--foreground)', marginBottom: '10px' }}>
              Upload Queue
            </div>
            <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...headCell, textAlign: 'left' }}>File Name</th>
                    <th style={{ ...headCell, textAlign: 'right' }}>Size</th>
                    <th style={{ ...headCell, textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.name} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={cell}>
                        <div style={{ fontWeight: 500 }}>{r.name}</div>
                        {r.message && (
                          <div style={{ fontSize: '11px', color: 'var(--red-400)', marginTop: '2px' }}>
                            {r.message}
                          </div>
                        )}
                      </td>
                      <td style={{ ...cell, textAlign: 'right', fontFamily: 'monospace', color: 'var(--muted)', fontSize: '11px' }}>
                        {Math.round(r.size / 1024)} KB
                      </td>
                      <td style={{ ...cell, textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 7px',
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            color: statusColor[r.status],
                            background: `${statusColor[r.status]}18`,
                            border: `1px solid ${statusColor[r.status]}40`,
                          }}
                        >
                          {statusLabel[r.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {results.every((r) => r.status === 'done') && (
              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--muted)' }}>
                All uploads complete.{' '}
                <a href="/reports/new" style={{ color: 'var(--amber-500)', textDecoration: 'none' }}>
                  Generate a report →
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
