'use client'

import { useEffect, useState } from 'react'
import { listMatriculasByDataInicio } from '@/lib/firestore'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

type Props = { academiaId: string }

type ChartRow = { name: string; total: number }

type MatriculaRow = Record<string, unknown>

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: unknown
  label?: unknown
}) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null
  const entry = payload[0] as { value?: unknown }
  const raw = entry?.value
  const total = typeof raw === 'number' ? raw : Number(raw ?? 0)
  return (
    <div className="rounded-lg border border-[#F2B705]/50 bg-[#1a1a1a] px-3 py-2.5 shadow-xl shadow-black/40">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#F2B705]">{String(label ?? '')}</p>
      <p className="mt-1 text-base font-bold tabular-nums text-white">
        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="mt-1 text-[10px] text-[#A6A6A6]">Faturamento no mês</p>
    </div>
  )
}

export function RevenueChart({ academiaId }: Props) {
  const [data, setData] = useState<ChartRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!academiaId) {
      queueMicrotask(() => setLoading(false))
      return
    }

    let cancelled = false

    const fetchData = async () => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)
      const min = sixMonthsAgo.toISOString().split('T')[0]

      const matriculas = (await listMatriculasByDataInicio(academiaId, min)) as MatriculaRow[]
      const withValor = matriculas.filter((m) => m.valor_pago != null)

      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const grouped: Record<string, number> = {}

      for (let i = 0; i < 6; i++) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = `${months[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`
        grouped[key] = 0
      }

      withValor.forEach((m) => {
        const di = m.data_inicio
        if (typeof di !== 'string') return
        const date = new Date(`${di}T12:00:00`)
        const key = `${months[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`
        if (grouped[key] !== undefined) {
          grouped[key] += Number(m.valor_pago)
        }
      })

      const formatted = Object.entries(grouped)
        .map(([name, total]) => ({ name, total }))
        .reverse()

      if (!cancelled) {
        setData(formatted)
      }
    }

    void fetchData().finally(() => {
      if (!cancelled) {
        queueMicrotask(() => setLoading(false))
      }
    })

    return () => {
      cancelled = true
    }
  }, [academiaId])

  if (loading)
    return (
      <div className="flex h-60 items-center justify-center text-xs text-[#A6A6A6]">
        Carregando dados financeiros...
      </div>
    )
  if (data.length === 0)
    return (
      <div className="flex h-60 items-center justify-center text-xs text-[#585759]">
        Sem dados financeiros no período.
      </div>
    )

  const lastIdx = data.length - 1

  return (
    <div className="mt-4 h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#585759" vertical={false} opacity={0.2} />
          <XAxis
            dataKey="name"
            stroke="#C4C4C4"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#585759' }}
            dy={8}
          />
          <YAxis
            stroke="#C4C4C4"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#585759' }}
            tickFormatter={(value) => `R$${value}`}
          />
          <Tooltip
            cursor={{ fill: '#F2B705', opacity: 0.08 }}
            content={(props) => (
              <RevenueTooltip active={props.active} payload={props.payload} label={props.label} />
            )}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === lastIdx ? '#F2B705' : '#737373'}
                fillOpacity={index === lastIdx ? 1 : 0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
