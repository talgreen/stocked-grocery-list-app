'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global application error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <html dir="rtl">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              שגיאה קריטית
            </h2>
            <p className="text-gray-600 mb-6">
              אירעה שגיאה קריטית באפליקציה. אנחנו מצטערים על אי הנוחות.
            </p>

            {error.message && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-6 text-right">
                <p className="text-sm text-red-800 font-mono">{error.message}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                נסה שוב
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                טען מחדש את האפליקציה
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              שגיאה זו נרשמה ותטופל בהקדם. אנא רענן את הדפדפן.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
