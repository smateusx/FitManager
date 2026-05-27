'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebase'
import {
  deleteFicha,
  getPerfil,
  insertExercicios,
  insertFicha,
  listAlunosByAcademia,
  listFichasByAcademia,
  replaceExerciciosFicha,
  updateFichaTreino,
} from '@/lib/firestore'
import { Dumbbell, Plus, X, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { InlineFeedback, type InlineFeedbackVariant } from '@/components/ui/inline-feedback'
import { FichaSemanalEditor, EXERCICIO_SEMANA_VAZIO } from '@/components/ficha-semanal-editor'
import { FichaSemanalResumo, FichaSemanalView } from '@/components/ficha-semanal-view'
import {
  exerciciosParaSemana,
  semanaComDiaInicial,
  semanaParaLinhasFirestore,
  type ExercicioComDia,
  type JsWeekday,
  type SemanaTreinoForm,
} from '@/lib/dias-semana-treino'
import { useAuth } from '@/hooks/use-auth'

type Exercicio = ExercicioComDia

type Ficha = {
  id: string
  nome: string
  objetivo: string | null
  aluno_id: string
  criado_em: string
  perfis?: { nome_completo: string | null }
  exercicios?: Exercicio[]
}

type AlunoOption = {
  id: string
  nome_completo: string | null
}

export default function TreinosPage() {
  const { loading: authLoading, isAdmin } = useAuth()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [alunos, setAlunos] = useState<AlunoOption[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [academiaId, setAcademiaId] = useState<string | null>(null)

  // New ficha modal
  const [showModal, setShowModal] = useState(false)
  const [nomeFicha, setNomeFicha] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [alunoSel, setAlunoSel] = useState('')
  const [semana, setSemana] = useState<SemanaTreinoForm>(() => semanaComDiaInicial(EXERCICIO_SEMANA_VAZIO, 1))
  const [diaAtivo, setDiaAtivo] = useState<JsWeekday>(1)
  const [saving, setSaving] = useState(false)
  const [editingFichaId, setEditingFichaId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    nome: string
    aluno: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pageFeedback, setPageFeedback] = useState<{
    variant: InlineFeedbackVariant
    message: string
  } | null>(null)

  const router = useRouter()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const u = getFirebaseAuth().currentUser
    if (!u) {
      router.push('/login')
      return
    }

    const profileDoc = await getPerfil(u.uid)
    if (profileDoc?.academia_id) setAcademiaId(profileDoc.academia_id)
    const aid = profileDoc?.academia_id
    if (!aid) {
      setLoading(false)
      return
    }

    const fichasData = await listFichasByAcademia(aid)
    const alunosRows = await listAlunosByAcademia(aid)
    const alunosData = alunosRows.map((r) => ({ id: r.id, nome_completo: r.nome_completo }))

    setFichas((fichasData as Ficha[]) ?? [])
    setAlunos((alunosData as AlunoOption[]) ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => {
    if (authLoading) return
    queueMicrotask(() => {
      void fetchAll()
    })
  }, [authLoading, fetchAll])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId || !alunoSel) return

    const linhas = semanaParaLinhasFirestore(semana)
    if (linhas.length === 0) {
      setPageFeedback({
        variant: 'warning',
        message: 'Adicione ao menos um exercício em algum dia da semana antes de salvar.',
      })
      return
    }

    setSaving(true)

    try {
      if (editingFichaId) {
        await updateFichaTreino(editingFichaId, {
          nome: nomeFicha,
          objetivo,
          aluno_id: alunoSel,
        })
        await replaceExerciciosFicha(editingFichaId, linhas)
        setPageFeedback({ variant: 'success', message: 'Ficha semanal atualizada com sucesso.' })
      } else {
        const { id: fichaId } = await insertFicha({
          nome: nomeFicha,
          objetivo,
          aluno_id: alunoSel,
          academia_id: academiaId,
        })

        await insertExercicios(
          linhas.map((row) => ({
            ...row,
            ficha_id: fichaId,
          }))
        )
        setPageFeedback({ variant: 'success', message: 'Ficha semanal criada com sucesso.' })
      }

      setShowModal(false)
      resetModal()
      await fetchAll()
    } catch (err) {
      console.error(err)
      setPageFeedback({
        variant: 'error',
        message: 'Não foi possível salvar a ficha. Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isAdmin || !deleteTarget) return
    setDeleting(true)
    try {
      await deleteFicha(deleteTarget.id)
      setDeleteTarget(null)
      setPageFeedback({ variant: 'success', message: 'Ficha excluída com sucesso.' })
      await fetchAll()
    } catch (err) {
      console.error(err)
      setPageFeedback({
        variant: 'error',
        message: 'Não foi possível excluir a ficha. Tente novamente.',
      })
    } finally {
      setDeleting(false)
    }
  }

  const resetModal = () => {
    setEditingFichaId(null)
    setNomeFicha('')
    setObjetivo('')
    setAlunoSel('')
    setSemana(semanaComDiaInicial(EXERCICIO_SEMANA_VAZIO, 1))
    setDiaAtivo(1)
  }

  const openCreateModal = () => {
    resetModal()
    setShowModal(true)
  }

  const openEditModal = (ficha: Ficha) => {
    setEditingFichaId(ficha.id)
    setNomeFicha(ficha.nome)
    setObjetivo(ficha.objetivo ?? '')
    setAlunoSel(ficha.aluno_id)
    setSemana(exerciciosParaSemana(ficha.exercicios ?? []))
    setDiaAtivo(1)
    setShowModal(true)
  }

  return (
    <div className="min-h-0 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 border-b border-[#585759]/30 pb-6 sm:flex-row sm:items-center sm:justify-between sm:pb-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#F2B705] sm:text-3xl">Fichas de Treino</h1>
            <p className="mt-1 text-sm text-[#A6A6A6] sm:text-base">
              Monte a semana completa do aluno, com exercícios por dia.
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            className="w-full shrink-0 bg-[#F2B705] font-bold text-[#0D0D0D] shadow-lg shadow-[#F2B705]/20 hover:bg-[#BF9004] sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova ficha
          </Button>
        </header>

        <main className="mt-8 space-y-4">
          {pageFeedback ? (
            <InlineFeedback
              variant={pageFeedback.variant}
              message={pageFeedback.message}
              onDismiss={() => setPageFeedback(null)}
              autoDismissMs={pageFeedback.variant === 'success' ? 4000 : undefined}
            />
          ) : null}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-[#585759] border-t-[#F2B705] rounded-full animate-spin" />
            </div>
          ) : fichas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="p-5 bg-[#F2B705]/10 rounded-2xl">
                <Dumbbell className="w-10 h-10 text-[#F2B705]" />
              </div>
              <p className="text-white font-semibold text-lg">Nenhuma ficha cadastrada ainda</p>
              <p className="max-w-xs text-sm text-[#A6A6A6]">
                Clique em Nova ficha para montar o primeiro treino de um aluno.
              </p>
            </div>
          ) : (
            fichas.map((ficha) => {
              const isExpanded = expandedId === ficha.id
              return (
                <div key={ficha.id} className="border border-[#585759]/50 rounded-xl overflow-hidden bg-[#0D0D0D]/80 hover:border-[#585759] transition-colors">
                  <button
                    type="button"
                    className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
                    onClick={() => setExpandedId(isExpanded ? null : ficha.id)}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                      <div className="p-2 bg-[#F2B705]/10 rounded-lg">
                        <Dumbbell className="w-5 h-5 text-[#F2B705]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">{ficha.nome}</p>
                        <p className="mt-0.5 text-sm text-[#A6A6A6]">
                          Aluno: <span className="text-white">{ficha.perfis?.nome_completo || 'Sem nome'}</span>
                        </p>
                        <div className="mt-1">
                          <FichaSemanalResumo exercicios={ficha.exercicios ?? []} />
                        </div>
                        {ficha.objetivo ? (
                          <p className="mt-1 text-xs text-[#585759]">{ficha.objetivo}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
                      <span className="text-xs text-[#585759] hidden sm:block">
                        {new Date(ficha.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(ficha)
                        }}
                        className="rounded-lg p-1.5 text-[#585759] transition-colors hover:bg-[#F2B705]/10 hover:text-[#F2B705]"
                        aria-label="Editar ficha"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget({
                              id: ficha.id,
                              nome: ficha.nome,
                              aluno: ficha.perfis?.nome_completo || 'Aluno',
                            })
                          }}
                          className="rounded-lg p-1.5 text-[#585759] transition-colors hover:bg-red-500/10 hover:text-red-500"
                          aria-label="Excluir ficha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-[#A6A6A6]" /> : <ChevronDown className="w-5 h-5 text-[#A6A6A6]" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#585759]/30 p-5">
                      {!ficha.exercicios || ficha.exercicios.length === 0 ? (
                        <p className="py-4 text-center text-sm text-[#585759]">Nenhum exercício nesta ficha.</p>
                      ) : (
                        <FichaSemanalView exercicios={ficha.exercicios} variant="table" />
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </main>
      </div>

      {/* Create Ficha Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-3xl rounded-2xl border border-[#585759] bg-[#0D0D0D] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#585759]/30 flex justify-between items-center sticky top-0 bg-[#0D0D0D] rounded-t-2xl z-10 text-white">
              <h2 className="text-xl font-bold">
                {editingFichaId ? 'Editar ficha de treino' : 'Nova ficha de treino'}
              </h2>
              <button onClick={() => { setShowModal(false); resetModal() }} className="text-[#A6A6A6] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-6 space-y-5">
                {/* Nome e Aluno */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#A6A6A6]">Nome da ficha</Label>
                    <Input value={nomeFicha} onChange={e => setNomeFicha(e.target.value)} required
                      placeholder="Ex.: Plano semanal iniciante"
                      className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A6A6A6]">Aluno</Label>
                    <select value={alunoSel} onChange={e => setAlunoSel(e.target.value)} required
                      className="w-full h-11 px-4 rounded-xl bg-[#0D0D0D] border border-[#585759]/50 text-white focus:border-[#F2B705] outline-none transition-all appearance-none">
                      <option value="">Selecione um aluno...</option>
                      {alunos.map(a => <option key={a.id} value={a.id} className="bg-[#0D0D0D]">{a.nome_completo || 'Sem nome'}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A6A6A6]">Objetivo (opcional)</Label>
                  <Input value={objetivo} onChange={e => setObjetivo(e.target.value)}
                    placeholder="Ex.: hipertrofia, emagrecimento, força..."
                    className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]" />
                </div>

                <FichaSemanalEditor
                  academiaId={academiaId}
                  semana={semana}
                  diaAtivo={diaAtivo}
                  onDiaChange={setDiaAtivo}
                  onSemanaChange={setSemana}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 rounded-b-2xl border-t border-[#585759]/30 bg-[#585759]/5 p-5 sm:flex-row sm:justify-end sm:gap-3">
                <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetModal() }}
                  className="text-[#A6A6A6] hover:text-white">Cancelar</Button>
                <Button type="submit" disabled={saving}
                  className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/20">
                  {saving ? 'Salvando...' : editingFichaId ? 'Salvar alterações' : 'Salvar ficha semanal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmActionDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null)
        }}
        title="Excluir ficha de treino?"
        description={
          deleteTarget ? (
            <>
              <p>
                A ficha <strong className="text-white">{deleteTarget.nome}</strong> do aluno{' '}
                <strong className="text-white">{deleteTarget.aluno}</strong> será removida junto com todos os
                exercícios cadastrados nela.
              </p>
              <p className="mt-2">Esta ação não pode ser desfeita.</p>
            </>
          ) : (
            'Confirme a exclusão da ficha selecionada.'
          )
        }
        confirmLabel="Excluir ficha"
        cancelLabel="Manter ficha"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
