/** 0 = domingo … 6 = sábado (mesmo padrão de Date.getDay()) */
export type JsWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const DIAS_SEMANA_TREINO: {
  js: JsWeekday
  label: string
  short: string
}[] = [
  { js: 1, label: 'Segunda', short: 'Seg' },
  { js: 2, label: 'Terça', short: 'Ter' },
  { js: 3, label: 'Quarta', short: 'Qua' },
  { js: 4, label: 'Quinta', short: 'Qui' },
  { js: 5, label: 'Sexta', short: 'Sex' },
  { js: 6, label: 'Sábado', short: 'Sáb' },
  { js: 0, label: 'Domingo', short: 'Dom' },
]

export const JS_WEEKDAYS: JsWeekday[] = [1, 2, 3, 4, 5, 6, 0]

export function labelDiaSemana(js: JsWeekday): string {
  return DIAS_SEMANA_TREINO.find((d) => d.js === js)?.label ?? 'Dia'
}

export function parseDiaSemana(raw: unknown): JsWeekday | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0 || n > 6) return null
  return n as JsWeekday
}

export function hojeJsWeekday(date = new Date()): JsWeekday {
  return date.getDay() as JsWeekday
}

export type ExercicioComDia = {
  id?: string
  nome: string
  series: number
  repeticoes: string
  carga: string
  descanso: string
  ordem?: number
  dia_semana?: number | null
}

export type ExercicioSemanaForm = Omit<ExercicioComDia, 'id' | 'ordem' | 'dia_semana'>

export function isExercicioSemanaVazio(ex: ExercicioSemanaForm): boolean {
  return !ex.nome.trim()
}

/** Substitui o primeiro slot vazio; senão adiciona ao final. Remove outros vazios ao preencher da biblioteca. */
export function inserirExercicioNoDia(
  lista: ExercicioSemanaForm[],
  exercicio: ExercicioSemanaForm
): { lista: ExercicioSemanaForm[]; indice: number } {
  const idxVazio = lista.findIndex(isExercicioSemanaVazio)

  if (idxVazio >= 0) {
    const comSubstituicao = lista.map((ex, idx) => (idx === idxVazio ? { ...exercicio } : ex))
    if (!isExercicioSemanaVazio(exercicio)) {
      const limpa = comSubstituicao.filter((ex) => !isExercicioSemanaVazio(ex))
      const indice = limpa.findIndex(
        (ex) => ex.nome.trim() === exercicio.nome.trim()
      )
      return { lista: limpa, indice: indice >= 0 ? indice : Math.max(0, limpa.length - 1) }
    }
    return { lista: comSubstituicao, indice: idxVazio }
  }

  return { lista: [...lista, { ...exercicio }], indice: lista.length }
}

/** Abre linha para escrita personalizada sem duplicar slot vazio. */
export function abrirLinhaPersonalizada(
  lista: ExercicioSemanaForm[],
  blank: ExercicioSemanaForm
): { lista: ExercicioSemanaForm[]; indice: number } {
  const idxVazio = lista.findIndex(isExercicioSemanaVazio)
  if (idxVazio >= 0) return { lista, indice: idxVazio }
  return { lista: [...lista, { ...blank }], indice: lista.length }
}

export type SemanaTreinoForm = Record<JsWeekday, ExercicioSemanaForm[]>

export function criarSemanaVazia(): SemanaTreinoForm {
  return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
}

export function semanaComDiaInicial(exercicio: ExercicioSemanaForm, dia: JsWeekday = 1): SemanaTreinoForm {
  const s = criarSemanaVazia()
  s[dia] = [{ ...exercicio }]
  return s
}

export function exerciciosParaSemana(exercicios: ExercicioComDia[]): SemanaTreinoForm {
  const semana = criarSemanaVazia()
  const legado: ExercicioComDia[] = []
  const sorted = [...exercicios].sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0))

  for (const ex of sorted) {
    const dia = parseDiaSemana(ex.dia_semana)
    if (dia === null) {
      legado.push(ex)
      continue
    }
    semana[dia].push({
      nome: ex.nome,
      series: Number(ex.series) || 1,
      repeticoes: String(ex.repeticoes ?? ''),
      carga: String(ex.carga ?? ''),
      descanso: String(ex.descanso ?? ''),
    })
  }

  if (legado.length > 0) {
    semana[1] = [
      ...semana[1],
      ...legado.map((ex) => ({
        nome: ex.nome,
        series: Number(ex.series) || 1,
        repeticoes: String(ex.repeticoes ?? ''),
        carga: String(ex.carga ?? ''),
        descanso: String(ex.descanso ?? ''),
      })),
    ]
  }

  return semana
}

export function semanaParaLinhasFirestore(semana: SemanaTreinoForm) {
  const rows: {
    nome: string
    series: number
    repeticoes: string
    carga: string
    descanso: string
    dia_semana: JsWeekday
    ordem: number
  }[] = []

  for (const js of JS_WEEKDAYS) {
    semana[js]
      .filter((ex) => ex.nome.trim())
      .forEach((ex, ordem) => {
        rows.push({
          nome: ex.nome.trim(),
          series: ex.series,
          repeticoes: ex.repeticoes,
          carga: ex.carga,
          descanso: ex.descanso,
          dia_semana: js,
          ordem,
        })
      })
  }

  return rows
}

export function groupExerciciosPorDia<T extends ExercicioComDia>(exercicios: T[]): Record<JsWeekday, T[]> {
  const groups: Record<JsWeekday, T[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
  const legado: T[] = []

  for (const ex of exercicios) {
    const dia = parseDiaSemana(ex.dia_semana)
    if (dia === null) legado.push(ex)
    else groups[dia].push(ex)
  }

  if (legado.length) {
    groups[1] = [...groups[1], ...legado]
  }

  for (const js of JS_WEEKDAYS) {
    groups[js].sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0))
  }

  return groups
}

export function contarDiasComTreino(exercicios: ExercicioComDia[]): number {
  const g = groupExerciciosPorDia(exercicios)
  return JS_WEEKDAYS.filter((js) => g[js].length > 0).length
}
