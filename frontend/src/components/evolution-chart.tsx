'use client'

import { useEffect, useState } from 'react'
import { listRegistrosCarga } from '@/lib/firestore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type Props = {
  exercicioId: string
  alunoId: string
}

export function EvolutionChart({ exercicioId, alunoId }: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const registros = await listRegistrosCarga(alunoId, exercicioId)
      const formatted = (registros || []).map((r: any) => ({
        ...r,
        data: new Date(r.data_registro).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        carga: Number(r.carga),
      }))
      setData(formatted)
      setLoading(false)
    }

    fetchData()
  }, [exercicioId, alunoId])

  if (loading)
    return <div className="h-40 flex items-center justify-center text-[#A6A6A6] text-xs">Carregando gráfico...</div>
  if (data.length === 0)
    return (
      <div className="h-40 flex items-center justify-center text-[#585759] text-xs">
        Nenhum registro de carga ainda.
      </div>
    )

  return (
    <div className="h-60 w-full mt-4 bg-[#585759]/5 rounded-xl p-4 border border-[#585759]/10">
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
      <div className="text-center mt-2">
        <span className="text-[10px] text-[#A6A6A6] uppercase font-bold tracking-widest">
          Evolução de Carga (kg)
        </span>
      </div>
    </div>
  )
}
