import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          דף לא נמצא
        </h2>
        <p className="text-gray-600 mb-6">
          הדף שחיפשת לא קיים או הועבר למיקום אחר.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            חזור לעמוד הבית
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          קוד שגיאה: 404
        </p>
      </div>
    </div>
  )
}
