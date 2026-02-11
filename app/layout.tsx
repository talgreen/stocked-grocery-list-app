import { Analytics } from '@vercel/analytics/react'
import type { Metadata, Viewport } from 'next'
// import { Heebo } from 'next/font/google' // Temporarily disabled due to network issue
import { Toaster } from 'sonner'
import './globals.css'

// Temporarily using system fonts instead of Google Fonts
// const heebo = Heebo({
//   subsets: ['hebrew', 'latin'],
//   variable: '--font-heebo',
//   fallback: ['system-ui', 'arial', 'sans-serif'],
//   display: 'swap',
// })

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
    <html lang="he" dir="rtl" className="h-full bg-background">
      <body className="font-sans min-h-full bg-background" style={{ fontFamily: 'system-ui, -apple-system, arial, sans-serif' }}>
        <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-black z-50" />
        <div className="flex flex-col min-h-full bg-[#FDF6ED]">
          {children}
        </div>
        <Toaster 
          position="top-center" 
          richColors 
          className="pt-[env(safe-area-inset-top)] !top-[env(safe-area-inset-top)]"
        />
        <Analytics />
      </body>
    </html>
  )
}
