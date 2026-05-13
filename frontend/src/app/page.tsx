import Link from 'next/link'
import { Dumbbell, Users, ClipboardList, CreditCard } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[#0D0D0D] text-white [hyphens:none]">
      <header className="sticky top-0 z-20 border-b border-[#585759]/20 bg-[#0D0D0D]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2B705]">
              <Dumbbell className="h-5 w-5 text-[#0D0D0D]" aria-hidden />
            </span>
            <span className="text-lg font-black tracking-tighter">
              FitManager<span className="text-[#F2B705]">.</span>
            </span>
          </div>
          <nav className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#585759]">
          Gestão para academias
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Organize alunos, treinos e mensalidades em um só lugar.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#A6A6A6] sm:text-lg">
          O FitManager reúne cadastro por convite, fichas de treino, matrículas e cobranças em um painel simples.
          Você reduz papel, planilhas e retrabalho na recepção e ganha tempo para cuidar dos seus alunos.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#F2B705] px-6 text-sm font-bold text-[#0D0D0D] hover:bg-[#BF9004]"
          >
            Abrir conta da academia
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#585759] px-6 text-sm text-white hover:border-[#F2B705]/40"
          >
            Já tenho conta
          </Link>
        </div>

        <p className="mt-6 max-w-xl text-xs leading-relaxed text-[#585759]">
          Dono da academia usa o cadastro principal. Alunos e recepcionistas entram pelos links de convite que você gera
          dentro do sistema.
        </p>

        <ul className="mt-16 grid gap-4 border-t border-[#585759]/20 pt-10 sm:grid-cols-3">
          <li className="flex gap-3 rounded-lg border border-[#585759]/20 p-4">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#F2B705]" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Pessoas da academia</p>
              <p className="mt-1 text-sm leading-relaxed text-[#A6A6A6]">
                Convites por link para alunos e recepcionistas, com permissões diferentes para cada perfil.
              </p>
            </div>
          </li>
          <li className="flex gap-3 rounded-lg border border-[#585759]/20 p-4">
            <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-[#F2B705]" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Treinos e evolução</p>
              <p className="mt-1 text-sm leading-relaxed text-[#A6A6A6]">
                Fichas por aluno e registro de carga para acompanhar o progresso ao longo do tempo.
              </p>
            </div>
          </li>
          <li className="flex gap-3 rounded-lg border border-[#585759]/20 p-4">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#F2B705]" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Planos e mensalidades</p>
              <p className="mt-1 text-sm leading-relaxed text-[#A6A6A6]">
                Planos, matrículas e cobranças organizados para o dono enxergar a saúde financeira da academia.
              </p>
            </div>
          </li>
        </ul>
      </main>

      <footer className="border-t border-[#585759]/20 px-4 py-6 text-center text-xs leading-relaxed text-[#585759] sm:px-6">
        <span className="text-[#A6A6A6]">FitManager.</span> Ferramenta pensada para academias que querem rotina mais clara e
        menos burocracia no balcão.
      </footer>
    </div>
  )
}
