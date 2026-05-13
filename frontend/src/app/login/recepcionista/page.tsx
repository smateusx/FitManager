import Link from 'next/link'
import { LoginForm } from '@/components/login-form'

export default function LoginRecepcionistaPage() {
  return (
    <LoginForm
      intent="recepcionista"
      title="Recepção"
      description="Equipa da receção (convite da academia)."
      footer={
        <>
          <p className="text-center text-xs text-[#585759]">
            Primeiro acesso? Use o link de convite que o administrador enviou.
          </p>
          <Link href="/login" className="block text-center text-xs text-[#585759] hover:text-[#A6A6A6]">
            Outros perfis de login
          </Link>
        </>
      }
    />
  )
}
