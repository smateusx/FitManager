'use client'

import { useEffect } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type InlineFeedbackVariant = 'success' | 'error' | 'info' | 'warning'

type InlineFeedbackProps = {
  variant: InlineFeedbackVariant
  message: string
  onDismiss?: () => void
  className?: string
  autoDismissMs?: number
}

const styles: Record<
  InlineFeedbackVariant,
  { box: string; text: string; icon: typeof CheckCircle2; live: 'polite' | 'assertive' }
> = {
  success: {
    box: 'border-emerald-500/25 bg-emerald-500/10',
    text: 'text-emerald-300',
    icon: CheckCircle2,
    live: 'polite',
  },
  error: {
    box: 'border-red-500/30 bg-red-500/10',
    text: 'text-red-300',
    icon: AlertCircle,
    live: 'assertive',
  },
  info: {
    box: 'border-sky-500/25 bg-sky-500/10',
    text: 'text-sky-200',
    icon: Info,
    live: 'polite',
  },
  warning: {
    box: 'border-amber-500/30 bg-amber-500/10',
    text: 'text-amber-200',
    icon: AlertTriangle,
    live: 'assertive',
  },
}

export function InlineFeedback({
  variant,
  message,
  onDismiss,
  className,
  autoDismissMs,
}: InlineFeedbackProps) {
  const { box, text, icon: Icon, live } = styles[variant]

  useEffect(() => {
    if (!autoDismissMs || !onDismiss) return
    const t = window.setTimeout(onDismiss, autoDismissMs)
    return () => window.clearTimeout(t)
  }, [autoDismissMs, message, onDismiss, variant])

  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      aria-live={live}
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-in fade-in slide-in-from-top-1 duration-200',
        box,
        className
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', text)} aria-hidden />
      <p className={cn('flex-1 font-medium leading-relaxed', text)}>{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className={cn('shrink-0 rounded-md p-1 opacity-70 transition hover:opacity-100', text)}
          aria-label="Fechar mensagem"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
