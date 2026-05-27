import { BookOpen, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

type TreinoContextBannerProps = {
  variant: 'sugerido' | 'oficial'
  className?: string
}

export function TreinoContextBanner({ variant, className }: TreinoContextBannerProps) {
  if (variant === 'sugerido') {
    return (
      <div
        role="note"
        className={cn(
          'flex gap-3 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm',
          className
        )}
      >
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden />
        <div>
          <p className="font-semibold text-sky-200">Treino sugerido</p>
          <p className="mt-0.5 leading-relaxed text-[#A6A6A6]">
            Referência automática para iniciantes. Não substitui a orientação da academia nem registra evolução no
            sistema.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      role="note"
      className={cn(
        'flex gap-3 rounded-xl border border-[#F2B705]/30 bg-[#F2B705]/10 px-4 py-3 text-sm',
        className
      )}
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#F2B705]" aria-hidden />
      <div>
        <p className="font-semibold text-[#F2B705]">Ficha oficial</p>
        <p className="mt-0.5 leading-relaxed text-[#A6A6A6]">
          Montada pela academia para este aluno. Use registrar carga e evolução nestes exercícios.
        </p>
      </div>
    </div>
  )
}
