'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getBibliotecaCatalogoAcademia,
  saveBibliotecaCatalogoAcademia,
} from '@/lib/firestore'
import {
  cloneCatalogoPadrao,
  deduplicarCatalogo,
  exercicioExisteNoGrupo,
  type CatalogoExercicios,
  type ExercicioPreset,
  type GrupoMuscular,
} from '@/lib/catalogo-exercicios-musculo'

type PersistResult = { ok: true } | { ok: false; erro: string }

type AdicionarResult =
  | { ok: true; nome: string }
  | { ok: false; erro: string; duplicado?: true; nome?: string }

export function useBibliotecaExercicios(academiaId: string | null) {
  const [catalogo, setCatalogo] = useState<CatalogoExercicios>(() => cloneCatalogoPadrao())
  const [loading, setLoading] = useState(!!academiaId)
  const [saving, setSaving] = useState(false)
  const catalogoRef = useRef(catalogo)
  const salvandoRef = useRef(false)

  useEffect(() => {
    catalogoRef.current = catalogo
  }, [catalogo])

  useEffect(() => {
    if (!academiaId) {
      const padrao = cloneCatalogoPadrao()
      catalogoRef.current = padrao
      setCatalogo(padrao)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    getBibliotecaCatalogoAcademia(academiaId)
      .then((data) => {
        if (cancelled) return
        catalogoRef.current = data
        setCatalogo(data)
      })
      .catch(() => {
        if (cancelled) return
        const padrao = cloneCatalogoPadrao()
        catalogoRef.current = padrao
        setCatalogo(padrao)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [academiaId])

  const persistir = useCallback(
    async (proximo: CatalogoExercicios, anterior: CatalogoExercicios): Promise<PersistResult> => {
      if (!academiaId) {
        return { ok: false, erro: 'Não foi possível identificar a academia. Recarregue a página.' }
      }
      if (salvandoRef.current) {
        return { ok: false, erro: 'Aguarde o salvamento anterior terminar.' }
      }

      const limpo = deduplicarCatalogo(proximo)
      salvandoRef.current = true
      setSaving(true)
      catalogoRef.current = limpo
      setCatalogo(limpo)

      try {
        await saveBibliotecaCatalogoAcademia(academiaId, limpo)
        return { ok: true }
      } catch {
        catalogoRef.current = anterior
        setCatalogo(anterior)
        return { ok: false, erro: 'Erro ao salvar a biblioteca. Tente novamente.' }
      } finally {
        salvandoRef.current = false
        setSaving(false)
      }
    },
    [academiaId]
  )

  const adicionarNaLista = useCallback(
    async (grupo: GrupoMuscular, preset: ExercicioPreset): Promise<AdicionarResult> => {
      const nome = preset.nome.trim()
      if (!nome) return { ok: false, erro: 'Informe o nome do exercício.' }

      const atual = catalogoRef.current

      if (exercicioExisteNoGrupo(atual[grupo], nome)) {
        return {
          ok: false,
          erro: `${nome}, já foi adicionado à lista.`,
          duplicado: true,
          nome,
        }
      }

      const proximo = deduplicarCatalogo({
        ...atual,
        [grupo]: [...atual[grupo], { ...preset, nome }],
      })

      const saved = await persistir(proximo, atual)
      if (!saved.ok) return { ok: false, erro: saved.erro }
      return { ok: true, nome }
    },
    [persistir]
  )

  const removerDaLista = useCallback(
    async (grupo: GrupoMuscular, nome: string) => {
      const atual = catalogoRef.current
      const proximo = deduplicarCatalogo({
        ...atual,
        [grupo]: atual[grupo].filter((ex) => ex.nome !== nome),
      })
      const saved = await persistir(proximo, atual)
      if (!saved.ok) throw new Error(saved.erro)
      return nome
    },
    [persistir]
  )

  const atualizarNaLista = useCallback(
    async (grupo: GrupoMuscular, nomeAtual: string, preset: ExercicioPreset) => {
      const nome = preset.nome.trim()
      if (!nome) return { ok: false as const, erro: 'Informe o nome do exercício.' }

      const atual = catalogoRef.current
      const outros = atual[grupo].filter((ex) => ex.nome !== nomeAtual)

      if (exercicioExisteNoGrupo(outros, nome)) {
        return {
          ok: false as const,
          erro: `${nome}, já foi adicionado à lista.`,
          duplicado: true as const,
          nome,
        }
      }

      const proximo = deduplicarCatalogo({
        ...atual,
        [grupo]: atual[grupo].map((ex) => (ex.nome === nomeAtual ? { ...preset, nome } : ex)),
      })
      const saved = await persistir(proximo, atual)
      if (!saved.ok) return { ok: false as const, erro: saved.erro }
      return { ok: true as const, nome }
    },
    [persistir]
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
