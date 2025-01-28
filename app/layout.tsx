import type { Metadata, Viewport } from 'next'
import { Heebo } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const heebo = Heebo({ 
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  title: 'Stocked',
  description: 'רשימת קניות חכמה',
  manifest: '/manifest.json',
  icons: {
    // Favicon
    icon: [{ url: '/favicon.ico' }],
    // iOS home screen icon
    apple: [
      { url: '/apple-icon.png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'apple-mobile-web-app-title': 'Stocked',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className={`${heebo.variable} font-heebo h-full`}>
        <div className="flex flex-col min-h-full bg-[#FDF6ED]">
          {children}
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
