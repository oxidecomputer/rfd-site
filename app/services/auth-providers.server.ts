/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

export type AuthProvider = 'github' | 'google' | 'email'
export const ALL_PROVIDERS: AuthProvider[] = ['github', 'google', 'email']

/**
 * Checks if a valid API URL configuration exists.
 * Returns empty array if valid, or an array with a helpful error message.
 *
 * Valid configurations:
 * - RFD_API only (legacy, both URLs same)
 * - RFD_API_BACKEND_URL + RFD_API_FRONTEND_URL (split URLs)
 * - One new var + RFD_API as fallback for the other
 */
export function getApiUrlMissingVars(): string[] {
  const hasLegacy = !!process.env.RFD_API
  const hasBackend = !!process.env.RFD_API_BACKEND_URL
  const hasFrontend = !!process.env.RFD_API_FRONTEND_URL

  switch (true) {
    case hasLegacy:
    case hasBackend && hasFrontend:
      return []
    case hasBackend && !hasFrontend:
      return ['RFD_API_FRONTEND_URL (or RFD_API as fallback)']
    case hasFrontend && !hasBackend:
      return ['RFD_API_BACKEND_URL (or RFD_API as fallback)']
    default:
      return ['RFD_API (or RFD_API_BACKEND_URL + RFD_API_FRONTEND_URL)']
  }
}

// Exported for testing
export function parseAuthProviders(): AuthProvider[] {
  const envValue = process.env.AUTH_PROVIDERS

  // Backwards compatibility: if not set, enable all providers
  if (!envValue || envValue.trim() === '') {
    return [...ALL_PROVIDERS]
  }

  const requestedProviders = envValue
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p !== '')

  const validProviders: AuthProvider[] = []
  for (const provider of requestedProviders) {
    if (ALL_PROVIDERS.includes(provider as AuthProvider)) {
      validProviders.push(provider as AuthProvider)
    } else {
      console.warn(
        `[auth-providers] Unknown provider "${provider}" in AUTH_PROVIDERS, ignoring`,
      )
    }
  }

  return validProviders
}

// Exported for testing
// Note: RFD_API URL validation is handled separately by getApiUrlMissingVars()
export function getRequiredEnvVars(provider: AuthProvider): string[] {
  switch (provider) {
    case 'github':
      return ['RFD_API_CLIENT_ID', 'RFD_API_CLIENT_SECRET', 'RFD_API_GITHUB_CALLBACK_URL']
    case 'google':
      return ['RFD_API_CLIENT_ID', 'RFD_API_CLIENT_SECRET', 'RFD_API_GOOGLE_CALLBACK_URL']
    case 'email':
      return ['RFD_API_MLINK_SECRET']
    default:
      return []
  }
}

// Exported for testing
export function getMissingEnvVars(provider: AuthProvider): string[] {
  const required = getRequiredEnvVars(provider)
  const missing = required.filter((varName) => !process.env[varName])

  // Add API URL missing vars (handled centrally for all providers)
  const apiUrlMissing = getApiUrlMissingVars()

  return [...apiUrlMissing, ...missing]
}

export type ValidationResult =
  | { valid: true; providers: AuthProvider[] }
  | { valid: false; errors: { provider: AuthProvider; missing: string[] }[] }

/**
 * Validates that all requested providers have their required environment variables set.
 * Returns a ValidationResult indicating success or listing missing variables.
 */
export function validateAuthProviders(): ValidationResult {
  const requestedProviders = parseAuthProviders()

  const errors: { provider: AuthProvider; missing: string[] }[] = []
  for (const provider of requestedProviders) {
    const missing = getMissingEnvVars(provider)
    if (missing.length > 0) {
      errors.push({ provider, missing })
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, providers: requestedProviders }
}

/**
 * Validates auth providers and exits the process if any are misconfigured.
 * Call this during app startup to ensure required environment variables are set.
 */
export function validateAuthProvidersOrExit(): void {
  const result = validateAuthProviders()
  if (!result.valid) {
    console.error('[auth-providers] ERROR: Missing required environment variables')
    for (const { provider, missing } of result.errors) {
      console.error(`  Provider "${provider}" requires: ${missing.join(', ')}`)
    }
    console.error(
      '\nEither set the missing environment variables or remove the provider from AUTH_PROVIDERS.',
    )
    process.exit(1)
  }
}

// Lazy initialization - providers are computed on first access
let _enabledProviders: AuthProvider[] | null = null

export function getEnabledProviders(): AuthProvider[] {
  if (_enabledProviders === null) {
    // Validate on first access if not already done
    const result = validateAuthProviders()
    if (!result.valid) {
      // In production, this would have been caught by validateAuthProvidersOrExit
      // For safety, default to empty providers if validation wasn't run
      console.error('[auth-providers] WARNING: Providers accessed before validation')
      _enabledProviders = []
    } else {
      _enabledProviders = result.providers
    }
  }
  return _enabledProviders
}

export function isProviderEnabled(provider: AuthProvider): boolean {
  return getEnabledProviders().includes(provider)
}

// Reset function for testing
export function _resetForTesting(): void {
  _enabledProviders = null
}
