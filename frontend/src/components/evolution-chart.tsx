'use client'

import { useEffect, useState } from 'react'
import { listRegistrosCarga } from '@/lib/firestore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Props = {
  exercicioId: string
  alunoId: string
}

type ChartPoint = {
  data: string
  carga: number
  data_registro: string
}

export function EvolutionChart({ exercicioId, alunoId }: Props) {
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const registros = await listRegistrosCarga(alunoId, exercicioId)
      const formatted = (registros || []).map((r: Record<string, unknown>) => ({
        data_registro: String(r.data_registro ?? ''),
        data: new Date(String(r.data_registro ?? '')).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        carga: Number(r.carga ?? 0),
      }))
      if (!cancelled) {
        setData(formatted)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [exercicioId, alunoId])

  if (loading)
    return <div className="flex h-40 items-center justify-center text-xs text-[#A6A6A6]">Carregando gráfico...</div>
  if (data.length === 0)
    return (
      <div className="flex h-40 items-center justify-center text-xs text-[#585759]">Nenhum registro de carga ainda.</div>
    )

  return (
    <div className="mt-4 h-60 w-full max-w-full rounded-xl border border-[#585759]/10 bg-[#585759]/5 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#585759" vertical={false} opacity={0.2} />
          <XAxis dataKey="data" stroke="#A6A6A6" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#A6A6A6"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}kg`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0D0D0D',
              border: '1px solid #585759',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
            }}
            itemStyle={{ color: '#F2B705' }}
          />
          <Line
            type="monotone"
            dataKey="carga"
            stroke="#F2B705"
            strokeWidth={3}
            dot={{ fill: '#F2B705', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#F2B705', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A6A6A6]">
          Evolução de Carga (kg)
        </span>
      </div>
    </div>
  )
}
