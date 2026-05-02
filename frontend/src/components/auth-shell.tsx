import type { ReactNode } from 'react'

type AuthShellProps = {
  children: ReactNode
  variant?: 'default' | 'wide'
}

export function AuthShell({ children, variant = 'default' }: AuthShellProps) {
  const max = variant === 'wide' ? 'max-w-lg' : 'max-w-md'
  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[#0D0D0D] p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 w-[min(100vw,800px)] h-[min(50vh,400px)] -translate-x-1/2 bg-[#F2B705]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[min(90vw,600px)] h-[min(40vh,300px)] bg-[#BF9004]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className={`relative z-10 w-full ${max}`}>{children}</div>
    </div>
  )
}
