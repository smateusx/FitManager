import type { ReactNode } from 'react'

type AuthShellProps = {
  children: ReactNode
  variant?: 'default' | 'wide'
}

export function AuthShell({ children, variant = 'default' }: AuthShellProps) {
  const max = variant === 'wide' ? 'max-w-lg' : 'max-w-md'
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-start overflow-x-hidden overflow-y-auto bg-[#0D0D0D] px-4 py-8 sm:justify-center sm:py-10">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[min(50vh,400px)] w-[min(100vw,800px)] -translate-x-1/2 rounded-full bg-[#F2B705]/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[min(40vh,300px)] w-[min(90vw,600px)] rounded-full bg-[#BF9004]/10 blur-[100px]" />

      <div className={`relative z-10 w-full ${max}`}>{children}</div>
    </div>
  )
}
