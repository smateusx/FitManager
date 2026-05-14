/**
 * Treinos sugeridos para iniciantes (apenas referência no app do aluno).
 * Segunda e quinta: peito, ombro e bíceps · Terça e sexta: costas, tríceps e antebraço · Quarta e sábado: pernas.
 */

export type PreTreinoSlot = 'push' | 'pull' | 'pernas'

export type PreTreinoExercicio = {
  nome: string
  series: number
  repeticoes: string
  descanso: string
}

export type PreTreinoDoDia = {
  slot: PreTreinoSlot
  titulo: string
  foco: string
  exercicios: PreTreinoExercicio[]
}

const PUSH: PreTreinoExercicio[] = [
  { nome: 'Supino reto (halteres ou máquina)', series: 3, repeticoes: '12 a 15', descanso: '60 s' },
  { nome: 'Supino inclinado (halteres)', series: 3, repeticoes: '12 a 15', descanso: '60 s' },
  { nome: 'Crucifixo (banco inclinado ou crossover)', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
  { nome: 'Desenvolvimento (halteres ou máquina)', series: 3, repeticoes: '10 a 12', descanso: '60 s' },
  { nome: 'Elevação lateral', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
  { nome: 'Rosca direta (barra ou halteres)', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
  { nome: 'Rosca martelo', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
]

const PULL: PreTreinoExercicio[] = [
  { nome: 'Puxada alta (pegada aberta)', series: 3, repeticoes: '12 a 15', descanso: '60 s' },
  { nome: 'Remada baixa (triângulo ou neutra)', series: 3, repeticoes: '12 a 15', descanso: '60 s' },
  { nome: 'Remada curvada (halteres)', series: 3, repeticoes: '12 a 15', descanso: '60 s' },
  { nome: 'Pullover (halter ou máquina)', series: 2, repeticoes: '12 a 15', descanso: '45 s' },
  { nome: 'Tríceps pulley (corda ou barra)', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
  { nome: 'Tríceps coice (haltere)', series: 3, repeticoes: '12 a 15', descanso: '45 s' },
  { nome: 'Rosca de punho (antebraço)', series: 3, repeticoes: '15 a 20', descanso: '45 s' },
]

const PERNAS: PreTreinoExercicio[] = [
  { nome: 'Agachamento (livre ou smith)', series: 3, repeticoes: '12 a 15', descanso: '90 s' },
  { nome: 'Leg press', series: 3, repeticoes: '12 a 15', descanso: '90 s' },
  { nome: 'Afundo ou passada', series: 3, repeticoes: '10 a 12 por perna', descanso: '60 s' },
  { nome: 'Extensora', series: 3, repeticoes: '15 a 20', descanso: '45 s' },
  { nome: 'Mesa flexora ou stiff leve', series: 3, repeticoes: '12 a 15', descanso: '60 s' },
  { nome: 'Elevação pélvica ou abdutora', series: 3, repeticoes: '15 a 20', descanso: '45 s' },
  { nome: 'Panturrilha em pé', series: 4, repeticoes: '15 a 25', descanso: '45 s' },
]

function templateDoSlot(slot: PreTreinoSlot): PreTreinoDoDia {
  switch (slot) {
    case 'push':
      return {
        slot,
        titulo: 'Treino A: peito, ombro e bíceps',
        foco: 'Peito, ombro e bíceps',
        exercicios: PUSH,
      }
    case 'pull':
      return {
        slot,
        titulo: 'Treino B: costas, tríceps e antebraço',
        foco: 'Costas, tríceps e antebraço',
        exercicios: PULL,
      }
    default:
      return {
        slot,
        titulo: 'Treino C: pernas',
        foco: 'Membros inferiores',
        exercicios: PERNAS,
      }
  }
}

/** Domingo = descanso (sem treino fixo no cronograma). */
export function slotTreinoIniciantePorJsWeekday(jsWeekday: number): PreTreinoSlot | null {
  if (jsWeekday === 0) return null
  if (jsWeekday === 1 || jsWeekday === 4) return 'push'
  if (jsWeekday === 2 || jsWeekday === 5) return 'pull'
  return 'pernas'
}

export function treinoPreProntoParaData(d: Date): PreTreinoDoDia | null {
  const slot = slotTreinoIniciantePorJsWeekday(d.getDay())
  if (!slot) return null
  return templateDoSlot(slot)
}

export const ROTINA_SEMANA_INICIANTE: {
  jsWeekday: number
  label: string
  quandoRepete?: string
}[] = [
  { jsWeekday: 1, label: 'Segunda' },
  { jsWeekday: 2, label: 'Terça' },
  { jsWeekday: 3, label: 'Quarta' },
  { jsWeekday: 4, label: 'Quinta', quandoRepete: 'Mesmo treino da segunda' },
  { jsWeekday: 5, label: 'Sexta', quandoRepete: 'Mesmo treino da terça' },
  { jsWeekday: 6, label: 'Sábado', quandoRepete: 'Mesmo treino da quarta' },
]

export function treinoPreProntoPorWeekday(jsWeekday: number): PreTreinoDoDia | null {
  const slot = slotTreinoIniciantePorJsWeekday(jsWeekday)
  if (!slot) return null
  return templateDoSlot(slot)
}
