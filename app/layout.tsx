import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const heebo = Heebo({ 
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
})

export const metadata: Metadata = {
  title: 'Stocked',
  description: 'רשימת קניות חכמה',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-heebo`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
