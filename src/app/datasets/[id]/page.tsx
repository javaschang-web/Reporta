'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recounting, setRecounting] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const [savingRecordId, setSavingRecordId] = useState<string | null>(null)
  const [bulkDeletingRecords, setBulkDeletingRecords] = useState(false)
  const [selectedRecordIds, setSelectedRecordIds] = useState<Record<string, boolean>>({})
  const [recordQuery, setRecordQuery] = useState('')
  const [filterColumn, setFilterColumn] = useState<string>('')
  const [filterValue, setFilterValue] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [editingRecordData, setEditingRecordData] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [tagsInput, setTagsInput] = useState('')

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

      if (ds) {
        const datasetValue = ds as Dataset
        setDataset(datasetValue)
        setNameInput(datasetValue.name ?? '')
        setTagsInput((datasetValue.tags ?? []).join(', '))
      }

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

  const deleteDataset = async () => {
    if (!dataset) return
    const confirmed = window.confirm(`Delete dataset "${dataset.name}"? This will also remove its records.`)
    if (!confirmed) return

    setDeleting(true)
    setError(null)
    setSaveMessage(null)

    const { error: recordsError } = await supabase
      .from('dataset_records')
      .delete()
      .eq('dataset_id', dataset.id)

    if (recordsError) {
      setDeleting(false)
      setError(recordsError.message)
      return
    }

    const { error: datasetError } = await supabase
      .from('datasets')
      .delete()
      .eq('id', dataset.id)

    setDeleting(false)

    if (datasetError) {
      setError(datasetError.message)
      return
    }

    router.replace('/datasets')
  }

  const saveDatasetMeta = async () => {
    if (!dataset) return

    setSaving(true)
    setError(null)
    setSaveMessage(null)

    const nextName = nameInput.trim()
    const nextTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (!nextName) {
      setSaving(false)
      setError('Dataset name is required.')
      return
    }

    const { error: updateError } = await supabase
      .from('datasets')
      .update({ name: nextName, tags: nextTags })
      .eq('id', dataset.id)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDataset((prev) => (prev ? { ...prev, name: nextName, tags: nextTags } : prev))
    setSaveMessage('Saved.')
  }

  const syncRowCount = async (options?: { silent?: boolean }) => {
    if (!dataset) return false

    if (!options?.silent) {
      setRecounting(true)
      setError(null)
      setSaveMessage(null)
    }

    const { count, error: countError } = await supabase
      .from('dataset_records')
      .select('*', { count: 'exact', head: true })
      .eq('dataset_id', dataset.id)

    if (countError) {
      if (!options?.silent) setRecounting(false)
      setError(countError.message)
      return false
    }

    const nextCount = count ?? 0

    const { error: updateError } = await supabase
      .from('datasets')
      .update({ row_count: nextCount })
      .eq('id', dataset.id)

    if (!options?.silent) setRecounting(false)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    setDataset((prev) => (prev ? { ...prev, row_count: nextCount } : prev))
    if (!options?.silent) setSaveMessage(`Row count updated to ${nextCount}.`)
    return true
  }

  const recalculateRowCount = async () => {
    await syncRowCount()
  }

  const deleteRecord = async (recordId: string) => {
    if (!dataset) return
    const confirmed = window.confirm('Delete this record?')
    if (!confirmed) return

    setDeletingRecordId(recordId)
    setError(null)
    setSaveMessage(null)

    const { error: deleteError } = await supabase
      .from('dataset_records')
      .delete()
      .eq('id', recordId)

    setDeletingRecordId(null)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setSelectedRecordIds((prev) => {
      const next = { ...prev }
      delete next[recordId]
      return next
    })
    setRecords((prev) => prev.filter((rec) => rec.id !== recordId))
    const synced = await syncRowCount({ silent: true })
    setSaveMessage(synced ? 'Record deleted and row count synced.' : 'Record deleted, but row count sync failed.')
  }

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecordIds((prev) => ({ ...prev, [recordId]: !prev[recordId] }))
  }

  const visibleRecords = useMemo(() => {
    const q = recordQuery.trim().toLowerCase()
    const fv = filterValue.trim().toLowerCase()

    const filtered = records.filter((rec) => {
      const matchesQuery = !q || columns.some((col) => String(rec.data[col] ?? '').toLowerCase().includes(q))
      const matchesColumnFilter = !filterColumn || !fv || String(rec.data[filterColumn] ?? '').toLowerCase().includes(fv)
      return matchesQuery && matchesColumnFilter
    })

    if (!sortColumn) return filtered

    return [...filtered].sort((a, b) => {
      const av = a.data[sortColumn]
      const bv = b.data[sortColumn]

      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDirection === 'asc' ? av - bv : bv - av
      }

      const as = String(av ?? '').toLowerCase()
      const bs = String(bv ?? '').toLowerCase()
      if (as < bs) return sortDirection === 'asc' ? -1 : 1
      if (as > bs) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [records, columns, recordQuery, filterColumn, filterValue, sortColumn, sortDirection])

  const totalPages = Math.max(1, Math.ceil(visibleRecords.length / pageSize))
  const pagedRecords = visibleRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleSort = (column: string) => {
    if (sortColumn !== column) {
      setSortColumn(column)
      setSortDirection('asc')
      setCurrentPage(1)
      return
    }

    if (sortDirection === 'asc') {
      setSortDirection('desc')
      setCurrentPage(1)
      return
    }

    setSortColumn(null)
    setSortDirection('asc')
    setCurrentPage(1)
  }

  const resetViewControls = () => {
    setRecordQuery('')
    setFilterColumn('')
    setFilterValue('')
    setSortColumn(null)
    setSortDirection('asc')
    setCurrentPage(1)
    setPageSize(25)
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = pagedRecords.map((rec) => rec.id)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRecordIds[id])
    const next = { ...selectedRecordIds }
    for (const recordId of visibleIds) {
      next[recordId] = !allSelected
    }
    setSelectedRecordIds(next)
  }

  const selectedCount = pagedRecords.filter((rec) => selectedRecordIds[rec.id]).length

  const bulkDeleteSelectedRecords = async () => {
    const ids = pagedRecords.filter((rec) => selectedRecordIds[rec.id]).map((rec) => rec.id)
    if (ids.length === 0) return

    const confirmed = window.confirm(`Delete ${ids.length} selected records?`)
    if (!confirmed) return

    setBulkDeletingRecords(true)
    setError(null)
    setSaveMessage(null)

    const { error: deleteError } = await supabase
      .from('dataset_records')
      .delete()
      .in('id', ids)

    setBulkDeletingRecords(false)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setRecords((prev) => prev.filter((rec) => !selectedRecordIds[rec.id]))
    setSelectedRecordIds({})
    const synced = await syncRowCount({ silent: true })
    setSaveMessage(synced ? `${ids.length} records deleted and row count synced.` : `${ids.length} records deleted, but row count sync failed.`)
  }

  const startEditRecord = (record: DataRecord) => {
    const next: Record<string, string> = {}
    for (const col of columns) {
      const value = record.data[col]
      next[col] = value == null ? '' : String(value)
    }
    setEditingRecordId(record.id)
    setEditingRecordData(next)
    setError(null)
    setSaveMessage(null)
  }

  const cancelEditRecord = () => {
    setEditingRecordId(null)
    setEditingRecordData({})
  }

  const saveRecord = async (recordId: string) => {
    const original = records.find((rec) => rec.id === recordId)
    if (!original) return

    setSavingRecordId(recordId)
    setError(null)
    setSaveMessage(null)

    const nextData: Record<string, unknown> = { ...original.data }
    for (const col of columns) {
      const raw = editingRecordData[col] ?? ''
      const originalValue = original.data[col]
      if (typeof originalValue === 'number') {
        const parsed = Number(raw.replaceAll(',', ''))
        nextData[col] = Number.isNaN(parsed) ? originalValue : parsed
      } else {
        nextData[col] = raw
      }
    }

    const { error: updateError } = await supabase
      .from('dataset_records')
      .update({ data: nextData })
      .eq('id', recordId)

    setSavingRecordId(null)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setRecords((prev) => prev.map((rec) => (rec.id === recordId ? { ...rec, data: nextData } : rec)))
    setEditingRecordId(null)
    setEditingRecordData({})
    const synced = await syncRowCount({ silent: true })
    setSaveMessage(synced ? 'Record saved and row count synced.' : 'Record saved, but row count sync failed.')
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '22px', flexShrink: 0 }}>
              <button
                onClick={() =>
                  router.push(
                    '/reports/new?datasetId=' + id + '&datasetName=' + encodeURIComponent(dataset.name)
                  )
                }
                style={{
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
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--amber-400)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--amber-500)')}
              >
                Generate Report
              </button>
              <button
                onClick={() => void deleteDataset()}
                disabled={deleting}
                style={{
                  padding: '9px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'rgba(239,68,68,0.1)',
                  color: 'var(--red-400)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting…' : 'Delete Dataset'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(252,129,129,0.1)', border: '1px solid rgba(252,129,129,0.3)', fontSize: '12px', color: 'var(--red-400)' }}>
            {error}
          </div>
        )}

        {dataset && (
          <div style={{ marginBottom: '16px', padding: '16px 18px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
              Edit Dataset
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>Name</div>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>Tags (comma-separated)</div>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => void saveDatasetMeta()}
                  disabled={saving}
                  style={{ padding: '9px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(212,168,67,0.12)', color: 'var(--amber-500)', border: '1px solid rgba(212,168,67,0.25)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => void recalculateRowCount()}
                  disabled={recounting}
                  style={{ padding: '9px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(99,179,237,0.12)', color: 'var(--blue-400)', border: '1px solid rgba(99,179,237,0.25)', cursor: recounting ? 'not-allowed' : 'pointer', opacity: recounting ? 0.6 : 1 }}
                >
                  {recounting ? 'Recounting…' : 'Recalculate Row Count'}
                </button>
                {saveMessage && <span style={{ fontSize: '12px', color: 'var(--green-400)' }}>{saveMessage}</span>}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '12px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={recordQuery}
              onChange={(e) => {
                setRecordQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search all columns..."
              style={{ width: '100%', maxWidth: '260px', padding: '9px 12px', fontSize: '13px', background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit' }}
            />
            <select
              value={filterColumn}
              onChange={(e) => {
                setFilterColumn(e.target.value)
                setCurrentPage(1)
              }}
              style={{ padding: '9px 12px', fontSize: '12px', background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}
            >
              <option value="">All columns</option>
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <input
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Filter value..."
              style={{ width: '100%', maxWidth: '220px', padding: '9px 12px', fontSize: '13px', background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit' }}
            />
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              style={{ padding: '9px 12px', fontSize: '12px', background: 'var(--navy-900)', border: '1px solid var(--border)', color: 'var(--foreground)', outline: 'none' }}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <button
              onClick={resetViewControls}
              style={{
                padding: '9px 12px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              Reset View
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {selectedCount} selected / {pagedRecords.length} on page / {visibleRecords.length} visible / {records.length} total
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
              onClick={toggleSelectAllVisible}
              disabled={pagedRecords.length === 0}
              style={{
                padding: '7px 10px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
                cursor: pagedRecords.length === 0 ? 'not-allowed' : 'pointer',
                opacity: pagedRecords.length === 0 ? 0.6 : 1,
              }}
            >
              Select All Visible
            </button>
            <button
              onClick={() => void bulkDeleteSelectedRecords()}
              disabled={bulkDeletingRecords || selectedCount === 0}
              style={{
                padding: '7px 10px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: 'rgba(239,68,68,0.1)',
                color: 'var(--red-400)',
                border: '1px solid rgba(239,68,68,0.3)',
                cursor: bulkDeletingRecords || selectedCount === 0 ? 'not-allowed' : 'pointer',
                opacity: bulkDeletingRecords || selectedCount === 0 ? 0.6 : 1,
              }}
            >
              {bulkDeletingRecords ? 'Deleting…' : `Delete Selected (${selectedCount})`}
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {loading ? (
                  <th style={headCell}>—</th>
                ) : columns.length === 0 ? (
                  <>
                    <th style={{ ...headCell, width: '40px', textAlign: 'center' }}></th>
                    <th style={headCell}>—</th>
                    <th style={{ ...headCell, textAlign: 'right' }}>Actions</th>
                  </>
                ) : (
                  <>
                    <th style={{ ...headCell, width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={pagedRecords.length > 0 && pagedRecords.every((rec) => selectedRecordIds[rec.id])}
                        onChange={toggleSelectAllVisible}
                        style={{ accentColor: 'var(--amber-500)', cursor: 'pointer' }}
                      />
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col}
                        style={{ ...headCell, cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => toggleSort(col)}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {col}
                          {sortColumn === col ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </th>
                    ))}
                    <th style={{ ...headCell, textAlign: 'right' }}>Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={Math.max(columns.length + 2, 1)} style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '32px' }}>
                    Loading…
                  </td>
                </tr>
              ) : visibleRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(columns.length + 2, 1)}
                    style={{ ...cell, color: 'var(--muted)', textAlign: 'center', padding: '48px' }}
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                pagedRecords.map((rec, i) => (
                  <tr
                    key={rec.id}
                    style={{ background: selectedRecordIds[rec.id] ? 'rgba(212,168,67,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                  >
                    <td style={{ ...cell, textAlign: 'center', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={!!selectedRecordIds[rec.id]}
                        onChange={() => toggleRecordSelection(rec.id)}
                        style={{ accentColor: 'var(--amber-500)', cursor: 'pointer' }}
                      />
                    </td>
                    {columns.map((col) => {
                      const val = rec.data[col]
                      const isNum = typeof val === 'number'
                      const isEditing = editingRecordId === rec.id
                      return (
                        <td
                          key={col}
                          style={{
                            ...cell,
                            textAlign: isNum ? 'right' : 'left',
                            fontFamily: isNum ? 'monospace' : 'inherit',
                            color: 'var(--foreground)',
                          }}
                        >
                          {isEditing ? (
                            <input
                              value={editingRecordData[col] ?? ''}
                              onChange={(e) =>
                                setEditingRecordData((prev) => ({ ...prev, [col]: e.target.value }))
                              }
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                fontSize: '12px',
                                background: 'var(--navy-900)',
                                border: '1px solid var(--border)',
                                color: 'var(--foreground)',
                                outline: 'none',
                                fontFamily: isNum ? 'monospace' : 'inherit',
                                textAlign: isNum ? 'right' : 'left',
                              }}
                            />
                          ) : (
                            formatValue(val)
                          )}
                        </td>
                      )
                    })}
                    <td style={{ ...cell, textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                        {editingRecordId === rec.id ? (
                          <>
                            <button
                              onClick={() => void saveRecord(rec.id)}
                              disabled={savingRecordId === rec.id}
                              style={{
                                padding: '6px 10px',
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                background: 'rgba(72,187,120,0.12)',
                                color: 'var(--green-400)',
                                border: '1px solid rgba(72,187,120,0.3)',
                                cursor: savingRecordId === rec.id ? 'not-allowed' : 'pointer',
                                opacity: savingRecordId === rec.id ? 0.6 : 1,
                              }}
                            >
                              {savingRecordId === rec.id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditRecord}
                              style={{
                                padding: '6px 10px',
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                background: 'rgba(255,255,255,0.06)',
                                color: 'var(--muted)',
                                border: '1px solid var(--border)',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEditRecord(rec)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '10px',
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              background: 'rgba(99,179,237,0.12)',
                              color: 'var(--blue-400)',
                              border: '1px solid rgba(99,179,237,0.3)',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => void deleteRecord(rec.id)}
                          disabled={deletingRecordId === rec.id || editingRecordId === rec.id}
                          style={{
                            padding: '6px 10px',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            background: 'rgba(239,68,68,0.1)',
                            color: 'var(--red-400)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            cursor: deletingRecordId === rec.id || editingRecordId === rec.id ? 'not-allowed' : 'pointer',
                            opacity: deletingRecordId === rec.id || editingRecordId === rec.id ? 0.6 : 1,
                          }}
                        >
                          {deletingRecordId === rec.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Page {currentPage} of {totalPages}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '7px 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', border: '1px solid var(--border)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.6 : 1 }}
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '7px 10px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.06)', color: 'var(--muted)', border: '1px solid var(--border)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.6 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
