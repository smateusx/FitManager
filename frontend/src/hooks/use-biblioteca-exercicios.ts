'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getBibliotecaCatalogoAcademia,
  saveBibliotecaCatalogoAcademia,
} from '@/lib/firestore'
import {
  cloneCatalogoPadrao,
  type CatalogoExercicios,
  type ExercicioPreset,
  type GrupoMuscular,
} from '@/lib/catalogo-exercicios-musculo'

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
    async (proximo: CatalogoExercicios) => {
      setCatalogo(proximo)
      if (!academiaId) return
      setSaving(true)
      try {
        await saveBibliotecaCatalogoAcademia(academiaId, proximo)
      } finally {
        setSaving(false)
      }
    },
    [academiaId]
  )

  const adicionarNaLista = useCallback(
    async (grupo: GrupoMuscular, preset: ExercicioPreset) => {
      const nome = preset.nome.trim()
      if (!nome) return { ok: false as const, erro: 'Informe o nome do exercício.' }

      const duplicado = catalogo[grupo].some(
        (ex) => ex.nome.localeCompare(nome, 'pt-BR', { sensitivity: 'base' }) === 0
      )
      if (duplicado) return { ok: false as const, erro: 'Este exercício já está na lista.' }

      const proximo = {
        ...catalogo,
        [grupo]: [...catalogo[grupo], { ...preset, nome }],
      }
      await persistir(proximo)
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
      await persistir(proximo)
      return nome
    },
    [catalogo, persistir]
  )

  const atualizarNaLista = useCallback(
    async (grupo: GrupoMuscular, nomeAtual: string, preset: ExercicioPreset) => {
      const nome = preset.nome.trim()
      if (!nome) return { ok: false as const, erro: 'Informe o nome do exercício.' }

      const duplicado = catalogo[grupo].some(
        (ex) =>
          ex.nome !== nomeAtual &&
          ex.nome.localeCompare(nome, 'pt-BR', { sensitivity: 'base' }) === 0
      )
      if (duplicado) return { ok: false as const, erro: 'Já existe outro exercício com este nome.' }

      const proximo = {
        ...catalogo,
        [grupo]: catalogo[grupo].map((ex) => (ex.nome === nomeAtual ? { ...preset, nome } : ex)),
      }
      await persistir(proximo)
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
