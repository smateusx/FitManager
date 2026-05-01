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

export function RevenueChart({ academiaId }: Props) {
  const [data, setData] = useState<{ name: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!academiaId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)
      const min = sixMonthsAgo.toISOString().split('T')[0]

      const matriculas = await listMatriculasByDataInicio(academiaId, min)
      const withValor = matriculas.filter((m: any) => m.valor_pago != null)

      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const grouped: Record<string, number> = {}

      for (let i = 0; i < 6; i++) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = `${months[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`
        grouped[key] = 0
      }

      withValor.forEach((m: any) => {
        const date = new Date((m.data_inicio as string) + 'T12:00:00')
        const key = `${months[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`
        if (grouped[key] !== undefined) {
          grouped[key] += Number(m.valor_pago)
        }
      })

      const formatted = Object.entries(grouped)
        .map(([name, total]) => ({ name, total }))
        .reverse()

      setData(formatted)
      setLoading(false)
    }

    fetchData()
  }, [academiaId])

  if (loading)
    return (
      <div className="h-60 flex items-center justify-center text-[#A6A6A6] text-xs">
        Carregando dados financeiros...
      </div>
    )
  if (data.length === 0)
    return (
      <div className="h-60 flex items-center justify-center text-[#585759] text-xs">
        Sem dados financeiros no período.
      </div>
    )

  return (
    <div className="h-80 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#585759" vertical={false} opacity={0.1} />
          <XAxis dataKey="name" stroke="#A6A6A6" fontSize={11} tickLine={false} axisLine={false} dy={10} />
          <YAxis
            stroke="#A6A6A6"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${value}`}
          />
          <Tooltip
            cursor={{ fill: '#585759', opacity: 0.1 }}
            contentStyle={{
              backgroundColor: '#0D0D0D',
              border: '1px solid #585759',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#fff',
            }}
            formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === data.length - 1 ? '#F2B705' : '#585759'}
                fillOpacity={index === data.length - 1 ? 1 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
