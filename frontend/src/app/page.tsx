import Link from 'next/link'
import { Dumbbell, Users, ClipboardList, CreditCard } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[#0D0D0D] text-white">
      <header className="sticky top-0 z-20 border-b border-[#585759]/20 bg-[#0D0D0D]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2B705]">
              <Dumbbell className="h-5 w-5 text-[#0D0D0D]" aria-hidden />
            </span>
            <span className="text-lg font-black tracking-tighter">
              FitManager<span className="text-[#F2B705]">.</span>
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm text-[#A6A6A6] transition-colors hover:text-white"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#F2B705] px-3 py-2 text-sm font-bold text-[#0D0D0D] hover:bg-[#BF9004]"
            >
              Criar academia
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Gestão da sua academia num só lugar.
        </h1>
        <p className="mt-4 max-w-xl text-[#A6A6A6] leading-relaxed">
          Alunos, fichas de treino e mensalidades — menos papel e menos retrabalho na receção.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#F2B705] px-6 text-sm font-bold text-[#0D0D0D] hover:bg-[#BF9004]"
          >
            Começar
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#585759] px-6 text-sm text-white hover:border-[#F2B705]/40"
          >
            Já tenho conta
          </Link>
        </div>

        <ul className="mt-16 grid gap-3 border-t border-[#585759]/20 pt-10 sm:grid-cols-3">
          <li className="flex gap-3 rounded-lg border border-[#585759]/20 px-4 py-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B705]" aria-hidden />
            <span className="text-sm text-[#A6A6A6]">Alunos e convites por link</span>
          </li>
          <li className="flex gap-3 rounded-lg border border-[#585759]/20 px-4 py-3">
            <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B705]" aria-hidden />
            <span className="text-sm text-[#A6A6A6]">Fichas e evolução do aluno</span>
          </li>
          <li className="flex gap-3 rounded-lg border border-[#585759]/20 px-4 py-3 sm:col-span-1">
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B705]" aria-hidden />
            <span className="text-sm text-[#A6A6A6]">Planos e matrículas</span>
          </li>
        </ul>
      </main>

      <footer className="border-t border-[#585759]/20 py-6 text-center text-xs text-[#585759]">
        FitManager
      </footer>
    </div>
  )
}
