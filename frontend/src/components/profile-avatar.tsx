'use client'

import { userInitials } from '@/lib/user-initials'

export function ProfileAvatar({ name, sizeClass }: { name: string; sizeClass?: string }) {
  const dim = sizeClass ?? 'h-12 w-12 text-sm'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-[#F2B705]/35 bg-[#F2B705]/15 font-bold text-[#F2B705] ${dim}`}
      aria-hidden
    >
      {userInitials(name)}
    </div>
  )
}
