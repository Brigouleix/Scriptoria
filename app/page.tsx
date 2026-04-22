import Link from 'next/link'
import { BookOpen, Snowflake, Shield, TrendingUp } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import LocaleSwitcher from '@/components/LocaleSwitcher'

export default async function LandingPage() {
  const t = await getTranslations('landing')
  const tc = await getTranslations('common')

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="text-amber-400" size={24} />
          <span className="text-xl font-bold tracking-tight">Scriptoria</span>
        </div>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <Link href="/login" className="text-stone-400 hover:text-stone-100 transition-colors text-sm">
            {t('login')}
          </Link>
          <Link href="/register" className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            {t('start_free')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1 rounded-full">
          <Snowflake size={12} />
          {t('badge')}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
          {t('title')}{' '}
          <span className="text-amber-400">{t('title_highlight')}</span>
        </h1>
        <p className="text-stone-400 text-lg max-w-xl leading-relaxed">{t('subtitle')}</p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link href="/register" className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-6 py-3 rounded-lg transition-colors">
            {t('cta')}
          </Link>
          <Link href="/login" className="text-stone-400 hover:text-stone-100 transition-colors">
            {t('already_account')}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-stone-800 px-6 py-20">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Snowflake className="text-amber-400" size={20} />
            </div>
            <h3 className="font-semibold">{t('feature1_title')}</h3>
            <p className="text-stone-400 text-sm leading-relaxed">{t('feature1_desc')}</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Shield className="text-amber-400" size={20} />
            </div>
            <h3 className="font-semibold">{t('feature2_title')}</h3>
            <p className="text-stone-400 text-sm leading-relaxed">{t('feature2_desc')}</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp className="text-amber-400" size={20} />
            </div>
            <h3 className="font-semibold">{t('feature3_title')}</h3>
            <p className="text-stone-400 text-sm leading-relaxed">{t('feature3_desc')}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 px-6 py-6 text-center text-stone-600 text-xs">
        © {new Date().getFullYear()} Scriptoria. {t('footer')}
      </footer>
    </main>
  )
}
