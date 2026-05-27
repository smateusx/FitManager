'use client'

import { useRef, type Dispatch, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'
import { Copy, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BibliotecaExerciciosPicker,
  PreencherDaBiblioteca,
} from '@/components/biblioteca-exercicios-picker'
import { useBibliotecaExercicios } from '@/hooks/use-biblioteca-exercicios'
import { normalizarNomeExercicio } from '@/lib/catalogo-exercicios-musculo'
import {
  abrirLinhaPersonalizada,
  DIAS_SEMANA_TREINO,
  inserirExercicioNoDia,
  isExercicioSemanaVazio,
  type ExercicioSemanaForm,
  type JsWeekday,
  type SemanaTreinoForm,
} from '@/lib/dias-semana-treino'

const BLANK: ExercicioSemanaForm = {
  nome: '',
  series: 3,
  repeticoes: '10 a 12',
  carga: '',
  descanso: '60 s',
}

type FichaSemanalEditorProps = {
  academiaId: string | null
  semana: SemanaTreinoForm
  diaAtivo: JsWeekday
  onDiaChange: (dia: JsWeekday) => void
  onSemanaChange: Dispatch<SetStateAction<SemanaTreinoForm>>
}

export function FichaSemanalEditor({
  academiaId,
  semana,
  diaAtivo,
  onDiaChange,
  onSemanaChange,
}: FichaSemanalEditorProps) {
  const biblioteca = useBibliotecaExercicios(academiaId)
  const { catalogo } = biblioteca
  const exerciciosDia = semana[diaAtivo]
  const secaoExerciciosRef = useRef<HTMLDivElement>(null)

  const chaveNomesJaNoDia = exerciciosDia
    .map((ex) => normalizarNomeExercicio(ex.nome))
    .filter(Boolean)
    .sort()
    .join('\0')

  function updateDiaExercicios(
    updater: (lista: ExercicioSemanaForm[]) => ExercicioSemanaForm[],
    dia: JsWeekday = diaAtivo
  ) {
    onSemanaChange((prev) => ({
      ...prev,
      [dia]: updater(prev[dia]),
    }))
  }

  function setDiaExercicios(lista: ExercicioSemanaForm[]) {
    updateDiaExercicios(() => lista)
  }

  function scrollParaExercicios() {
    secaoExerciciosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function focarLinhaExercicio(indice: number) {
    scrollParaExercicios()
    const card = document.getElementById(`exercicio-card-${diaAtivo}-${indice}`)
    const input =
      card?.querySelector<HTMLInputElement>('input[data-slot="input"]') ??
      card?.querySelector<HTMLInputElement>('input')
    if (input) {
      input.focus()
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function addExercicioDaBiblioteca(preset: ExercicioSemanaForm): boolean {
    let duplicado = false
    flushSync(() => {
      updateDiaExercicios((lista) => {
        const result = inserirExercicioNoDia(lista, preset)
        duplicado = !!result.duplicado
        return result.lista
      })
    })
    if (duplicado) return false
    scrollParaExercicios()
    return true
  }

  function handleEscreverPersonalizado() {
    let indice = 0
    flushSync(() => {
      updateDiaExercicios((lista) => {
        const result = abrirLinhaPersonalizada(lista, BLANK)
        indice = result.indice
        return result.lista
      })
    })
    focarLinhaExercicio(indice)
  }

  function addExercicioPersonalizadoExtra() {
    let indice = 0
    flushSync(() => {
      updateDiaExercicios((lista) => {
        const result = abrirLinhaPersonalizada(lista, BLANK)
        indice = result.indice
        return result.lista
      })
    })
    focarLinhaExercicio(indice)
  }

  function removeExercicio(i: number) {
    updateDiaExercicios((lista) => lista.filter((_, idx) => idx !== i))
  }

  function updateExercicio(i: number, field: keyof ExercicioSemanaForm, value: string | number) {
    updateDiaExercicios((lista) =>
      lista.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex))
    )
  }

  function preencherExercicio(i: number, preset: ExercicioSemanaForm) {
    updateDiaExercicios((lista) => {
      const filled = { ...preset, carga: lista[i]?.carga || preset.carga }
      return lista
        .map((ex, idx) => (idx === i ? filled : ex))
        .filter((ex) => !isExercicioSemanaVazio(ex))
    })
  }

  function copiarDe(diaOrigem: JsWeekday) {
    if (diaOrigem === diaAtivo) return
    onSemanaChange((prev) => ({
      ...prev,
      [diaAtivo]: prev[diaOrigem].map((ex) => ({ ...ex })),
    }))
  }

  function limparDia() {
    setDiaExercicios([])
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[#A6A6A6]">Treino por dia da semana</Label>
        <p className="mt-1 text-xs text-[#585759]">
          Selecione o dia e cadastre os exercícios. Dias vazios ficam como descanso ou sem treino.
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {DIAS_SEMANA_TREINO.map((dia) => {
            const count = semana[dia.js].filter((ex) => ex.nome.trim()).length
            const ativo = diaAtivo === dia.js
            return (
              <button
                key={dia.js}
                type="button"
                onClick={() => onDiaChange(dia.js)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-colors ${
                  ativo
                    ? 'border-[#F2B705] bg-[#F2B705]/15 text-[#F2B705]'
                    : 'border-[#585759]/50 bg-[#585759]/10 text-[#A6A6A6] hover:border-[#585759]'
                }`}
              >
                <span className="block text-xs font-bold">{dia.short}</span>
                <span className="block text-[10px] opacity-80">{count > 0 ? `${count} ex.` : 'Vazio'}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#585759]/30 bg-[#585759]/5 px-3 py-2">
        <p className="text-sm font-semibold text-white">
          {DIAS_SEMANA_TREINO.find((d) => d.js === diaAtivo)?.label}
        </p>
        <div className="flex flex-wrap gap-2">
          <select
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              copiarDe(Number(v) as JsWeekday)
              e.target.value = ''
            }}
            className="h-8 rounded-lg border border-[#585759]/50 bg-[#0D0D0D] px-2 text-xs text-[#A6A6A6] outline-none"
            aria-label="Copiar treino de outro dia"
          >
            <option value="">Copiar de...</option>
            {DIAS_SEMANA_TREINO.filter((d) => d.js !== diaAtivo).map((d) => (
              <option key={d.js} value={d.js}>
                {d.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={limparDia}
            className="h-8 text-xs text-[#A6A6A6] hover:text-red-400"
          >
            Limpar dia
          </Button>
        </div>
      </div>

      {/* Exercícios do dia — acima da biblioteca para ficar visível ao escrever personalizado */}
      <div
        ref={secaoExerciciosRef}
        id="secao-exercicios-dia"
        className="scroll-mt-4 rounded-xl border border-[#585759]/40 bg-[#0D0D0D]/40 p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#F2B705]">
            Exercícios do dia
          </span>
          {exerciciosDia.length > 0 ? (
            <button
              type="button"
              onClick={addExercicioPersonalizadoExtra}
              className="flex items-center gap-1 text-sm text-[#F2B705] hover:text-[#BF9004]"
            >
              <Plus className="h-4 w-4" /> Outro personalizado
            </button>
          ) : null}
        </div>

        {exerciciosDia.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#585759]/40 px-4 py-6 text-center">
            <p className="text-sm text-[#A6A6A6]">
              Nenhum exercício neste dia. Escolha na biblioteca abaixo ou clique em{' '}
              <strong className="text-[#F2B705]">Escrever personalizado</strong>.
            </p>
          </div>
        ) : (
          <div className="max-h-[min(40vh,24rem)] space-y-3 overflow-y-auto pr-1">
            {exerciciosDia.map((ex, i) => (
              <div
                key={`${diaAtivo}-${i}`}
                id={`exercicio-card-${diaAtivo}-${i}`}
                className="space-y-3 rounded-xl border border-[#585759]/40 bg-[#585759]/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#F2B705]">
                    Exercício {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExercicio(i)}
                    className="text-[#585759] transition-colors hover:text-red-500"
                    aria-label="Remover exercício"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <PreencherDaBiblioteca
                  catalogo={catalogo}
                  onPreencher={(preset) => preencherExercicio(i, preset)}
                />

                <div className="space-y-1">
                  <Label className="text-xs text-[#585759]">Nome do exercício</Label>
                  <Input
                    id={`exercicio-nome-${diaAtivo}-${i}`}
                    value={ex.nome}
                    onChange={(e) => updateExercicio(i, 'nome', e.target.value)}
                    placeholder="Digite ou edite o nome do exercício"
                    className="border-[#585759] bg-[#0D0D0D] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#585759]">Séries</Label>
                    <Input
                      type="number"
                      min={1}
                      value={ex.series}
                      onChange={(e) => updateExercicio(i, 'series', Number(e.target.value))}
                      className="h-9 border-[#585759] bg-[#0D0D0D] text-sm text-white focus-visible:ring-[#F2B705]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#585759]">Reps</Label>
                    <Input
                      value={ex.repeticoes}
                      onChange={(e) => updateExercicio(i, 'repeticoes', e.target.value)}
                      placeholder="10 a 12"
                      className="h-9 border-[#585759] bg-[#0D0D0D] text-sm text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#585759]">Carga</Label>
                    <Input
                      value={ex.carga}
                      onChange={(e) => updateExercicio(i, 'carga', e.target.value)}
                      placeholder="20 kg"
                      className="h-9 border-[#585759] bg-[#0D0D0D] text-sm text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#585759]">Descanso</Label>
                    <Input
                      value={ex.descanso}
                      onChange={(e) => updateExercicio(i, 'descanso', e.target.value)}
                      placeholder="60 s"
                      className="h-9 border-[#585759] bg-[#0D0D0D] text-sm text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BibliotecaExerciciosPicker
        biblioteca={biblioteca}
        diaAtivoTreino={diaAtivo}
        nomesJaNoDiaTreinoChave={chaveNomesJaNoDia}
        onAdicionar={(ex) => addExercicioDaBiblioteca(ex)}
        onAdicionarPersonalizado={handleEscreverPersonalizado}
      />

      {exerciciosDia.length > 0 ? (
        <p className="flex items-center gap-1 text-[10px] text-[#585759]">
          <Copy className="h-3 w-3" aria-hidden />
          Use copiar de para repetir um dia em outro, como na rotina sugerida.
        </p>
      ) : null}
    </div>
  )
}

export { BLANK as EXERCICIO_SEMANA_VAZIO }
