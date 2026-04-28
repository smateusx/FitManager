'use client'

import { useEffect, useState } from 'react'
import { listRevenueLastMonths } from '@/lib/firestore-service'
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
  const [data, setData] = useState<Array<{ name: string; total: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const academyId = localStorage.getItem('fm_academia_id')
        if (!academyId) {
          setError('Academia não identificada para gerar relatório.')
          return
        }
        const revenue = await listRevenueLastMonths(academyId)
        setData(revenue)
      } catch (err) {
        console.error('Erro ao buscar dados financeiros:', err)
        setError('Erro ao carregar faturamento.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="h-60 flex items-center justify-center text-[#A6A6A6] text-xs">Carregando dados financeiros...</div>
  if (error) return <div className="h-60 flex items-center justify-center text-red-400 text-xs">{error}</div>
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
            {data.map((_, index) => (
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
