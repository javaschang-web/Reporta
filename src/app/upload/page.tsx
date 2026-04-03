'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type UploadResult = {
  name: string
  size: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  message?: string
}

export default function UploadPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<UploadResult[]>([])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.replace('/auth/login')
        return
      }
      setUserId(data.user.id)
    }
    init()
  }, [router])

  const accept = useMemo(() => '.csv,.xlsx', [])

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    setFiles(picked)
    setResults(
      picked.map((f) => ({ name: f.name, size: f.size, status: 'pending' as const }))
    )
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

        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)

        // Create a data_sources row (table must exist)
        const { error: insertError } = await supabase.from('data_sources').insert({
          user_id: userId,
          name: file.name,
          file_type: ext,
          file_url: urlData.publicUrl,
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

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Upload data</h1>
            <p className="text-sm text-gray-600">Upload CSV/XLSX exports from any system.</p>
          </div>
          <Link className="border rounded px-3 py-2" href="/dashboard">
            Back
          </Link>
        </header>

        <div className="mt-8 border rounded p-4">
          <input type="file" accept={accept} multiple onChange={onPick} />
          <div className="mt-4">
            <button
              onClick={uploadAll}
              className="bg-blue-600 text-white rounded px-3 py-2 disabled:opacity-50"
              disabled={!userId || files.length === 0}
            >
              Upload
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-8">
            <h2 className="font-medium">Results</h2>
            <ul className="mt-2 space-y-2">
              {results.map((r) => (
                <li key={r.name} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-gray-600">{Math.round(r.size / 1024)} KB</div>
                    </div>
                    <div className="text-sm">
                      {r.status === 'pending' && 'Pending'}
                      {r.status === 'uploading' && 'Uploading…'}
                      {r.status === 'done' && 'Done'}
                      {r.status === 'error' && 'Error'}
                    </div>
                  </div>
                  {r.message && <div className="text-sm text-red-600 mt-2">{r.message}</div>}
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              Next: <Link className="text-blue-600 underline" href="/reports/new">Generate a report</Link>
            </p>
          </div>
        )}

        <div className="mt-10 text-sm text-gray-600">
          <p>
            Note: You need a Supabase Storage bucket named <code>uploads</code> and a table{' '}
            <code>data_sources</code>. If you see an error, ping me with the message.
          </p>
        </div>
      </div>
    </main>
  )
}
