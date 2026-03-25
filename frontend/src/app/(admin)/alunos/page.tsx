'use client'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AlunosPage() {
  const mockAlunos = [
    { id: 1, nome: 'Carlos Silva', plano: 'Mensal', status: 'Ativo', vencimento: '25/04/2026' },
    { id: 2, nome: 'Marina Santos', plano: 'Trimestral', status: 'Pendente', vencimento: '22/03/2026' },
    { id: 3, nome: 'João Pedro', plano: 'Anual', status: 'Ativo', vencimento: '10/01/2027' },
  ]

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Cabeçalho da Página */}
        <header className="flex items-center justify-between pb-8 border-b border-[#585759]/30">
          <div>
            <h1 className="text-3xl font-bold text-[#F2B705]">Gestão de Alunos</h1>
            <p className="text-[#A6A6A6] mt-1">Gerencie matrículas, planos e acompanhe o status de pagamento.</p>
          </div>
          <Button className="bg-[#F2B705] hover:bg-[#BF9004] text-[#0D0D0D] font-bold">
            + Novo Aluno
          </Button>
        </header>

        {/* Tabela de Alunos */}
        <main className="mt-8">
          <div className="border border-[#585759] rounded-xl overflow-hidden bg-[#0D0D0D] shadow-xl shadow-[#0D0D0D]">
            <Table>
              <TableHeader className="bg-[#585759]/10">
                <TableRow className="border-[#585759]/30 hover:bg-transparent">
                  <TableHead className="text-[#A6A6A6] font-semibold">Nome do Aluno</TableHead>
                  <TableHead className="text-[#A6A6A6] font-semibold">Plano</TableHead>
                  <TableHead className="text-[#A6A6A6] font-semibold">Vencimento</TableHead>
                  <TableHead className="text-[#A6A6A6] font-semibold">Status</TableHead>
                  <TableHead className="text-right text-[#A6A6A6] font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAlunos.map((aluno) => (
                  <TableRow key={aluno.id} className="border-[#585759]/30 hover:bg-[#585759]/10 transition-colors">
                    <TableCell className="font-medium text-white">{aluno.nome}</TableCell>
                    <TableCell className="text-[#A6A6A6]">{aluno.plano}</TableCell>
                    <TableCell className="text-[#A6A6A6]">{aluno.vencimento}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${aluno.status === 'Ativo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {aluno.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" className="text-[#F2B705] hover:text-[#BF9004] hover:bg-[#F2B705]/10">
                        Ver Ficha
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </main>

      </div>
    </div>
  )
}
