'use client'

import { useEffect, useState } from 'react'
import { Check, Pencil, PenLine, Plus, Settings2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { InlineFeedback, type InlineFeedbackVariant } from '@/components/ui/inline-feedback'
import {
  GRUPOS_MUSCULARES,
  presetParaForm,
  type CatalogoExercicios,
  type ExercicioPreset,
  type GrupoMuscular,
} from '@/lib/catalogo-exercicios-musculo'
import type { ExercicioSemanaForm } from '@/lib/dias-semana-treino'
import type { useBibliotecaExercicios } from '@/hooks/use-biblioteca-exercicios'

const PRESET_VAZIO: ExercicioPreset = {
  nome: '',
  series: 3,
  repeticoes: '10 a 12',
  descanso: '60 s',
}

type BibliotecaExerciciosPickerProps = {
  biblioteca: ReturnType<typeof useBibliotecaExercicios>
  onAdicionar: (exercicio: ExercicioSemanaForm) => void
  onAdicionarPersonalizado: () => void
}

export function BibliotecaExerciciosPicker({
  biblioteca,
  onAdicionar,
  onAdicionarPersonalizado,
}: BibliotecaExerciciosPickerProps) {
  const { catalogo, loading, saving, adicionarNaLista, removerDaLista, atualizarNaLista } =
    biblioteca

  const [grupoAtivo, setGrupoAtivo] = useState<GrupoMuscular>('peito')
  const [modoEdicao, setModoEdicao] = useState(false)
  const [feedback, setFeedback] = useState<{ variant: InlineFeedbackVariant; message: string } | null>(
    null
  )
  const [ultimoAdicionadoAoDia, setUltimoAdicionadoAoDia] = useState<string | null>(null)
  const [novoPreset, setNovoPreset] = useState<ExercicioPreset>({ ...PRESET_VAZIO })
  const [editandoNome, setEditandoNome] = useState<string | null>(null)
  const [editPreset, setEditPreset] = useState<ExercicioPreset>({ ...PRESET_VAZIO })
  const [removerTarget, setRemoverTarget] = useState<{ grupo: GrupoMuscular; nome: string } | null>(
    null
  )
  const [removendo, setRemovendo] = useState(false)

  const lista = catalogo[grupoAtivo]

  useEffect(() => {
    if (!ultimoAdicionadoAoDia) return
    const t = window.setTimeout(() => setUltimoAdicionadoAoDia(null), 2200)
    return () => window.clearTimeout(t)
  }, [ultimoAdicionadoAoDia])

  function mostrarFeedback(variant: InlineFeedbackVariant, message: string, autoDismiss = true) {
    setFeedback({ variant, message })
    if (autoDismiss && variant === 'success') {
      window.setTimeout(() => setFeedback(null), 3500)
    }
  }

  async function handleAdicionarAoDia(preset: ExercicioPreset) {
    if (modoEdicao) return
    onAdicionar(presetParaForm(preset))
    setUltimoAdicionadoAoDia(preset.nome)
    mostrarFeedback('success', `${preset.nome}, adicionado com sucesso`)
  }

  async function handleIncluirNaLista(e: React.FormEvent) {
    e.preventDefault()
    const result = await adicionarNaLista(grupoAtivo, novoPreset)
    if (!result.ok) {
      mostrarFeedback('warning', result.erro, false)
      return
    }
    setNovoPreset({ ...PRESET_VAZIO })
    mostrarFeedback('success', `${result.nome}, incluído na biblioteca`)
  }

  async function handleSalvarEdicao(nomeOriginal: string) {
    const result = await atualizarNaLista(grupoAtivo, nomeOriginal, editPreset)
    if (!result.ok) {
      mostrarFeedback('warning', result.erro, false)
      return
    }
    setEditandoNome(null)
    mostrarFeedback('success', `${result.nome}, atualizado na biblioteca`)
  }

  async function handleConfirmarRemocao() {
    if (!removerTarget) return
    setRemovendo(true)
    try {
      const nome = await removerDaLista(removerTarget.grupo, removerTarget.nome)
      setRemoverTarget(null)
      mostrarFeedback('success', `${nome}, removido da biblioteca`)
    } catch {
      mostrarFeedback('error', 'Não foi possível remover o exercício. Tente novamente.', false)
    } finally {
      setRemovendo(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#585759]/40 bg-[#585759]/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Label className="text-[#A6A6A6]">Biblioteca de exercícios</Label>
          <p className="mt-1 text-xs text-[#585759]">
            {modoEdicao
              ? 'Edite a lista da academia: inclua, altere ou remova exercícios que aparecem nas sugestões.'
              : 'Escolha o grupo muscular e clique em um exercício para adicionar ao dia.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={modoEdicao ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setModoEdicao((v) => !v)
              setEditandoNome(null)
            }}
            className={
              modoEdicao
                ? 'bg-[#F2B705] text-[#0D0D0D] hover:bg-[#BF9004]'
                : 'border-[#585759] text-[#A6A6A6]'
            }
          >
            <Settings2 className="mr-1 h-3.5 w-3.5" />
            {modoEdicao ? 'Concluir edição' : 'Editar lista'}
          </Button>
          {!modoEdicao ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAdicionarPersonalizado}
              className="border-[#585759] text-[#F2B705] hover:bg-[#F2B705]/10"
            >
              <PenLine className="mr-1 h-3.5 w-3.5" />
              Escrever personalizado
            </Button>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <InlineFeedback
          variant={feedback.variant}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
          autoDismissMs={feedback.variant === 'success' ? 3500 : undefined}
          className="mt-3"
        />
      ) : null}

      {loading ? (
        <p className="mt-4 text-center text-sm text-[#585759]">Carregando biblioteca...</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {GRUPOS_MUSCULARES.map((grupo) => {
              const ativo = grupoAtivo === grupo.id
              return (
                <button
                  key={grupo.id}
                  type="button"
                  onClick={() => {
                    setGrupoAtivo(grupo.id)
                    setEditandoNome(null)
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    ativo
                      ? 'border-[#F2B705] bg-[#F2B705]/15 text-[#F2B705]'
                      : 'border-[#585759]/50 bg-[#0D0D0D] text-[#A6A6A6] hover:border-[#585759]'
                  }`}
                >
                  {grupo.label}
                  <span className="ml-1 opacity-70">({catalogo[grupo.id].length})</span>
                </button>
              )
            })}
          </div>

          <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {lista.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#585759]/35 px-4 py-6 text-center text-sm text-[#585759]">
                Nenhum exercício neste grupo. Inclua um abaixo.
              </p>
            ) : (
              lista.map((preset) => {
                const adicionadoAgora = ultimoAdicionadoAoDia === preset.nome
                const editando = editandoNome === preset.nome

                if (modoEdicao && editando) {
                  return (
                    <div
                      key={preset.nome}
                      className="space-y-2 rounded-lg border border-[#F2B705]/40 bg-[#0D0D0D]/80 p-3"
                    >
                      <Input
                        value={editPreset.nome}
                        onChange={(e) => setEditPreset((p) => ({ ...p, nome: e.target.value }))}
                        placeholder="Nome do exercício"
                        className="border-[#585759] bg-[#0D0D0D] text-sm text-white"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={editPreset.series}
                          onChange={(e) =>
                            setEditPreset((p) => ({ ...p, series: Number(e.target.value) }))
                          }
                          className="h-9 border-[#585759] bg-[#0D0D0D] text-sm text-white"
                          aria-label="Séries"
                        />
                        <Input
                          value={editPreset.repeticoes}
                          onChange={(e) =>
                            setEditPreset((p) => ({ ...p, repeticoes: e.target.value }))
                          }
                          placeholder="Reps"
                          className="h-9 border-[#585759] bg-[#0D0D0D] text-sm text-white"
                        />
                        <Input
                          value={editPreset.descanso}
                          onChange={(e) =>
                            setEditPreset((p) => ({ ...p, descanso: e.target.value }))
                          }
                          placeholder="Descanso"
                          className="h-9 border-[#585759] bg-[#0D0D0D] text-sm text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={saving}
                          onClick={() => handleSalvarEdicao(preset.nome)}
                          className="bg-[#F2B705] text-[#0D0D0D] hover:bg-[#BF9004]"
                        >
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditandoNome(null)}
                          className="text-[#A6A6A6]"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={preset.nome}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                      adicionadoAgora
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-[#585759]/30 bg-[#0D0D0D]/60'
                    }`}
                  >
                    {modoEdicao ? (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white">{preset.nome}</p>
                          <p className="text-[10px] text-[#585759]">
                            {preset.series}x · {preset.repeticoes} · {preset.descanso}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoNome(preset.nome)
                            setEditPreset({ ...preset })
                          }}
                          className="rounded p-1 text-[#585759] hover:text-[#F2B705]"
                          aria-label={`Editar ${preset.nome}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemoverTarget({ grupo: grupoAtivo, nome: preset.nome })}
                          className="rounded p-1 text-[#585759] hover:text-red-400"
                          aria-label={`Remover ${preset.nome}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAdicionarAoDia(preset)}
                        className="flex w-full items-center justify-between gap-3 text-left hover:opacity-90"
                      >
                        <span className="min-w-0 flex-1 text-sm text-white">{preset.nome}</span>
                        <span className="shrink-0 text-[10px] text-[#585759]">
                          {preset.series}x · {preset.repeticoes}
                        </span>
                        {adicionadoAgora ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                        ) : (
                          <Plus className="h-3.5 w-3.5 shrink-0 text-[#F2B705]" aria-hidden />
                        )}
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {modoEdicao ? (
            <form
              onSubmit={handleIncluirNaLista}
              className="mt-4 space-y-3 rounded-xl border border-dashed border-[#585759]/40 p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F2B705]">
                Incluir exercício na lista
              </p>
              <Input
                value={novoPreset.nome}
                onChange={(e) => setNovoPreset((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Nome do exercício"
                required
                className="border-[#585759] bg-[#0D0D0D] text-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min={1}
                  value={novoPreset.series}
                  onChange={(e) => setNovoPreset((p) => ({ ...p, series: Number(e.target.value) }))}
                  className="h-9 border-[#585759] bg-[#0D0D0D] text-sm text-white"
                  aria-label="Séries"
                />
                <Input
                  value={novoPreset.repeticoes}
                  onChange={(e) => setNovoPreset((p) => ({ ...p, repeticoes: e.target.value }))}
                  placeholder="Reps"
                  className="h-9 border-[#585759] bg-[#0D0D0D] text-sm text-white"
                />
                <Input
                  value={novoPreset.descanso}
                  onChange={(e) => setNovoPreset((p) => ({ ...p, descanso: e.target.value }))}
                  placeholder="Descanso"
                  className="h-9 border-[#585759] bg-[#0D0D0D] text-sm text-white"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={saving || !novoPreset.nome.trim()}
                className="bg-[#F2B705] text-[#0D0D0D] hover:bg-[#BF9004]"
              >
                <Plus className="mr-1 h-4 w-4" />
                Incluir na biblioteca
              </Button>
            </form>
          ) : null}
        </>
      )}

      <ConfirmActionDialog
        open={!!removerTarget}
        onOpenChange={(open) => {
          if (!open && !removendo) setRemoverTarget(null)
        }}
        title="Remover exercício da biblioteca?"
        description={
          removerTarget ? (
            <>
              <p>
                <strong className="text-white">{removerTarget.nome}</strong> será removido das
                sugestões desta academia.
              </p>
              <p className="mt-2 text-sm text-[#A6A6A6]">
                Fichas de treino já salvas não são alteradas.
              </p>
            </>
          ) : null
        }
        confirmLabel="Remover da lista"
        cancelLabel="Manter na lista"
        destructive
        loading={removendo}
        onConfirm={handleConfirmarRemocao}
      />
    </div>
  )
}

type PreencherDaBibliotecaProps = {
  catalogo: CatalogoExercicios
  onPreencher: (exercicio: ExercicioSemanaForm) => void
}

export function PreencherDaBiblioteca({ catalogo, onPreencher }: PreencherDaBibliotecaProps) {
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const value = e.target.value
        if (!value) return
        const [grupo, ...nomeParts] = value.split('::')
        const nome = nomeParts.join('::')
        const preset = catalogo[grupo as GrupoMuscular]?.find((p) => p.nome === nome)
        if (preset) onPreencher(presetParaForm(preset))
        e.target.value = ''
      }}
      className="h-8 w-full rounded-lg border border-[#585759]/40 bg-[#0D0D0D] px-2 text-xs text-[#A6A6A6] outline-none focus:border-[#F2B705]"
      aria-label="Preencher exercício da biblioteca"
    >
      <option value="">Preencher da biblioteca (opcional)</option>
      {GRUPOS_MUSCULARES.map((grupo) => (
        <optgroup key={grupo.id} label={grupo.label}>
          {catalogo[grupo.id].map((preset) => (
            <option key={preset.nome} value={`${grupo.id}::${preset.nome}`}>
              {preset.nome}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
