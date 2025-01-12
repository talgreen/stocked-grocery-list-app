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
  manifest: '/manifest.json',
  icons: {
    // Favicon
    icon: [{ url: '/favicon.ico' }],
    // iOS home screen icon
    apple: [{ url: '/apple-icon.png' }],
  },
  other: {
    'apple-mobile-web-app-title': 'Stocked',
    'apple-mobile-web-app-capable': 'yes',
  },
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
