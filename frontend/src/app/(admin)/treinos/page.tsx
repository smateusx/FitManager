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
import { useAuth } from '@/hooks/use-auth'

type Exercicio = {
  id?: string
  nome: string
  series: number
  repeticoes: string
  carga: string
  descanso: string
}

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

const BLANK_EXERCICIO: Exercicio = { nome: '', series: 3, repeticoes: '10 a 12', carga: '', descanso: '60s' }

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
  const [exercicios, setExercicios] = useState<Exercicio[]>([{ ...BLANK_EXERCICIO }])
  const [saving, setSaving] = useState(false)
  const [editingFichaId, setEditingFichaId] = useState<string | null>(null)

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

  const addExercicio = () => setExercicios(prev => [...prev, { ...BLANK_EXERCICIO }])
  const removeExercicio = (i: number) => setExercicios(prev => prev.filter((_, idx) => idx !== i))
  const updateExercicio = (i: number, field: keyof Exercicio, value: string | number) => {
    setExercicios(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId || !alunoSel) return
    setSaving(true)

    const filtered = exercicios.filter((ex) => ex.nome.trim())

    try {
      if (editingFichaId) {
        await updateFichaTreino(editingFichaId, {
          nome: nomeFicha,
          objetivo,
          aluno_id: alunoSel,
        })
        await replaceExerciciosFicha(
          editingFichaId,
          filtered.map((ex) => ({
            nome: ex.nome,
            series: ex.series,
            repeticoes: ex.repeticoes,
            carga: ex.carga,
            descanso: ex.descanso,
          }))
        )
      } else {
        const { id: fichaId } = await insertFicha({
          nome: nomeFicha,
          objetivo,
          aluno_id: alunoSel,
          academia_id: academiaId,
        })

        const exRows = filtered.map((ex, i) => ({
          nome: ex.nome,
          series: ex.series,
          repeticoes: ex.repeticoes,
          carga: ex.carga,
          descanso: ex.descanso,
          ordem: i,
          ficha_id: fichaId,
        }))

        if (exRows.length > 0) {
          await insertExercicios(exRows)
        }
      }

      setShowModal(false)
      resetModal()
      fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAdmin) return
    if (!confirm('Tem certeza que deseja excluir esta ficha?')) return
    await deleteFicha(id)
    fetchAll()
  }

  const resetModal = () => {
    setEditingFichaId(null)
    setNomeFicha('')
    setObjetivo('')
    setAlunoSel('')
    setExercicios([{ ...BLANK_EXERCICIO }])
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
    setExercicios(
      ficha.exercicios?.length
        ? ficha.exercicios.map((ex) => ({
            nome: ex.nome,
            series: Number(ex.series) || 1,
            repeticoes: String(ex.repeticoes ?? ''),
            carga: String(ex.carga ?? ''),
            descanso: String(ex.descanso ?? ''),
          }))
        : [{ ...BLANK_EXERCICIO }]
    )
    setShowModal(true)
  }

  return (
    <div className="min-h-0 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 border-b border-[#585759]/30 pb-6 sm:flex-row sm:items-center sm:justify-between sm:pb-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#F2B705] sm:text-3xl">Fichas de Treino</h1>
            <p className="mt-1 text-sm text-[#A6A6A6] sm:text-base">Crie e gerencie os treinos dos seus alunos.</p>
          </div>
          <Button
            onClick={openCreateModal}
            className="w-full shrink-0 bg-[#F2B705] font-bold text-[#0D0D0D] shadow-lg shadow-[#F2B705]/20 hover:bg-[#BF9004] sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova ficha
          </Button>
        </header>

        <main className="mt-8 space-y-4">
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
                          {ficha.objetivo && (
                            <span className="mt-1 block text-[#585759] sm:ml-3 sm:mt-0 sm:inline">
                              • {ficha.objetivo}
                            </span>
                          )}
                        </p>
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
                            handleDelete(ficha.id)
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
                        <p className="text-[#585759] text-sm text-center py-4">Nenhum exercício nesta ficha.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-[#585759] uppercase text-xs tracking-wider">
                                <th className="text-left pb-3 pr-4">Exercício</th>
                                <th className="text-center pb-3 px-2">Séries</th>
                                <th className="text-center pb-3 px-2">Reps</th>
                                <th className="text-center pb-3 px-2">Carga</th>
                                <th className="text-center pb-3 px-2">Descanso</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#585759]/20">
                              {(ficha.exercicios ?? []).map((ex, i) => (
                                <tr key={i} className="hover:bg-[#585759]/10 transition-colors">
                                  <td className="py-3 pr-4 text-white font-medium">{ex.nome}</td>
                                  <td className="py-3 px-2 text-center text-[#A6A6A6]">{ex.series}x</td>
                                  <td className="py-3 px-2 text-center text-[#A6A6A6]">{ex.repeticoes}</td>
                                  <td className="py-3 px-2 text-center text-[#A6A6A6]">{ex.carga || 'Sem registro'}</td>
                                  <td className="py-3 px-2 text-center text-[#A6A6A6]">{ex.descanso}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-[#585759] bg-[#0D0D0D] shadow-2xl animate-in zoom-in-95 duration-200">
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
                    <Label className="text-[#A6A6A6]">Nome da Ficha</Label>
                    <Input value={nomeFicha} onChange={e => setNomeFicha(e.target.value)} required
                      placeholder="Ex.: Treino A: peito e tríceps"
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

                {/* Exercícios */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-[#A6A6A6]">Exercícios</Label>
                    <button type="button" onClick={addExercicio}
                      className="flex items-center gap-1 text-sm text-[#F2B705] hover:text-[#BF9004] transition-colors">
                      <Plus className="w-4 h-4" /> Adicionar
                    </button>
                  </div>

                  <div className="space-y-3">
                    {exercicios.map((ex, i) => (
                      <div key={i} className="p-4 border border-[#585759]/40 rounded-xl bg-[#585759]/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[#F2B705] text-xs font-semibold uppercase tracking-wider">Exercício {i + 1}</span>
                          {exercicios.length > 1 && (
                            <button type="button" onClick={() => removeExercicio(i)}
                              className="text-[#585759] hover:text-red-500 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <Input value={ex.nome} onChange={e => updateExercicio(i, 'nome', e.target.value)}
                          placeholder="Nome do exercício" required
                          className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]" />
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-[#585759] text-xs">Séries</Label>
                            <Input type="number" value={ex.series} onChange={e => updateExercicio(i, 'series', Number(e.target.value))} min={1}
                              className="bg-[#0D0D0D] border-[#585759] text-white focus-visible:ring-[#F2B705] h-9 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[#585759] text-xs">Reps</Label>
                            <Input value={ex.repeticoes} onChange={e => updateExercicio(i, 'repeticoes', e.target.value)} placeholder="10 a 12"
                              className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-9 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[#585759] text-xs">Carga</Label>
                            <Input value={ex.carga} onChange={e => updateExercicio(i, 'carga', e.target.value)} placeholder="20kg"
                              className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-9 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[#585759] text-xs">Descanso</Label>
                            <Input value={ex.descanso} onChange={e => updateExercicio(i, 'descanso', e.target.value)} placeholder="60s"
                              className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705] h-9 text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 rounded-b-2xl border-t border-[#585759]/30 bg-[#585759]/5 p-5 sm:flex-row sm:justify-end sm:gap-3">
                <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetModal() }}
                  className="text-[#A6A6A6] hover:text-white">Cancelar</Button>
                <Button type="submit" disabled={saving}
                  className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/20">
                  {saving ? 'Salvando...' : 'Salvar Ficha'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
