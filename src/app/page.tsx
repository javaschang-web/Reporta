'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'

const content = {
  ko: {
    nav: { login: '로그인', signup: '무료로 시작하기', menu: '메뉴' },
    hero: {
      badge: '금융 보고서 자동화',
      title: '흩어진 데이터를\n보고서로 만드는 시간을\n없애드립니다.',
      sub: 'ERP, Bloomberg, 내부 시스템, Excel — 어디서 왔든\n데이터를 모아 자동으로 보고서를 생성합니다.',
      cta: '무료로 시작하기',
      demo: '데모 보기',
    },
    pain: {
      title: '이런 경험 있으신가요?',
      items: [
        { icon: '😓', text: '매월 말 수작업으로 데이터 붙여넣기를 몇 시간씩 반복' },
        { icon: '📋', text: '5개 시스템에서 데이터를 모아 하나의 보고서로 정리' },
        { icon: '🔁', text: '같은 양식의 보고서를 매달 처음부터 다시 작성' },
      ],
    },
    features: {
      title: 'Reporta로 해결하세요',
      items: [
        {
          icon: '📂',
          title: '데이터 통합',
          desc: 'ERP, Bloomberg, 내부 계정계, Excel 등 어떤 소스든 업로드하면 자동으로 정리됩니다.',
        },
        {
          icon: '📊',
          title: '보고서 자동 생성',
          desc: 'Excel, PPT, Word 형태로 보고서를 자동 생성. 기존 양식을 그대로 사용할 수 있습니다.',
        },
        {
          icon: '⏱',
          title: '수시간 → 수분',
          desc: '매월 반복되는 보고서 작성 시간을 90% 이상 절감합니다.',
        },
      ],
    },
    targets: {
      title: '이런 분들을 위해 만들었습니다',
      items: ['스타트업 CFO', 'IR / 리서치팀', '컴플라이언스 담당자'],
    },
    cta: {
      title: '지금 바로 시작해보세요',
      sub: '베타 기간 무료 사용 가능 · 신용카드 불필요',
      btn: '무료로 시작하기',
    },
    footer: '© 2026 Reporta. All rights reserved.',
  },
  en: {
    nav: { login: 'Login', signup: 'Get started free', menu: 'Menu' },
    hero: {
      badge: 'Financial Report Automation',
      title: 'Stop spending hours\ncopy-pasting data\ninto reports.',
      sub: 'ERP, Bloomberg, internal systems, Excel —\nno matter where your data lives, Reporta brings it together and generates reports automatically.',
      cta: 'Get started free',
      demo: 'See a demo',
    },
    pain: {
      title: 'Sound familiar?',
      items: [
        { icon: '😓', text: 'Spending hours every month manually pasting data into templates' },
        { icon: '📋', text: 'Pulling data from 5 different systems into a single report' },
        { icon: '🔁', text: 'Rebuilding the same report from scratch every single month' },
      ],
    },
    features: {
      title: 'Reporta fixes this',
      items: [
        {
          icon: '📂',
          title: 'Unified data layer',
          desc: 'Upload exports from ERP, Bloomberg, internal systems, or Excel. Reporta organizes everything automatically.',
        },
        {
          icon: '📊',
          title: 'Auto-generated reports',
          desc: 'Export to Excel, PPT, or Word. Use your existing templates or let Reporta create one.',
        },
        {
          icon: '⏱',
          title: 'Hours → Minutes',
          desc: 'Cut monthly report prep time by 90% or more.',
        },
      ],
    },
    targets: {
      title: 'Built for',
      items: ['Startup CFOs', 'IR & Research teams', 'Compliance professionals'],
    },
    cta: {
      title: 'Ready to automate your reports?',
      sub: 'Free during beta · No credit card required',
      btn: 'Get started free',
    },
    footer: '© 2026 Reporta. All rights reserved.',
  },
}

type Lang = 'ko' | 'en'

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('ko')
  const { setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = content[lang]

  // Enforce dark mode for the enterprise app
  if (typeof window !== 'undefined') {
    setTheme('dark')
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#0F1A2E', color: '#E8EDF5' }}>

      {/* Nav */}
      <nav style={{ backgroundColor: '#0F1A2E', borderBottom: '1px solid #243660' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold" style={{ color: '#D4A843' }}>Reporta</span>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
                className="text-sm px-3 py-1.5 transition-colors"
                style={{ color: '#94A3B8', border: '1px solid #243660' }}
              >
                {lang === 'ko' ? 'EN' : '한국어'}
              </button>
              <Link
                href="/auth/login"
                className="text-sm px-2 hover:underline"
                style={{ color: '#94A3B8' }}
              >
                {t.nav.login}
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm px-4 py-2 font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#D4A843', color: '#0F1A2E' }}
              >
                {t.nav.signup}
              </Link>
            </div>

            {/* Mobile: lang + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
                className="text-xs px-2 py-1"
                style={{ color: '#94A3B8', border: '1px solid #243660' }}
              >
                {lang === 'ko' ? 'EN' : '한'}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
                style={{ border: '1px solid #243660', color: '#94A3B8' }}
                aria-label="Menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div
              className="md:hidden mt-3 p-4 flex flex-col gap-3"
              style={{ backgroundColor: '#1B2B4B', border: '1px solid #243660' }}
            >
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm py-2"
                style={{ color: '#94A3B8', borderBottom: '1px solid #243660' }}
              >
                {t.nav.login}
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm px-4 py-2 text-center font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#D4A843', color: '#0F1A2E' }}
              >
                {t.nav.signup}
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24 text-center">
        <span
          className="inline-block text-xs sm:text-sm font-medium px-3 py-1 mb-5 sm:mb-6"
          style={{ border: '1px solid #D4A843', color: '#D4A843' }}
        >
          {t.hero.badge}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight whitespace-pre-line mb-4 sm:mb-6" style={{ color: '#FFFFFF' }}>
          {t.hero.title}
        </h1>
        <p className="text-base sm:text-lg whitespace-pre-line mb-8 sm:mb-10 max-w-2xl mx-auto" style={{ color: '#94A3B8' }}>
          {t.hero.sub}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto px-6 py-3 font-medium transition-opacity hover:opacity-90 text-center"
            style={{ backgroundColor: '#D4A843', color: '#0F1A2E' }}
          >
            {t.hero.cta}
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 font-medium transition-colors hover:opacity-80 text-center"
            style={{ border: '1px solid #D4A843', color: '#D4A843', backgroundColor: 'transparent' }}
          >
            {t.hero.demo}
          </Link>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-14 sm:py-20" style={{ backgroundColor: '#1B2B4B' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-10" style={{ color: '#FFFFFF' }}>
            {t.pain.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {t.pain.items.map((item, i) => (
              <div
                key={i}
                className="p-5 sm:p-6"
                style={{ backgroundColor: '#0F1A2E', border: '1px solid #243660' }}
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-sm sm:text-base" style={{ color: '#94A3B8' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 sm:py-20" style={{ backgroundColor: '#0F1A2E' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-10" style={{ color: '#FFFFFF' }}>
            {t.features.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {t.features.items.map((f, i) => (
              <div
                key={i}
                className="p-5 sm:p-6"
                style={{ backgroundColor: '#1B2B4B', border: '1px solid #243660' }}
              >
                <div className="text-3xl mb-3 sm:mb-4" style={{ color: '#D4A843' }}>{f.icon}</div>
                <h3 className="font-semibold text-base sm:text-lg mb-2" style={{ color: '#FFFFFF' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target users */}
      <section className="py-12 sm:py-16" style={{ backgroundColor: '#1B2B4B' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8" style={{ color: '#FFFFFF' }}>
            {t.targets.title}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {t.targets.items.map((item, i) => (
              <span
                key={i}
                className="px-4 sm:px-5 py-2 font-medium text-sm sm:text-base"
                style={{ border: '1px solid #D4A843', color: '#D4A843', backgroundColor: 'transparent' }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 text-center" style={{ backgroundColor: '#D4A843' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4" style={{ color: '#0F1A2E' }}>
            {t.cta.title}
          </h2>
          <p className="mb-6 sm:mb-8 text-sm sm:text-base" style={{ color: '#1B2B4B' }}>
            {t.cta.sub}
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 font-medium text-base sm:text-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0F1A2E', color: '#D4A843' }}
          >
            {t.cta.btn}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-6 sm:py-8 text-center text-xs sm:text-sm"
        style={{ backgroundColor: '#0F1A2E', borderTop: '1px solid #243660', color: '#64748B' }}
      >
        <span style={{ color: '#D4A843', fontWeight: 600 }}>Reporta</span>
        {' '}— {t.footer}
      </footer>
    </div>
  )
}
