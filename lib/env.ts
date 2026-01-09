/**
 * Environment variable validation
 * Ensures all required environment variables are present before the app starts
 */

interface EnvConfig {
  // Firebase configuration (client-side)
  NEXT_PUBLIC_FIREBASE_API_KEY: string
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string
  NEXT_PUBLIC_FIREBASE_APP_ID: string

  // OpenAI configuration (server-side)
  OPENAI_API_KEY?: string // Optional on client-side
}

/**
 * Validates that all required environment variables are set
 * Only throws in production runtime, warns during build
 */
function validateEnv(): EnvConfig {
  const requiredClientVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ] as const

  const requiredServerVars = [
    'OPENAI_API_KEY',
  ] as const

  const missing: string[] = []
  const isServer = typeof window === 'undefined'
  const isBuild = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build'

  // Validate client-side variables (always required)
  for (const varName of requiredClientVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  // Validate server-side variables (only on server)
  if (isServer) {
    for (const varName of requiredServerVars) {
      if (!process.env[varName]) {
        missing.push(varName)
      }
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      'Please check your .env.local file and ensure all required variables are set.\n' +
      'See .env.example for a template.'

    // During build, just warn - let the build complete
    if (isBuild) {
      console.warn('[ENV WARNING]', message)
    } else {
      // At runtime, throw error
      throw new Error(message)
    }
  }

  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  }
}

/**
 * Validated environment variables
 * Warns during build, throws at runtime if any required variables are missing
 */
export const env = validateEnv()
