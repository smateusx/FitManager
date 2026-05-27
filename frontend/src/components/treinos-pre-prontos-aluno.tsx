'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'
import {
  ROTINA_SEMANA_INICIANTE,
  treinoPreProntoParaData,
  treinoPreProntoPorWeekday,
} from '@/lib/treinos-pre-prontos-iniciante'
import { TreinoContextBanner } from '@/components/treino-context-banner'

const DIAS_SEMANA_CURTO = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const

type TreinosPreProntosContext = 'portal' | 'admin'

type TreinosPreProntosAlunoProps = {
  /** portal = texto para o aluno; admin = texto para recepção e dono */
  context?: TreinosPreProntosContext
}

export function TreinosPreProntosAluno({ context = 'portal' }: TreinosPreProntosAlunoProps) {
  const [semCompleta, setSemCompleta] = useState(false)
  const agora = useMemo(() => new Date(), [])
  const diaJs = agora.getDay()
  const treinoHoje = useMemo(() => treinoPreProntoParaData(agora), [agora])

  const labelHoje = DIAS_SEMANA_CURTO[diaJs] ?? ''

  return (
    <section className="mb-8 rounded-2xl border border-[#F2B705]/25 bg-[#F2B705]/5 p-5 sm:p-6">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2B705]/20 text-[#F2B705]">
          <CalendarDays className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white">Treinos prontos para iniciantes</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#A6A6A6]">
            {context === 'admin' ? (
              <>
                Mesma sugestão que o aluno vê enquanto não há ficha oficial. Segunda a sábado, sete exercícios por
                treino. Some automaticamente após cadastrar a ficha na gestão de treinos.
              </>
            ) : (
              <>
                Sugestão automática enquanto a academia ainda não cadastrou sua ficha. Quando houver treino oficial,
                ele substitui esta tela.
              </>
            )}
          </p>
        </div>
      </div>

      <TreinoContextBanner variant="sugerido" className="mt-4" />

      {treinoHoje ? (
        <div className="mt-5 rounded-xl border border-[#585759]/40 bg-[#0D0D0D]/80 p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#F2B705]">
            Hoje ({labelHoje})
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">{treinoHoje.titulo}</h3>
          <p className="mt-1 text-sm text-[#A6A6A6]">{treinoHoje.foco}</p>
          <ol className="mt-4 space-y-3">
            {treinoHoje.exercicios.map((ex, i) => (
              <li key={ex.nome} className="rounded-lg border border-[#585759]/25 bg-[#585759]/10 px-3 py-2.5 sm:px-4">
                <p className="font-semibold text-white">
                  {i + 1}. {ex.nome}
                </p>
                <p className="mt-1 text-xs text-[#A6A6A6]">
                  {ex.series} séries, {ex.repeticoes} repetições, descanso {ex.descanso}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-[#585759]/40 bg-[#0D0D0D]/60 px-4 py-5 text-center">
          <p className="text-sm text-[#A6A6A6]">
            No domingo este cronograma prevê descanso ou atividade leve, conforme orientação da sua academia.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setSemCompleta((v) => !v)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#585759]/50 py-3 text-sm font-semibold text-[#F2B705] transition-colors hover:bg-[#585759]/15 sm:inline-flex sm:w-auto sm:px-5"
      >
        {semCompleta ? (
          <>
            Ocultar semana completa <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
          </>
        ) : (
          <>
            Ver segunda a sábado <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          </>
        )}
      </button>

      {semCompleta ? (
        <div className="mt-4 space-y-3">
          {ROTINA_SEMANA_INICIANTE.map((dia) => {
            const t = treinoPreProntoPorWeekday(dia.jsWeekday)
            if (!t) return null
            const ehHoje = diaJs === dia.jsWeekday
            return (
              <details
                key={dia.label}
                className="group rounded-xl border border-[#585759]/35 bg-[#0D0D0D]/70 open:border-[#F2B705]/30"
                open={ehHoje}
              >
                <summary className="cursor-pointer list-none px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-white">{dia.label}</span>
                    <span className="text-xs font-medium text-[#F2B705]">{t.titulo}</span>
                  </div>
                  {dia.quandoRepete ? (
                    <p className="mt-1 text-xs text-[#585759]">{dia.quandoRepete}</p>
                  ) : null}
                </summary>
                <div className="border-t border-[#585759]/25 px-4 pb-4 pt-3">
                  <ol className="space-y-2">
                    {t.exercicios.map((ex, i) => (
                      <li key={`${dia.label}-${ex.nome}`} className="text-sm">
                        <span className="font-medium text-white">
                          {i + 1}. {ex.nome}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#A6A6A6]">
                          {ex.series} séries, {ex.repeticoes} repetições, descanso {ex.descanso}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
