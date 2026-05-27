'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Pencil, PenLine, Plus, Settings2, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { InlineFeedback, type InlineFeedbackVariant } from '@/components/ui/inline-feedback'
import {
  deduplicarGrupo,
  exercicioExisteNoGrupo,
  GRUPOS_MUSCULARES,
  normalizarNomeExercicio,
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
  diaAtivoTreino: number
  /** Chave serializada dos nomes já presentes em "Exercícios do dia". */
  nomesJaNoDiaTreinoChave: string
  onAdicionar: (exercicio: ExercicioSemanaForm) => boolean
  onAdicionarPersonalizado: () => void
}

export function BibliotecaExerciciosPicker({
  biblioteca,
  diaAtivoTreino,
  nomesJaNoDiaTreinoChave,
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
  const [mostrarFormInclusao, setMostrarFormInclusao] = useState(false)
  const [incluindoNaLista, setIncluindoNaLista] = useState(false)
  const [pendentesNoDia, setPendentesNoDia] = useState<ReadonlySet<string>>(() => new Set())

  useEffect(() => {
    setPendentesNoDia(new Set())
  }, [diaAtivoTreino])

  const nomesJaNoDiaTreino = useMemo(() => {
    const nomes = new Set<string>()
    if (!nomesJaNoDiaTreinoChave) return nomes
    for (const chave of nomesJaNoDiaTreinoChave.split('\0')) {
      if (chave) nomes.add(chave)
    }
    return nomes
  }, [nomesJaNoDiaTreinoChave])

  const listaCatalogoGrupo = deduplicarGrupo(catalogo[grupoAtivo])

  useEffect(() => {
    setPendentesNoDia((prev) => {
      if (prev.size === 0) return prev
      const next = new Set<string>()
      for (const chave of prev) {
        if (!nomesJaNoDiaTreino.has(chave)) next.add(chave)
      }
      return next
    })
  }, [nomesJaNoDiaTreino])

  const ocultosNaListaBiblioteca = useMemo(() => {
    const ocultos = new Set(nomesJaNoDiaTreino)
    for (const chave of pendentesNoDia) ocultos.add(chave)
    return ocultos
  }, [nomesJaNoDiaTreino, pendentesNoDia])

  /** Lista rolável da biblioteca (botão "Adicionar ao dia") — oculta o que já está no treino do dia. */
  const listaBibliotecaVisivel = modoEdicao
    ? listaCatalogoGrupo
    : listaCatalogoGrupo.filter(
        (preset) => !ocultosNaListaBiblioteca.has(normalizarNomeExercicio(preset.nome))
      )
  const grupoLabel = GRUPOS_MUSCULARES.find((g) => g.id === grupoAtivo)?.label ?? 'Grupo'

  function contagemGrupo(grupo: GrupoMuscular): number {
    const total = deduplicarGrupo(catalogo[grupo]).length
    if (modoEdicao) return total
    return deduplicarGrupo(catalogo[grupo]).filter(
      (preset) => !ocultosNaListaBiblioteca.has(normalizarNomeExercicio(preset.nome))
    ).length
  }
  const nomeNovoTrim = novoPreset.nome.trim()
  const jaExisteNaLista =
    nomeNovoTrim.length > 0 && exercicioExisteNoGrupo(listaCatalogoGrupo, nomeNovoTrim)

  useEffect(() => {
    if (!ultimoAdicionadoAoDia) return
    const t = window.setTimeout(() => setUltimoAdicionadoAoDia(null), 2200)
    return () => window.clearTimeout(t)
  }, [ultimoAdicionadoAoDia])

  function mostrarFeedback(variant: InlineFeedbackVariant, message: string) {
    setFeedback({ variant, message })
  }

  function handleAdicionarAoDia(preset: ExercicioPreset) {
    if (modoEdicao) return
    const chave = normalizarNomeExercicio(preset.nome)
    if (!chave || ocultosNaListaBiblioteca.has(chave)) {
      mostrarFeedback('warning', `${preset.nome}, já está neste dia.`)
      return
    }
    setPendentesNoDia((prev) => new Set(prev).add(chave))
    const adicionado = onAdicionar(presetParaForm(preset))
    if (!adicionado) {
      setPendentesNoDia((prev) => {
        const next = new Set(prev)
        next.delete(chave)
        return next
      })
      mostrarFeedback('warning', `${preset.nome}, já está neste dia.`)
      return
    }
    setUltimoAdicionadoAoDia(preset.nome)
    mostrarFeedback('success', `${preset.nome}, adicionado com sucesso`)
  }

  async function handleIncluirNaLista(e: React.FormEvent) {
    e.preventDefault()
    if (incluindoNaLista || saving) return

    if (jaExisteNaLista) {
      mostrarFeedback('warning', `${nomeNovoTrim}, já foi adicionado à lista de ${grupoLabel}.`)
      return
    }

    setIncluindoNaLista(true)
    try {
      const result = await adicionarNaLista(grupoAtivo, novoPreset)
      if (!result.ok) {
        mostrarFeedback(
          'warning',
          result.duplicado
            ? `${nomeNovoTrim || result.nome || 'Este exercício'}, já foi adicionado à lista de ${grupoLabel}.`
            : result.erro
        )
        return
      }
      setNovoPreset({ ...PRESET_VAZIO })
      setMostrarFormInclusao(false)
      mostrarFeedback('success', `${result.nome}, incluído na lista de ${grupoLabel}`)
    } finally {
      setIncluindoNaLista(false)
    }
  }

  async function handleSalvarEdicao(nomeOriginal: string) {
    const result = await atualizarNaLista(grupoAtivo, nomeOriginal, editPreset)
    if (!result.ok) {
      mostrarFeedback('warning', result.erro)
      return
    }
    setEditandoNome(null)
    mostrarFeedback('success', `${result.nome}, atualizado na lista`)
  }

  async function handleConfirmarRemocao() {
    if (!removerTarget) return
    setRemovendo(true)
    try {
      const nome = await removerDaLista(removerTarget.grupo, removerTarget.nome)
      setRemoverTarget(null)
      mostrarFeedback('success', `${nome}, removido da lista`)
    } catch {
      mostrarFeedback('error', 'Não foi possível remover o exercício. Tente novamente.')
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
              ? 'Modo edição: inclua, altere ou remova exercícios da lista da academia.'
              : 'Lista abaixo: clique em Adicionar ao dia. Exercícios já no treino deste dia somem da lista.'}
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
              setMostrarFormInclusao(false)
              setNovoPreset({ ...PRESET_VAZIO })
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
              className="shrink-0 border-[#585759] text-[#F2B705] hover:bg-[#F2B705]/10"
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
            {GRUPOS_MUSCULARES.map((grupo) => (
              <button
                key={grupo.id}
                type="button"
                onClick={() => {
                  setGrupoAtivo(grupo.id)
                  setEditandoNome(null)
                  setMostrarFormInclusao(false)
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  grupoAtivo === grupo.id
                    ? 'border-[#F2B705] bg-[#F2B705]/15 text-[#F2B705]'
                    : 'border-[#585759]/50 bg-[#0D0D0D] text-[#A6A6A6] hover:border-[#585759]'
                }`}
              >
                {grupo.label}
                <span className="ml-1 opacity-70">({contagemGrupo(grupo.id)})</span>
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {listaBibliotecaVisivel.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#585759]/35 px-4 py-6 text-center text-sm text-[#585759]">
                {!modoEdicao && listaCatalogoGrupo.length > 0
                  ? `Todos os exercícios de ${grupoLabel} já foram adicionados a este dia.`
                  : `Nenhum exercício em ${grupoLabel}. Use o formulário abaixo para incluir.`}
              </p>
            ) : (
              listaBibliotecaVisivel.map((preset) => {
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
                          Salvar alteração
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
                    className={`rounded-lg border px-3 py-2 transition-colors ${
                      adicionadoAgora
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-[#585759]/30 bg-[#0D0D0D]/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white">{preset.nome}</p>
                        <p className="text-[10px] text-[#585759]">
                          {preset.series}x · {preset.repeticoes} · {preset.descanso}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAdicionarAoDia(preset)}
                        disabled={modoEdicao}
                        className="h-8 shrink-0 bg-[#F2B705] px-2 text-[10px] font-bold text-[#0D0D0D] hover:bg-[#BF9004] disabled:opacity-40 sm:text-xs"
                      >
                        {adicionadoAgora ? (
                          <Check className="mr-1 h-3.5 w-3.5" />
                        ) : (
                          <Plus className="mr-1 h-3.5 w-3.5" />
                        )}
                        Adicionar ao dia
                      </Button>
                      {modoEdicao ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditandoNome(preset.nome)
                              setEditPreset({ ...preset })
                            }}
                            className="rounded p-1.5 text-[#585759] hover:bg-[#585759]/20 hover:text-[#F2B705]"
                            aria-label={`Editar ${preset.nome} na lista`}
                            title="Editar na lista"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoverTarget({ grupo: grupoAtivo, nome: preset.nome })}
                            className="rounded p-1.5 text-[#585759] hover:bg-red-500/10 hover:text-red-400"
                            aria-label={`Remover ${preset.nome} da lista`}
                            title="Remover da lista"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {modoEdicao ? (
            <div className="mt-4">
              {!mostrarFormInclusao ? (
                <button
                  type="button"
                  onClick={() => setMostrarFormInclusao(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#F2B705]/40 bg-[#F2B705]/5 px-4 py-3 text-sm font-semibold text-[#F2B705] transition-colors hover:border-[#F2B705]/60 hover:bg-[#F2B705]/10"
                  aria-label={`Adicionar exercício à lista de ${grupoLabel}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2B705]/20">
                    <Plus className="h-4 w-4" />
                  </span>
                  Adicionar exercício à lista de {grupoLabel}
                </button>
              ) : (
                <form
                  onSubmit={handleIncluirNaLista}
                  className="space-y-3 rounded-xl border border-dashed border-[#F2B705]/30 bg-[#F2B705]/5 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#F2B705]">
                      Adicionar exercício à lista de {grupoLabel}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarFormInclusao(false)
                        setNovoPreset({ ...PRESET_VAZIO })
                      }}
                      className="rounded p-1 text-[#585759] hover:text-white"
                      aria-label="Fechar formulário"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Input
                    value={novoPreset.nome}
                    onChange={(e) => setNovoPreset((p) => ({ ...p, nome: e.target.value }))}
                    placeholder="Nome do exercício"
                    required
                    autoFocus
                    aria-invalid={jaExisteNaLista}
                    className={`border-[#585759] bg-[#0D0D0D] text-white ${
                      jaExisteNaLista ? 'border-amber-500/60 ring-1 ring-amber-500/30' : ''
                    }`}
                  />
                  {jaExisteNaLista ? (
                    <InlineFeedback
                      variant="warning"
                      message={`${nomeNovoTrim}, já foi adicionado à lista de ${grupoLabel}.`}
                      className="text-xs"
                    />
                  ) : null}
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
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={saving || incluindoNaLista || !nomeNovoTrim || jaExisteNaLista}
                      className="bg-[#F2B705] text-[#0D0D0D] hover:bg-[#BF9004]"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {incluindoNaLista ? 'Salvando...' : 'Adicionar à lista'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setMostrarFormInclusao(false)
                        setNovoPreset({ ...PRESET_VAZIO })
                      }}
                      className="text-[#A6A6A6]"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : null}
        </>
      )}

      <ConfirmActionDialog
        open={!!removerTarget}
        onOpenChange={(open) => {
          if (!open && !removendo) setRemoverTarget(null)
        }}
        title="Remover exercício da lista?"
        description={
          removerTarget ? (
            <>
              <p>
                <strong className="text-white">{removerTarget.nome}</strong> será removido da lista de
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
