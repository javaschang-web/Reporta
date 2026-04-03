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
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = content[lang]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">

      {/* Nav */}
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">Reporta</span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              className="text-sm px-3 py-1.5 border rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {lang === 'ko' ? 'EN' : '한국어'}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-sm px-3 py-1.5 border rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 dark:text-gray-400 hover:underline px-2"
            >
              {t.nav.login}
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.nav.signup}
            </Link>
          </div>

          {/* Mobile: theme + lang + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              className="text-xs px-2 py-1 border rounded-full"
            >
              {lang === 'ko' ? 'EN' : '한'}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-sm px-2 py-1 border rounded-full"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border rounded-lg"
              aria-label="Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 border rounded-xl p-4 bg-white dark:bg-gray-900 shadow-lg flex flex-col gap-3">
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-gray-700 dark:text-gray-300 py-2 border-b dark:border-gray-700"
            >
              {t.nav.login}
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700 transition-colors"
            >
              {t.nav.signup}
            </Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24 text-center">
        <span className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium px-3 py-1 rounded-full mb-5 sm:mb-6">
          {t.hero.badge}
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight whitespace-pre-line mb-4 sm:mb-6">
          {t.hero.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 whitespace-pre-line mb-8 sm:mb-10 max-w-2xl mx-auto">
          {t.hero.sub}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
          >
            {t.hero.cta}
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto border px-6 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
          >
            {t.hero.demo}
          </Link>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-gray-50 dark:bg-gray-900 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-10">{t.pain.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {t.pain.items.map((item, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-5 sm:p-6"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-10">{t.features.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {t.features.items.map((f, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-3 sm:mb-4">{f.icon}</div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target users */}
      <section className="bg-blue-600 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">{t.targets.title}</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {t.targets.items.map((item, i) => (
              <span
                key={i}
                className="bg-white/20 backdrop-blur px-4 sm:px-5 py-2 rounded-full font-medium text-sm sm:text-base"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{t.cta.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">{t.cta.sub}</p>
          <Link
            href="/auth/signup"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-base sm:text-lg hover:bg-blue-700 transition-colors"
          >
            {t.cta.btn}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t dark:border-gray-800 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-400">
        {t.footer}
      </footer>
    </div>
  )
}
