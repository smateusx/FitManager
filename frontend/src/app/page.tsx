import Link from 'next/link'
import { Dumbbell, LayoutDashboard, Users, ClipboardList } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#0D0D0D] text-white flex flex-col">
      <header className="sticky top-0 z-20 border-b border-[#585759]/25 bg-[#0D0D0D]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2B705]">
              <Dumbbell className="h-5 w-5 text-[#0D0D0D]" aria-hidden />
            </span>
            <span className="font-black tracking-tighter text-lg sm:text-xl truncate">
              FitManager<span className="text-[#F2B705]">.</span>
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#A6A6A6] transition-colors hover:text-white sm:px-4"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#F2B705] px-3 py-2 text-sm font-bold text-[#0D0D0D] shadow-lg shadow-[#F2B705]/15 transition-colors hover:bg-[#BF9004] sm:px-4"
            >
              Cadastrar academia
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-[#585759]/20">
          <div className="pointer-events-none absolute top-0 left-1/2 h-[420px] w-[min(100%,800px)] -translate-x-1/2 rounded-full bg-[#F2B705]/12 blur-[100px]" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F2B705]">
              Gestão para academias
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Alunos, fichas e pagamentos num só lugar — com Firebase na nuvem.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#A6A6A6] sm:text-lg">
              Painel para donos e recepção; portal do aluno para ver treinos e evolução. Simples, rápido e pronto para
              usar no celular ou no desktop.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#F2B705] px-8 text-sm font-bold text-[#0D0D0D] shadow-xl shadow-[#F2B705]/20 transition-colors hover:bg-[#BF9004]"
              >
                Começar grátis
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#585759] bg-transparent px-8 text-sm font-semibold text-white transition-colors hover:border-[#F2B705]/50 hover:text-[#F2B705]"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-center text-xl font-bold sm:text-2xl">O que o FitManager faz</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#A6A6A6]">
            Foco no dia a dia da academia, sem página genérica de template.
          </p>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {[
              {
                icon: LayoutDashboard,
                title: 'Painel e indicadores',
                desc: 'Visão geral de alunos, treinos e movimento financeiro do mês.',
              },
              {
                icon: Users,
                title: 'Cadastro de alunos',
                desc: 'Convites por link da academia e perfis organizados por unidade.',
              },
              {
                icon: ClipboardList,
                title: 'Fichas e evolução',
                desc: 'Alunos acompanham treinos e registram cargas no próprio portal.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="rounded-2xl border border-[#585759]/35 bg-[#141414] p-6 transition-colors hover:border-[#F2B705]/35"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2B705]/15 text-[#F2B705]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#A6A6A6]">{desc}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-[#585759]/25 py-8 text-center text-xs text-[#585759]">
        FitManager — autenticação e dados com Firebase (Auth + Firestore).
      </footer>
    </div>
  )
}
