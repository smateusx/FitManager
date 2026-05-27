import type { ExercicioSemanaForm } from '@/lib/dias-semana-treino'

export type GrupoMuscular = 'peito' | 'costas' | 'biceps' | 'triceps' | 'perna'

export type ExercicioPreset = {
  nome: string
  series: number
  repeticoes: string
  descanso: string
}

export const GRUPOS_MUSCULARES: { id: GrupoMuscular; label: string }[] = [
  { id: 'peito', label: 'Peito' },
  { id: 'costas', label: 'Costas' },
  { id: 'biceps', label: 'Bíceps' },
  { id: 'triceps', label: 'Tríceps' },
  { id: 'perna', label: 'Perna' },
]

export const CATALOGO_EXERCICIOS_PADRAO: Record<GrupoMuscular, ExercicioPreset[]> = {
  peito: [
    { nome: 'Supino reto (barra)', series: 3, repeticoes: '8 a 12', descanso: '90 s' },
    { nome: 'Supino reto (halteres)', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Supino inclinado (barra)', series: 3, repeticoes: '8 a 12', descanso: '90 s' },
    { nome: 'Supino inclinado (halteres)', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Supino declinado', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Crucifixo reto (halteres)', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
    { nome: 'Crucifixo inclinado', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
    { nome: 'Crossover / voador', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
    { nome: 'Flexão de braço', series: 3, repeticoes: 'até a falha', descanso: '60 s' },
    { nome: 'Pullover peitoral', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
  ],
  costas: [
    { nome: 'Puxada alta (pegada aberta)', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Puxada alta (pegada fechada)', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Barra fixa', series: 3, repeticoes: 'até a falha', descanso: '90 s' },
    { nome: 'Remada baixa (triângulo)', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Remada curvada (barra)', series: 3, repeticoes: '8 a 12', descanso: '90 s' },
    { nome: 'Remada curvada (halteres)', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Remada cavalinho', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Remada unilateral (halter)', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Pullover (halter ou máquina)', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
    { nome: 'Levantamento terra', series: 3, repeticoes: '6 a 10', descanso: '120 s' },
  ],
  biceps: [
    { nome: 'Rosca direta (barra)', series: 3, repeticoes: '10 a 12', descanso: '45 s' },
    { nome: 'Rosca direta (halteres)', series: 3, repeticoes: '10 a 12', descanso: '45 s' },
    { nome: 'Rosca martelo', series: 3, repeticoes: '10 a 12', descanso: '45 s' },
    { nome: 'Rosca alternada', series: 3, repeticoes: '10 a 12', descanso: '45 s' },
    { nome: 'Rosca concentrada', series: 3, repeticoes: '10 a 12', descanso: '45 s' },
    { nome: 'Rosca scott (barra W)', series: 3, repeticoes: '10 a 12', descanso: '45 s' },
    { nome: 'Rosca no cabo', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
    { nome: 'Rosca 21 (barra)', series: 3, repeticoes: '21 reps', descanso: '60 s' },
  ],
  triceps: [
    { nome: 'Tríceps pulley (corda)', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
    { nome: 'Tríceps pulley (barra)', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
    { nome: 'Tríceps testa (barra W)', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Tríceps francês (halter)', series: 3, repeticoes: '10 a 12', descanso: '45 s' },
    { nome: 'Tríceps coice (haltere)', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
    { nome: 'Mergulho no banco', series: 3, repeticoes: '10 a 15', descanso: '60 s' },
    { nome: 'Supino fechado (tríceps)', series: 3, repeticoes: '8 a 12', descanso: '90 s' },
    { nome: 'Tríceps unilateral no cabo', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
  ],
  perna: [
    { nome: 'Agachamento livre', series: 3, repeticoes: '8 a 12', descanso: '90 s' },
    { nome: 'Agachamento smith', series: 3, repeticoes: '10 a 12', descanso: '90 s' },
    { nome: 'Leg press', series: 3, repeticoes: '12 a 15', descanso: '90 s' },
    { nome: 'Afundo', series: 3, repeticoes: '10 a 12 por perna', descanso: '60 s' },
    { nome: 'Passada', series: 3, repeticoes: '10 a 12 por perna', descanso: '60 s' },
    { nome: 'Extensora', series: 3, repeticoes: '15 a 20', descanso: '45 s' },
    { nome: 'Mesa flexora', series: 3, repeticoes: '12 a 15', descanso: '60 s' },
    { nome: 'Stiff', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
    { nome: 'Elevação pélvica', series: 3, repeticoes: '12 a 15', descanso: '60 s' },
    { nome: 'Cadeira abdutora', series: 3, repeticoes: '15 a 20', descanso: '45 s' },
    { nome: 'Cadeira adutora', series: 3, repeticoes: '15 a 20', descanso: '45 s' },
    { nome: 'Panturrilha em pé', series: 4, repeticoes: '15 a 25', descanso: '45 s' },
    { nome: 'Panturrilha sentado', series: 4, repeticoes: '15 a 25', descanso: '45 s' },
  ],
}

/** Alias do catálogo padrão (compatibilidade). */
export const CATALOGO_EXERCICIOS = CATALOGO_EXERCICIOS_PADRAO

export type CatalogoExercicios = Record<GrupoMuscular, ExercicioPreset[]>

export function cloneCatalogoPadrao(): CatalogoExercicios {
  return GRUPOS_MUSCULARES.reduce((acc, { id }) => {
    acc[id] = CATALOGO_EXERCICIOS_PADRAO[id].map((p) => ({ ...p }))
    return acc
  }, {} as CatalogoExercicios)
}

export function normalizarCatalogo(raw: unknown): CatalogoExercicios | null {
  if (!raw || typeof raw !== 'object') return null
  const base = cloneCatalogoPadrao()
  const data = raw as Partial<Record<GrupoMuscular, unknown>>
  for (const { id } of GRUPOS_MUSCULARES) {
    const lista = data[id]
    if (!Array.isArray(lista)) continue
    base[id] = lista
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        nome: String(item.nome ?? '').trim(),
        series: Math.max(1, Number(item.series) || 3),
        repeticoes: String(item.repeticoes ?? '10 a 12'),
        descanso: String(item.descanso ?? '60 s'),
      }))
      .filter((item) => item.nome.length > 0)
    base[id] = deduplicarGrupo(base[id])
  }
  return deduplicarCatalogo(base)
}

export function presetParaForm(preset: ExercicioPreset): ExercicioSemanaForm {
  return {
    nome: preset.nome,
    series: preset.series,
    repeticoes: preset.repeticoes,
    carga: '',
    descanso: preset.descanso,
  }
}

export function normalizarNomeExercicio(nome: string): string {
  return nome
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

export function deduplicarGrupo(lista: ExercicioPreset[]): ExercicioPreset[] {
  const vistos = new Set<string>()
  const resultado: ExercicioPreset[] = []
  for (const ex of lista) {
    const chave = normalizarNomeExercicio(ex.nome)
    if (!chave || vistos.has(chave)) continue
    vistos.add(chave)
    resultado.push(ex)
  }
  return resultado
}

export function deduplicarCatalogo(catalogo: CatalogoExercicios): CatalogoExercicios {
  return GRUPOS_MUSCULARES.reduce((acc, { id }) => {
    acc[id] = deduplicarGrupo(catalogo[id] ?? [])
    return acc
  }, {} as CatalogoExercicios)
}

export function exercicioExisteNoGrupo(lista: ExercicioPreset[], nome: string): boolean {
  const alvo = normalizarNomeExercicio(nome)
  if (!alvo) return false
  return lista.some((ex) => normalizarNomeExercicio(ex.nome) === alvo)
}

export function encontrarExercicioNoGrupo(
  lista: ExercicioPreset[],
  nome: string
): ExercicioPreset | undefined {
  const alvo = normalizarNomeExercicio(nome)
  if (!alvo) return undefined
  return lista.find((ex) => normalizarNomeExercicio(ex.nome) === alvo)
}
