import Link from 'next/link'
import { LoginForm } from '@/components/login-form'

export default function LoginAcademiaPage() {
  return (
    <LoginForm
      intent="admin"
      title="Academia"
      description="Dono da academia ou gestor principal."
      footer={
        <>
          <p className="text-center text-sm text-[#A6A6A6]">
            Sem conta?{' '}
            <Link href="/register" className="font-medium text-[#F2B705] hover:text-[#BF9004]">
              Cadastrar academia
            </Link>
          </p>
          <Link href="/login" className="block text-center text-xs text-[#585759] hover:text-[#A6A6A6]">
            Outros perfis de login
          </Link>
        </>
      }
    />
  )
}
