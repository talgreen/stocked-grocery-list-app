import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Handle manifest.json request
  if (request.nextUrl.pathname === '/manifest.json') {
    // Get the current list ID from the referrer URL
    const referrer = request.headers.get('referer') || ''
    const match = referrer.match(/\/share\/([^\/\?]+)/)
    const listId = match ? match[1] : request.cookies.get('listId')?.value

    // Read the manifest template
    const manifestData = {
      name: 'Stocked',
      short_name: 'Stocked',
      description: 'רשימת קניות חכמה',
      start_url: listId ? `/share/${listId}` : '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      icons: [
        {
          src: '/web-app-manifest-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/web-app-manifest-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }

    // Return the modified manifest with appropriate cache headers
    return new NextResponse(JSON.stringify(manifestData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'Vary': 'Cookie, Accept-Encoding'
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/manifest.json',
} 