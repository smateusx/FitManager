'use client'

import { useRef, useState } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { getFirebaseAuth, getFirebaseStorage } from '@/lib/firebase'
import { setPerfil } from '@/lib/firestore'
import { ProfileAvatar } from '@/components/profile-avatar'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2, Upload } from 'lucide-react'

const MAX_BYTES = 2 * 1024 * 1024
const UPLOAD_MS = 120_000
const URL_MS = 45_000
const FIRESTORE_MS = 45_000

function readErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: string }).code === 'string') {
    return (err as { code: string }).code
  }
  return ''
}

function withDeadline<T>(promise: Promise<T>, ms: number, code: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error(code), { code })), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      }
    )
  })
}

function uploadErrorMessage(err: unknown): string {
  const code = readErrorCode(err)
  if (code === 'deadline-exceeded') {
    return 'A operação demorou demais (rede lenta ou Firebase sem resposta). Tente outra rede ou uma foto menor.'
  }
  if (code === 'storage/unauthorized') {
    return 'Sem permissão no Storage. Publique firebase/storage.rules e confirme que está logado.'
  }
  if (code === 'storage/canceled') {
    return 'Envio cancelado. Verifique a conexão ou tente de novo.'
  }
  if (code === 'storage/retry-limit-exceeded' || code === 'storage/unknown') {
    return 'Falha de rede ao enviar. Tente de novo em instantes.'
  }
  if (code === 'storage/quota-exceeded') {
    return 'Limite de armazenamento do projeto atingido no Firebase.'
  }
  return 'Não foi possível enviar a foto. Confira se o Firebase Storage está ativo, se NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET no Vercel coincide com o bucket do Console e se as regras foram publicadas.'
}

function isHeic(file: File): boolean {
  const t = file.type.toLowerCase()
  if (t === 'image/heic' || t === 'image/heif') return true
  return /\.hei[cf]$/i.test(file.name)
}

type Props = {
  userId: string
  displayName: string
  fotoUrl: string | null
  onChange: (url: string | null) => void
}

export function ProfilePhotoSection({ userId, displayName, fotoUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (isHeic(file)) {
      alert(
        'Fotos HEIC (iPhone) não funcionam bem no navegador. Use JPG: Ajustes → Câmera → Formatos → «Mais compatível», ou escolha «Mais recentes» e exporte como JPEG.'
      )
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('Escolha uma imagem (JPG, PNG ou WebP).')
      return
    }
    if (file.size > MAX_BYTES) {
      alert('Use uma imagem de até 2 MB.')
      return
    }

    const auth = getFirebaseAuth()
    const u = auth.currentUser
    if (!u || u.uid !== userId) {
      alert('Sessão inválida. Saia e entre novamente.')
      return
    }

    setBusy(true)
    try {
      const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
      const contentType =
        file.type === 'image/jpg' ? 'image/jpeg' : file.type.startsWith('image/') ? file.type : 'image/jpeg'

      const storage = getFirebaseStorage()
      const pathRef = ref(storage, `avatars/${u.uid}/profile.${ext}`)

      await withDeadline(uploadBytes(pathRef, file, { contentType }), UPLOAD_MS, 'deadline-exceeded')

      const url = await withDeadline(getDownloadURL(pathRef), URL_MS, 'deadline-exceeded')

      await withDeadline(setPerfil(u.uid, { foto_url: url }), FIRESTORE_MS, 'deadline-exceeded')
      onChange(url)

      try {
        await updateProfile(u, { photoURL: url })
      } catch (authErr) {
        console.warn('Não foi possível atualizar photoURL no Auth:', authErr)
      }
    } catch (err) {
      console.error(err)
      alert(uploadErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function removePhoto() {
    setBusy(true)
    try {
      const auth = getFirebaseAuth()
      const u = auth.currentUser
      if (!u || u.uid !== userId) {
        alert('Sessão inválida. Saia e entre novamente.')
        return
      }
      await withDeadline(setPerfil(u.uid, { foto_url: null }), FIRESTORE_MS, 'deadline-exceeded')
      onChange(null)
      try {
        await updateProfile(u, { photoURL: null })
      } catch (authErr) {
        console.warn('Não foi possível limpar photoURL no Auth:', authErr)
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao remover foto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <ProfileAvatar
        fotoUrl={fotoUrl}
        name={displayName}
        sizeClass="h-24 w-24 text-2xl border-2 border-[#F2B705]/40"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onPick}
      />
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="border-[#585759] text-white hover:bg-[#585759]/30"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Upload className="mr-1 h-4 w-4" />
              Enviar foto
            </>
          )}
        </Button>
        {fotoUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => void removePhoto()}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Remover
          </Button>
        ) : null}
      </div>
      <p className="max-w-[14rem] text-center text-xs text-[#585759]">JPG, PNG ou WebP · até 2 MB · no iPhone prefira «Mais compatível»</p>
    </div>
  )
}
