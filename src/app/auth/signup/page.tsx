'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message ?? 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F1A2E',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '448px',
          background: '#1B2B4B',
          border: '1px solid #243660',
          padding: '2.5rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#D4A843',
              letterSpacing: '0.14em',
            }}
          >
            REPORTA
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#9CA3AF',
              marginTop: '5px',
              letterSpacing: '0.04em',
            }}
          >
            Financial Report Automation
          </div>
          <div
            style={{
              height: '1px',
              background: 'linear-gradient(to right, transparent, #D4A843, transparent)',
              marginTop: '18px',
              opacity: 0.6,
            }}
          />
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#CBD5E1',
                marginBottom: '7px',
              }}
            >
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@company.com"
              required
              style={{
                width: '100%',
                background: '#0F1A2E',
                border: '1px solid #243660',
                color: '#E8EDF5',
                padding: '10px 12px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#D4A843')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#243660')}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#CBD5E1',
                marginBottom: '7px',
              }}
            >
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              style={{
                width: '100%',
                background: '#0F1A2E',
                border: '1px solid #243660',
                color: '#E8EDF5',
                padding: '10px 12px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#D4A843')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#243660')}
            />
            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '5px' }}>
              Min 8 characters.
            </p>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                color: '#EF4444',
                fontSize: '12px',
              }}
            >
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#D4A843',
              color: '#0F1A2E',
              border: 'none',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#C49A35'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#D4A843'
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p
          style={{
            marginTop: '22px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#9CA3AF',
          }}
        >
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: '#D4A843', textDecoration: 'underline' }}>
            Login
          </Link>
        </p>
      </div>
    </main>
  )
}
