'use client'

export type PasswordSessionMode = 'stay' | 'sign_out_here'

type Props = {
  value: PasswordSessionMode
  onChange: (v: PasswordSessionMode) => void
}

export function PasswordSessionAfterChange({ value, onChange }: Props) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-[#585759]/25 bg-[#0D0D0D]/40 p-4">
      <legend className="px-1 text-xs font-medium text-[#A6A6A6]">Depois de alterar a senha</legend>

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="radio"
          name="pwd_session_mode"
          className="mt-1 accent-[#F2B705]"
          checked={value === 'stay'}
          onChange={() => onChange('stay')}
        />
        <span>
          <span className="font-medium text-white">Manter sessão neste dispositivo</span>
          <span className="mt-0.5 block text-xs leading-snug text-[#585759]">
            Continua a usar a conta aqui sem voltar ao login.
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="radio"
          name="pwd_session_mode"
          className="mt-1 accent-[#F2B705]"
          checked={value === 'sign_out_here'}
          onChange={() => onChange('sign_out_here')}
        />
        <span>
          <span className="font-medium text-white">Sair deste dispositivo</span>
          <span className="mt-0.5 block text-xs leading-snug text-[#585759]">
            Aplica a nova senha e termina a sessão aqui. Você precisará entrar de novo.
          </span>
        </span>
      </label>

      <p className="mt-2 border-t border-[#585759]/20 pt-3 text-[11px] leading-relaxed text-[#585759]">
        Por segurança, ao mudar a palavra-passe o Firebase invalida sessões antigas. Outros aparelhos podem pedir novo
        login automaticamente.
      </p>
    </fieldset>
  )
}
