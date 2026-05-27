'use client'

import { useState } from 'react'
import { Plus, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  CATALOGO_EXERCICIOS,
  GRUPOS_MUSCULARES,
  presetParaForm,
  type GrupoMuscular,
} from '@/lib/catalogo-exercicios-musculo'
import type { ExercicioSemanaForm } from '@/lib/dias-semana-treino'

type BibliotecaExerciciosPickerProps = {
  onAdicionar: (exercicio: ExercicioSemanaForm) => void
  onAdicionarPersonalizado: () => void
  compact?: boolean
}

export function BibliotecaExerciciosPicker({
  onAdicionar,
  onAdicionarPersonalizado,
  compact = false,
}: BibliotecaExerciciosPickerProps) {
  const [grupoAtivo, setGrupoAtivo] = useState<GrupoMuscular>('peito')
  const lista = CATALOGO_EXERCICIOS[grupoAtivo]

  return (
    <div
      className={`rounded-xl border border-[#585759]/40 bg-[#585759]/5 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Label className="text-[#A6A6A6]">Biblioteca de exercícios</Label>
          <p className="mt-1 text-xs text-[#585759]">
            Escolha o grupo muscular e clique em um exercício. Você pode editar tudo depois ou escrever um
            personalizado.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdicionarPersonalizado}
          className="shrink-0 border-[#585759] text-[#F2B705] hover:bg-[#F2B705]/10"
        >
          <PenLine className="mr-1 h-3.5 w-3.5" />
          Escrever personalizado
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {GRUPOS_MUSCULARES.map((grupo) => {
          const ativo = grupoAtivo === grupo.id
          return (
            <button
              key={grupo.id}
              type="button"
              onClick={() => setGrupoAtivo(grupo.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                ativo
                  ? 'border-[#F2B705] bg-[#F2B705]/15 text-[#F2B705]'
                  : 'border-[#585759]/50 bg-[#0D0D0D] text-[#A6A6A6] hover:border-[#585759]'
              }`}
            >
              {grupo.label}
            </button>
          )
        })}
      </div>

      <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto pr-1">
        {lista.map((preset) => (
          <button
            key={preset.nome}
            type="button"
            onClick={() => onAdicionar(presetParaForm(preset))}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#585759]/30 bg-[#0D0D0D]/60 px-3 py-2 text-left transition-colors hover:border-[#F2B705]/40 hover:bg-[#F2B705]/5"
          >
            <span className="min-w-0 flex-1 text-sm text-white">{preset.nome}</span>
            <span className="shrink-0 text-[10px] text-[#585759]">
              {preset.series}x · {preset.repeticoes}
            </span>
            <Plus className="h-3.5 w-3.5 shrink-0 text-[#F2B705]" aria-hidden />
          </button>
        ))}
      </div>
    </div>
  )
}

type PreencherDaBibliotecaProps = {
  onPreencher: (exercicio: ExercicioSemanaForm) => void
}

/** Select opcional dentro de cada linha para preencher campos a partir da biblioteca. */
export function PreencherDaBiblioteca({ onPreencher }: PreencherDaBibliotecaProps) {
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const value = e.target.value
        if (!value) return
        const [grupo, ...nomeParts] = value.split('::')
        const nome = nomeParts.join('::')
        const preset = CATALOGO_EXERCICIOS[grupo as GrupoMuscular]?.find((p) => p.nome === nome)
        if (preset) onPreencher(presetParaForm(preset))
        e.target.value = ''
      }}
      className="h-8 w-full rounded-lg border border-[#585759]/40 bg-[#0D0D0D] px-2 text-xs text-[#A6A6A6] outline-none focus:border-[#F2B705]"
      aria-label="Preencher exercício da biblioteca"
    >
      <option value="">Preencher da biblioteca (opcional)</option>
      {GRUPOS_MUSCULARES.map((grupo) => (
        <optgroup key={grupo.id} label={grupo.label}>
          {CATALOGO_EXERCICIOS[grupo.id].map((preset) => (
            <option key={preset.nome} value={`${grupo.id}::${preset.nome}`}>
              {preset.nome}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
