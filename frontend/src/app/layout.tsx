import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitManager',
  description: 'Sistema de Gestão para Academias',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  )
}
