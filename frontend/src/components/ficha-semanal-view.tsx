'use client'

import { useMemo, useState } from 'react'
import {
  DIAS_SEMANA_TREINO,
  groupExerciciosPorDia,
  hojeJsWeekday,
  type ExercicioComDia,
  type JsWeekday,
} from '@/lib/dias-semana-treino'

type FichaSemanalViewProps = {
  exercicios: ExercicioComDia[]
  /** Destaca o dia atual e abre nele por padrão */
  destacarHoje?: boolean
  /** Conteúdo extra por exercício (registro, gráfico etc.) */
  renderExercicioExtra?: (ex: ExercicioComDia, index: number) => React.ReactNode
  variant?: 'cards' | 'table'
}

export function FichaSemanalView({
  exercicios,
  destacarHoje = false,
  renderExercicioExtra,
  variant = 'cards',
}: FichaSemanalViewProps) {
  const hoje = hojeJsWeekday()
  const [diaAtivo, setDiaAtivo] = useState<JsWeekday>(destacarHoje ? hoje : 1)
  const grupos = useMemo(() => groupExerciciosPorDia(exercicios), [exercicios])
  const listaDia = grupos[diaAtivo]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DIAS_SEMANA_TREINO.map((dia) => {
          const count = grupos[dia.js].length
          const ativo = diaAtivo === dia.js
          const ehHoje = destacarHoje && dia.js === hoje
          return (
            <button
              key={dia.js}
              type="button"
              onClick={() => setDiaAtivo(dia.js)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-colors ${
                ativo
                  ? 'border-[#F2B705] bg-[#F2B705]/15 text-[#F2B705]'
                  : 'border-[#585759]/40 bg-[#585759]/10 text-[#A6A6A6] hover:border-[#585759]'
              }`}
            >
              <span className="flex items-center gap-1 text-xs font-bold">
                {dia.short}
                {ehHoje ? (
                  <span className="rounded bg-[#F2B705] px-1 text-[9px] font-black text-[#0D0D0D]">HOJE</span>
                ) : null}
              </span>
              <span className="block text-[10px] opacity-80">
                {count > 0 ? `${count} ex.` : 'Descanso'}
              </span>
            </button>
          )
        })}
      </div>

      {listaDia.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#585759]/35 px-4 py-8 text-center text-sm text-[#585759]">
          {destacarHoje && diaAtivo === hoje
            ? 'Descanso ou treino não cadastrado para hoje.'
            : 'Nenhum exercício cadastrado para este dia.'}
        </p>
      ) : variant === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-[#585759]">
                <th className="pb-3 pr-4">Exercício</th>
                <th className="px-2 pb-3 text-center">Séries</th>
                <th className="px-2 pb-3 text-center">Reps</th>
                <th className="px-2 pb-3 text-center">Carga</th>
                <th className="px-2 pb-3 text-center">Descanso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#585759]/10">
              {listaDia.map((ex, i) => (
                <tr key={ex.id ?? `${diaAtivo}-${i}`} className="text-[#A6A6A6]">
                  <td className="py-2.5 pr-4 font-medium text-white">{ex.nome}</td>
                  <td className="px-2 py-2.5 text-center">{ex.series}</td>
                  <td className="px-2 py-2.5 text-center">{ex.repeticoes}</td>
                  <td className="px-2 py-2.5 text-center font-bold text-[#F2B705]">
                    {ex.carga || 'Sem registro'}
                  </td>
                  <td className="px-2 py-2.5 text-center text-xs">{ex.descanso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {listaDia.map((ex, i) => (
            <div
              key={ex.id ?? `${diaAtivo}-${i}`}
              className="rounded-xl border border-[#585759]/20 bg-[#585759]/10 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F2B705]/20">
                  <span className="text-xs font-bold text-[#F2B705]">{i + 1}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{ex.nome}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md bg-[#585759]/30 px-2 py-1 text-xs text-[#A6A6A6]">
                      {ex.series}x séries
                    </span>
                    <span className="rounded-md bg-[#585759]/30 px-2 py-1 text-xs text-[#A6A6A6]">
                      {ex.repeticoes} reps
                    </span>
                    {ex.carga ? (
                      <span className="rounded-md bg-[#F2B705]/10 px-2 py-1 text-xs text-[#F2B705]">
                        {ex.carga}
                      </span>
                    ) : null}
                    <span className="rounded-md bg-[#585759]/30 px-2 py-1 text-xs text-[#A6A6A6]">
                      {ex.descanso} descanso
                    </span>
                  </div>
                  {renderExercicioExtra?.(ex, i)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function FichaSemanalResumo({ exercicios }: { exercicios: ExercicioComDia[] }) {
  const grupos = useMemo(() => groupExerciciosPorDia(exercicios), [exercicios])
  const diasComTreino = DIAS_SEMANA_TREINO.filter((d) => grupos[d.js].length > 0)

  if (diasComTreino.length === 0) {
    return <span className="text-xs text-[#585759]">Sem exercícios</span>
  }

  return (
    <span className="text-xs text-[#A6A6A6]">
      {diasComTreino.length} dia{diasComTreino.length > 1 ? 's' : ''}:{' '}
      {diasComTreino.map((d) => d.short).join(', ')}
    </span>
  )
}
