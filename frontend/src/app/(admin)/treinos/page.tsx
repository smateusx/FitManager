'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Dumbbell, Plus, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

const BLANK_EXERCICIO: Exercicio = { nome: '', series: 3, repeticoes: '10-12', carga: '', descanso: '60s' }

export default function TreinosPage() {
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

  const router = useRouter()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { data: profile } = await supabase.from('perfis').select('academia_id').eq('id', session.user.id).single()
    if (profile) setAcademiaId(profile.academia_id)

    const { data: fichasData } = await supabase
      .from('fichas_treino')
      .select('*, perfis(nome_completo), exercicios(*)')
      .order('criado_em', { ascending: false })

    const { data: alunosData } = await supabase
      .from('perfis')
      .select('id, nome_completo')
      .eq('role', 'ALUNO')

    setFichas((fichasData as Ficha[]) ?? [])
    setAlunos((alunosData as AlunoOption[]) ?? [])
    setLoading(false)
  }

  const addExercicio = () => setExercicios(prev => [...prev, { ...BLANK_EXERCICIO }])
  const removeExercicio = (i: number) => setExercicios(prev => prev.filter((_, idx) => idx !== i))
  const updateExercicio = (i: number, field: keyof Exercicio, value: string | number) => {
    setExercicios(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academiaId || !alunoSel) return
    setSaving(true)

    const { data: fichaData, error: fichaErr } = await supabase
      .from('fichas_treino')
      .insert({ nome: nomeFicha, objetivo, aluno_id: alunoSel, academia_id: academiaId })
      .select().single()

    if (fichaErr || !fichaData) {
      alert('Erro ao criar ficha: ' + fichaErr?.message)
      setSaving(false)
      return
    }

    const exRows = exercicios
      .filter(ex => ex.nome.trim())
      .map((ex, i) => ({ ...ex, ficha_id: fichaData.id, ordem: i }))

    if (exRows.length > 0) {
      await supabase.from('exercicios').insert(exRows)
    }

    setSaving(false)
    setShowModal(false)
    resetModal()
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ficha?')) return
    await supabase.from('fichas_treino').delete().eq('id', id)
    fetchAll()
  }

  const resetModal = () => {
    setNomeFicha(''); setObjetivo(''); setAlunoSel('')
    setExercicios([{ ...BLANK_EXERCICIO }])
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between pb-8 border-b border-[#585759]/30">
          <div>
            <h1 className="text-3xl font-bold text-[#F2B705]">Fichas de Treino</h1>
            <p className="text-[#A6A6A6] mt-1">Crie e gerencie os treinos dos seus alunos.</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold shadow-lg shadow-[#F2B705]/20">
            <Plus className="w-4 h-4 mr-2" /> Nova Ficha
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
              <p className="text-[#A6A6A6] text-sm max-w-xs">Clique em "Nova Ficha" para montar o primeiro treino de um aluno.</p>
            </div>
          ) : (
            fichas.map((ficha) => {
              const isExpanded = expandedId === ficha.id
              return (
                <div key={ficha.id} className="border border-[#585759]/50 rounded-xl overflow-hidden bg-[#0D0D0D]/80 hover:border-[#585759] transition-colors">
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : ficha.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-[#F2B705]/10 rounded-lg">
                        <Dumbbell className="w-5 h-5 text-[#F2B705]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{ficha.nome}</p>
                        <p className="text-[#A6A6A6] text-sm mt-0.5">
                          Aluno: <span className="text-white">{ficha.perfis?.nome_completo || 'Sem nome'}</span>
                          {ficha.objetivo && <span className="ml-3 text-[#585759]">• {ficha.objetivo}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#585759] hidden sm:block">
                        {new Date(ficha.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(ficha.id) }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#585759] hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                                  <td className="py-3 px-2 text-center text-[#A6A6A6]">{ex.carga || '—'}</td>
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
          <div className="bg-[#0D0D0D] border border-[#585759] rounded-2xl w-full max-w-2xl shadow-2xl my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#585759]/30 flex justify-between items-center sticky top-0 bg-[#0D0D0D] rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-white">Nova Ficha de Treino</h2>
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
                      placeholder="Ex: Treino A — Peito e Tríceps"
                      className="bg-[#0D0D0D] border-[#585759] text-white placeholder:text-[#585759] focus-visible:ring-[#F2B705]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#A6A6A6]">Aluno</Label>
                    <select value={alunoSel} onChange={e => setAlunoSel(e.target.value)} required
                      className="w-full h-10 px-3 rounded-md bg-[#0D0D0D] border border-[#585759] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F2B705]">
                      <option value="">Selecione um aluno...</option>
                      {alunos.map(a => <option key={a.id} value={a.id}>{a.nome_completo || 'Sem nome'}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A6A6A6]">Objetivo (opcional)</Label>
                  <Input value={objetivo} onChange={e => setObjetivo(e.target.value)}
                    placeholder="Ex: Hipertrofia, Emagrecimento, Força..."
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
                        <div className="grid grid-cols-4 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[#585759] text-xs">Séries</Label>
                            <Input type="number" value={ex.series} onChange={e => updateExercicio(i, 'series', Number(e.target.value))} min={1}
                              className="bg-[#0D0D0D] border-[#585759] text-white focus-visible:ring-[#F2B705] h-9 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[#585759] text-xs">Reps</Label>
                            <Input value={ex.repeticoes} onChange={e => updateExercicio(i, 'repeticoes', e.target.value)} placeholder="10-12"
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

              <div className="p-5 border-t border-[#585759]/30 flex gap-3 justify-end">
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
