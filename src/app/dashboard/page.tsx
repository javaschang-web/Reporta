'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Reporta</h1>
            <p className="text-sm text-gray-500">{email ?? '…'}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm border rounded px-3 py-1.5 hover:bg-gray-100"
          >
            Logout
          </button>
        </header>

        {/* Action Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link
            href="/upload"
            className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">📂</div>
            <div className="font-semibold">Upload data</div>
            <div className="text-sm text-gray-500 mt-1">
              Import CSV/XLSX files from ERP, Bloomberg, etc.
            </div>
          </Link>
          <Link
            href="/reports/new"
            className="bg-blue-600 text-white border rounded-lg p-5 hover:bg-blue-700 transition-colors"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">Generate report</div>
            <div className="text-sm text-blue-100 mt-1">
              Create an Excel report from uploaded data
            </div>
          </Link>
        </div>

        {/* Data sources */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Recent uploads</h2>
            <Link href="/upload" className="text-sm text-blue-600 hover:underline">
              Upload more →
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : sources.length === 0 ? (
            <div className="bg-white border rounded-lg p-5 text-sm text-gray-500">
              No uploads yet.{' '}
              <Link href="/upload" className="text-blue-600 underline">
                Upload your first file
              </Link>
            </div>
          ) : (
            <div className="bg-white border rounded-lg divide-y">
              {sources.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="font-medium text-sm">{s.name}</span>
                    <span className="ml-2 text-xs bg-gray-100 rounded px-1.5 py-0.5 uppercase">
                      {s.file_type}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reports */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Recent reports</h2>
            <Link href="/reports/new" className="text-sm text-blue-600 hover:underline">
              New report →
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : reports.length === 0 ? (
            <div className="bg-white border rounded-lg p-5 text-sm text-gray-500">
              No reports yet.{' '}
              <Link href="/reports/new" className="text-blue-600 underline">
                Generate your first report
              </Link>
            </div>
          ) : (
            <div className="bg-white border rounded-lg divide-y">
              {reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <span className="font-medium text-sm">{r.title}</span>
                    <span className="ml-2 text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5 uppercase">
                      {r.format}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
