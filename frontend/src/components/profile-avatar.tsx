'use client'

import { userInitials } from '@/lib/user-initials'

export function ProfileAvatar({
  fotoUrl,
  name,
  sizeClass,
}: {
  fotoUrl?: string | null
  name: string
  sizeClass?: string
}) {
  const dim = sizeClass ?? 'h-12 w-12 text-sm'
  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica do Firebase Storage
      <img src={fotoUrl} alt="" className={`rounded-full object-cover bg-[#585759]/20 ${dim}`} />
    )
  }
  return (
    <div
      className={`rounded-full bg-[#F2B705]/15 border border-[#F2B705]/35 flex items-center justify-center font-bold text-[#F2B705] shrink-0 ${dim}`}
      aria-hidden
    >
      {userInitials(name)}
    </div>
  )
}
