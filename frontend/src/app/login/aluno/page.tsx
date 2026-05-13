import Link from 'next/link'
import { LoginForm } from '@/components/login-form'

export default function LoginAlunoPage() {
  return (
    <LoginForm
      intent="aluno"
      title="Aluno"
      description="Acesso ao treino e ao seu perfil."
      footer={
        <>
          <p className="text-center text-xs text-[#585759]">
            Primeiro acesso? Cadastre-se pelo link de convite da sua academia.
          </p>
          <Link href="/login" className="block text-center text-xs text-[#585759] hover:text-[#A6A6A6]">
            Outros perfis de login
          </Link>
        </>
      }
    />
  )
}
