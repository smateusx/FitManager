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
    if (!file.type.startsWith('image/')) {
      alert('Escolha uma imagem (JPG, PNG ou WebP).')
      return
    }
    if (file.size > MAX_BYTES) {
      alert('Use uma imagem de até 2 MB.')
      return
    }
    setBusy(true)
    try {
      const auth = getFirebaseAuth()
      const u = auth.currentUser
      if (!u || u.uid !== userId) return
      const ext = file.type.includes('png') ? 'png' : file.type.includes('webp') ? 'webp' : 'jpg'
      const storage = getFirebaseStorage()
      const pathRef = ref(storage, `avatars/${u.uid}/profile.${ext}`)
      await uploadBytes(pathRef, file, { contentType: file.type })
      const url = await getDownloadURL(pathRef)
      await setPerfil(u.uid, { foto_url: url })
      await updateProfile(u, { photoURL: url })
      onChange(url)
    } catch (err) {
      console.error(err)
      alert(
        'Não foi possível enviar a foto. Ative o Firebase Storage no console e publique as regras (firebase/storage.rules).'
      )
    } finally {
      setBusy(false)
    }
  }

  async function removePhoto() {
    setBusy(true)
    try {
      const auth = getFirebaseAuth()
      const u = auth.currentUser
      if (!u || u.uid !== userId) return
      await setPerfil(u.uid, { foto_url: null })
      await updateProfile(u, { photoURL: null })
      onChange(null)
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
      <p className="max-w-[14rem] text-center text-xs text-[#585759]">JPG, PNG ou WebP · até 2 MB</p>
    </div>
  )
}
