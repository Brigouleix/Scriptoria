import Link from 'next/link'
import { BookOpen, Snowflake, Shield, TrendingUp } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="text-amber-400" size={24} />
          <span className="text-xl font-bold tracking-tight">Scriptoria</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-stone-400 hover:text-stone-100 transition-colors text-sm">
            Connexion
          </Link>
          <Link
            href="/register"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Commencer gratuitement
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-6">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1 rounded-full">
          <Snowflake size={12} />
          Méthode Snowflake
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
          Transformez votre idée en{' '}
          <span className="text-amber-400">roman accompli</span>
        </h1>
        <p className="text-stone-400 text-lg max-w-xl leading-relaxed">
          Scriptoria vous guide étape par étape grâce à la méthode Snowflake —
          la technique utilisée par des milliers d&apos;auteurs professionnels
          pour structurer leur récit avant d&apos;écrire.
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link
            href="/register"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Démarrer mon projet →
          </Link>
          <Link
            href="/login"
            className="text-stone-400 hover:text-stone-100 transition-colors"
          >
            J&apos;ai déjà un compte
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
            <h3 className="font-semibold">4 étapes guidées</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Prémisse, résumé, personnages, synopsis. Chaque étape construit
              sur la précédente pour un roman solide et cohérent.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Shield className="text-amber-400" size={20} />
            </div>
            <h3 className="font-semibold">Vos projets, bien protégés</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Chaque projet est isolé par une sécurité de niveau base de données.
              Personne d&apos;autre ne peut accéder à votre travail.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp className="text-amber-400" size={20} />
            </div>
            <h3 className="font-semibold">Progression claire</h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Visualisez où vous en êtes dans votre roman et reprenez exactement
              là où vous vous êtes arrêté.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 px-6 py-6 text-center text-stone-600 text-xs">
        © {new Date().getFullYear()} Scriptoria. Tous droits réservés.
      </footer>
    </main>
  )
}
