import Link from 'next/link'
import {
  Dumbbell,
  LayoutDashboard,
  Users,
  ClipboardList,
  CreditCard,
  Clock,
  Shield,
  Smartphone,
} from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[#0D0D0D] text-white">
      <header className="sticky top-0 z-20 border-b border-[#585759]/25 bg-[#0D0D0D]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2B705]">
              <Dumbbell className="h-5 w-5 text-[#0D0D0D]" aria-hidden />
            </span>
            <span className="truncate text-lg font-black tracking-tighter sm:text-xl">
              FitManager<span className="text-[#F2B705]">.</span>
            </span>
          </div>
          <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
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
              Software de gestão para academias
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              Menos planilha e anotação solta. Mais tempo para seus alunos e para fazer a academia crescer.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#A6A6A6] sm:text-lg">
              Um gerenciador reúne cadastros, treinos, financeiro e comunicação num fluxo só. Você vê o que está
              acontecendo na recepção, reduz erros e dá ao aluno uma experiência profissional — do primeiro dia à
              renovação.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#F2B705] px-8 text-sm font-bold text-[#0D0D0D] shadow-xl shadow-[#F2B705]/20 transition-colors hover:bg-[#BF9004]"
              >
                Experimentar gratuitamente
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#585759] bg-transparent px-8 text-sm font-semibold text-white transition-colors hover:border-[#F2B705]/50 hover:text-[#F2B705]"
              >
                Já sou cliente
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-[#585759]/20 bg-[#0D0D0D]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <h2 className="text-center text-xl font-bold sm:text-2xl">Por que usar um gerenciador na sua academia</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#A6A6A6] sm:text-base">
              Quem ainda controla tudo no caderno ou em arquivos espalhados perde dinheiro com mensalidades esquecidas,
              confusão em quem está ativo e retrabalho na recepção. Um sistema organiza o operacional para você decidir
              melhor — com números claros na mesa.
            </p>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Clock,
                  title: 'Ganho de tempo na rotina',
                  desc: 'Recepção encontra aluno, plano e vencimento na hora, sem ficar caçando informação em grupos de WhatsApp.',
                },
                {
                  icon: CreditCard,
                  title: 'Financeiro mais previsível',
                  desc: 'Acompanhe entradas, vencimentos e inadimplência com visão do mês. Menos surpresa no caixa.',
                },
                {
                  icon: Shield,
                  title: 'Dados centralizados e seguros',
                  desc: 'Histórico de matrícula e treino no lugar certo, com menos risco de perder papel ou planilha.',
                },
                {
                  icon: Users,
                  title: 'Alunos melhor atendidos',
                  desc: 'Cadastro por convite, dados atualizados e menos fila na secretaria nos horários de pico.',
                },
                {
                  icon: ClipboardList,
                  title: 'Treino profissionalizado',
                  desc: 'Fichas acessíveis ao aluno e registro de evolução — fortalece retenção e resultado.',
                },
                {
                  icon: Smartphone,
                  title: 'Funciona no dia a dia real',
                  desc: 'Tanto na recepção quanto no celular do aluno: a informação acompanha quem está no chão da academia.',
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
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-center text-xl font-bold sm:text-2xl">O que você faz com o FitManager</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#A6A6A6]">
            Funcionalidades pensadas para donos, recepção e equipe — e um portal simples para o aluno.
          </p>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {[
              {
                icon: LayoutDashboard,
                title: 'Painel e indicadores',
                desc: 'Visão geral de alunos ativos, treinos e movimento financeiro do período, para decidir com calma.',
              },
              {
                icon: Users,
                title: 'Gestão de alunos',
                desc: 'Convites por link, perfis por unidade e menos retrabalho quando alguém novo entra.',
              },
              {
                icon: ClipboardList,
                title: 'Fichas e evolução',
                desc: 'Monte treinos e deixe o aluno acompanhar e registrar progresso no próprio acesso.',
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
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 w-full max-w-sm items-center justify-center rounded-xl bg-[#F2B705] px-8 text-sm font-bold text-[#0D0D0D] transition-colors hover:bg-[#BF9004] sm:w-auto"
            >
              Cadastrar minha academia
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#585759]/25 py-8 text-center text-xs text-[#585759]">
        FitManager — gestão simples para academias que querem crescer com organização.
      </footer>
    </div>
  )
}
