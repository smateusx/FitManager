'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getBibliotecaCatalogoAcademia,
  saveBibliotecaCatalogoAcademia,
} from '@/lib/firestore'
import {
  cloneCatalogoPadrao,
  exercicioExisteNoGrupo,
  type CatalogoExercicios,
  type ExercicioPreset,
  type GrupoMuscular,
} from '@/lib/catalogo-exercicios-musculo'

type PersistResult = { ok: true } | { ok: false; erro: string }

export function useBibliotecaExercicios(academiaId: string | null) {
  const [catalogo, setCatalogo] = useState<CatalogoExercicios>(() => cloneCatalogoPadrao())
  const [loading, setLoading] = useState(!!academiaId)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!academiaId) {
      setCatalogo(cloneCatalogoPadrao())
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    getBibliotecaCatalogoAcademia(academiaId)
      .then((data) => {
        if (!cancelled) setCatalogo(data)
      })
      .catch(() => {
        if (!cancelled) setCatalogo(cloneCatalogoPadrao())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [academiaId])

  const persistir = useCallback(
    async (proximo: CatalogoExercicios): Promise<PersistResult> => {
      if (!academiaId) {
        return { ok: false, erro: 'Não foi possível identificar a academia. Recarregue a página.' }
      }

      const anterior = catalogo
      setCatalogo(proximo)
      setSaving(true)
      try {
        await saveBibliotecaCatalogoAcademia(academiaId, proximo)
        return { ok: true }
      } catch {
        setCatalogo(anterior)
        return { ok: false, erro: 'Erro ao salvar a biblioteca. Tente novamente.' }
      } finally {
        setSaving(false)
      }
    },
    [academiaId, catalogo]
  )

  const adicionarNaLista = useCallback(
    async (grupo: GrupoMuscular, preset: ExercicioPreset) => {
      const nome = preset.nome.trim()
      if (!nome) return { ok: false as const, erro: 'Informe o nome do exercício.' }

      if (exercicioExisteNoGrupo(catalogo[grupo], nome)) {
        return {
          ok: false as const,
          erro: `${nome}, já foi adicionado à lista.`,
          duplicado: true as const,
          nome,
        }
      }

      const proximo = {
        ...catalogo,
        [grupo]: [...catalogo[grupo], { ...preset, nome }],
      }
      const saved = await persistir(proximo)
      if (!saved.ok) return { ok: false as const, erro: saved.erro }
      return { ok: true as const, nome }
    },
    [catalogo, persistir]
  )

  const removerDaLista = useCallback(
    async (grupo: GrupoMuscular, nome: string) => {
      const proximo = {
        ...catalogo,
        [grupo]: catalogo[grupo].filter((ex) => ex.nome !== nome),
      }
      const saved = await persistir(proximo)
      if (!saved.ok) throw new Error(saved.erro)
      return nome
    },
    [catalogo, persistir]
  )

  const atualizarNaLista = useCallback(
    async (grupo: GrupoMuscular, nomeAtual: string, preset: ExercicioPreset) => {
      const nome = preset.nome.trim()
      if (!nome) return { ok: false as const, erro: 'Informe o nome do exercício.' }

      if (exercicioExisteNoGrupo(
        catalogo[grupo].filter((ex) => ex.nome !== nomeAtual),
        nome
      )) {
        return {
          ok: false as const,
          erro: `${nome}, já foi adicionado à lista.`,
          duplicado: true as const,
          nome,
        }
      }

      const proximo = {
        ...catalogo,
        [grupo]: catalogo[grupo].map((ex) => (ex.nome === nomeAtual ? { ...preset, nome } : ex)),
      }
      const saved = await persistir(proximo)
      if (!saved.ok) return { ok: false as const, erro: saved.erro }
      return { ok: true as const, nome }
    },
    [catalogo, persistir]
  )

  return {
    catalogo,
    loading,
    saving,
    adicionarNaLista,
    removerDaLista,
    atualizarNaLista,
  }
}
