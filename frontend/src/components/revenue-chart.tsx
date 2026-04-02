'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'

export function RevenueChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Buscar matrículas dos últimos 6 meses que tenham valor_pago
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
      sixMonthsAgo.setDate(1)

      const { data: matriculas, error } = await supabase
        .from('matriculas')
        .select('data_inicio, valor_pago')
        .not('valor_pago', 'is', null)
        .gte('data_inicio', sixMonthsAgo.toISOString().split('T')[0])

      if (error) {
        console.error('Erro ao buscar dados financeiros:', error)
      } else {
        // Agrupar por mês
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        const grouped: Record<string, number> = {}

        // Inicializar os últimos 6 meses com zero
        for (let i = 0; i < 6; i++) {
          const d = new Date()
          d.setMonth(d.getMonth() - i)
          const key = `${months[d.getMonth()]}/${d.getFullYear().toString().slice(-2)}`
          grouped[key] = 0
        }

        (matriculas || []).forEach(m => {
          const date = new Date(m.data_inicio + 'T12:00:00')
          const key = `${months[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`
          if (grouped[key] !== undefined) {
            grouped[key] += Number(m.valor_pago)
          }
        })

        const formatted = Object.entries(grouped)
          .map(([name, total]) => ({ name, total }))
          .reverse() // Do mais antigo para o mais novo

        setData(formatted)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return <div className="h-60 flex items-center justify-center text-[#A6A6A6] text-xs">Carregando dados financeiros...</div>
  if (data.length === 0) return <div className="h-60 flex items-center justify-center text-[#585759] text-xs">Sem dados financeiros no período.</div>

  return (
    <div className="h-80 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#585759" vertical={false} opacity={0.1} />
          <XAxis 
            dataKey="name" 
            stroke="#A6A6A6" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
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
              color: '#fff'
            }}
            formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']}
          />
          <Bar 
            dataKey="total" 
            radius={[6, 6, 0, 0]}
          >
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
