'use client'

import Link from 'next/link'

type Props = {
  email: string | null
  onLogout: () => void
  activePath: string
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/upload', label: 'Upload', icon: '↑' },
  { href: '/datasets', label: 'Data Explorer', icon: '⊟' },
  { href: '/reports/new', label: 'New Report', icon: '⊞' },
]

export default function Sidebar({ email, onLogout, activePath }: Props) {
  return (
    <aside
      style={{
        width: '220px',
        minHeight: '100vh',
        background: 'var(--navy-800)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--amber-500)',
            textTransform: 'uppercase',
          }}
        >
          REPORTA
        </div>
        <div
          style={{
            fontSize: '10px',
            color: 'var(--muted)',
            letterSpacing: '0.08em',
            marginTop: '2px',
            textTransform: 'uppercase',
          }}
        >
          Financial Intelligence
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {navLinks.map((link) => {
          const isActive = activePath === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--foreground)' : 'var(--slate-300)',
                textDecoration: 'none',
                borderLeft: isActive ? '3px solid var(--amber-500)' : '3px solid transparent',
                background: isActive ? 'rgba(212,168,67,0.08)' : 'transparent',
                letterSpacing: '0.02em',
                transition: 'all 0.15s',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  color: isActive ? 'var(--amber-500)' : 'var(--muted)',
                  width: '16px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted)',
            marginBottom: '10px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '0.01em',
          }}
          title={email ?? ''}
        >
          {email ?? '—'}
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '7px 12px',
            fontSize: '12px',
            color: 'var(--slate-300)',
            background: 'transparent',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--amber-500)'
            e.currentTarget.style.color = 'var(--amber-500)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--slate-300)'
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
