'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Camera, Loader2, User } from 'lucide-react'
import Image from 'next/image'
import type { ChangeEvent } from 'react'

interface AvatarUploadProps {
  uid: string
  url: string | null
  onUpload: (url: string) => void
  disabled?: boolean
}

export function AvatarUpload({ uid, url, onUpload, disabled = false }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    try {
      if (disabled) {
        alert('Upload de avatar desativado: configure o Firebase Storage para habilitar.')
        return
      }

      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para fazer upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${uid}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      onUpload(data.publicUrl)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao enviar avatar.'
      alert(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div className="w-32 h-32 rounded-3xl bg-[#585759]/20 border-2 border-dashed border-[#585759]/50 flex items-center justify-center overflow-hidden transition-all group-hover:border-[#F2B705]/50 shadow-2xl">
          {url ? (
            <Image
              src={url}
              alt="Avatar"
              fill
              sizes="128px"
              className="object-cover transition-transform group-hover:scale-110"
              unoptimized
            />
          ) : (
            <User className="w-12 h-12 text-[#585759] group-hover:text-[#F2B705] transition-colors" />
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#F2B705] animate-spin" />
            </div>
          )}
        </div>

        <label
          htmlFor="avatar-upload"
          className={`absolute -bottom-2 -right-2 p-3 rounded-2xl shadow-lg transition-all text-[#0D0D0D] ${
            disabled
              ? 'bg-[#585759] cursor-not-allowed opacity-70'
              : 'bg-[#F2B705] cursor-pointer shadow-[#F2B705]/20 hover:scale-110 active:scale-95'
          }`}
        >
          <Camera className="w-5 h-5" />
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading || disabled}
            className="hidden"
          />
        </label>
      </div>
      <p className="text-[10px] text-[#585759] uppercase font-bold tracking-widest">
        {disabled
          ? 'Upload de avatar indisponível'
          : uploading
            ? 'Enviando...'
            : 'Clique na câmera para mudar'}
      </p>
    </div>
  )
}
