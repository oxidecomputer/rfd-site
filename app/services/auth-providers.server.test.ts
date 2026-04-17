/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright Oxide Computer Company
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  _resetForTesting,
  ALL_PROVIDERS,
  getApiUrlMissingVars,
  getMissingEnvVars,
  getRequiredEnvVars,
  parseAuthProviders,
  validateAuthProviders,
} from './auth-providers.server'

describe('parseAuthProviders', () => {
  const originalEnv = process.env.AUTH_PROVIDERS

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.AUTH_PROVIDERS
    } else {
      process.env.AUTH_PROVIDERS = originalEnv
    }
  })

  it('returns all providers when AUTH_PROVIDERS is not set', () => {
    delete process.env.AUTH_PROVIDERS
    expect(parseAuthProviders()).toEqual(ALL_PROVIDERS)
  })

  it('returns all providers when AUTH_PROVIDERS is empty', () => {
    process.env.AUTH_PROVIDERS = ''
    expect(parseAuthProviders()).toEqual(ALL_PROVIDERS)
  })

  it('returns all providers when AUTH_PROVIDERS is whitespace', () => {
    process.env.AUTH_PROVIDERS = '   '
    expect(parseAuthProviders()).toEqual(ALL_PROVIDERS)
  })

  it('parses a single provider', () => {
    process.env.AUTH_PROVIDERS = 'github'
    expect(parseAuthProviders()).toEqual(['github'])
  })

  it('parses multiple providers', () => {
    process.env.AUTH_PROVIDERS = 'github,google'
    expect(parseAuthProviders()).toEqual(['github', 'google'])
  })

  it('parses all providers', () => {
    process.env.AUTH_PROVIDERS = 'github,google,email'
    expect(parseAuthProviders()).toEqual(['github', 'google', 'email'])
  })

  it('handles whitespace around provider names', () => {
    process.env.AUTH_PROVIDERS = ' github , google , email '
    expect(parseAuthProviders()).toEqual(['github', 'google', 'email'])
  })

  it('handles case-insensitive provider names', () => {
    process.env.AUTH_PROVIDERS = 'GITHUB,Google,EMAIL'
    expect(parseAuthProviders()).toEqual(['github', 'google', 'email'])
  })

  it('ignores unknown providers', () => {
    process.env.AUTH_PROVIDERS = 'github,unknown,google'
    expect(parseAuthProviders()).toEqual(['github', 'google'])
  })

  it('returns empty array when only unknown providers specified', () => {
    process.env.AUTH_PROVIDERS = 'unknown,invalid'
    expect(parseAuthProviders()).toEqual([])
  })

  it('ignores empty entries from extra commas', () => {
    process.env.AUTH_PROVIDERS = 'github,,google,'
    expect(parseAuthProviders()).toEqual(['github', 'google'])
  })
})

describe('getRequiredEnvVars', () => {
  it('returns correct env vars for github provider', () => {
    expect(getRequiredEnvVars('github')).toEqual([
      'RFD_API_CLIENT_ID',
      'RFD_API_CLIENT_SECRET',
      'RFD_API_GITHUB_CALLBACK_URL',
    ])
  })

  it('returns correct env vars for google provider', () => {
    expect(getRequiredEnvVars('google')).toEqual([
      'RFD_API_CLIENT_ID',
      'RFD_API_CLIENT_SECRET',
      'RFD_API_GOOGLE_CALLBACK_URL',
    ])
  })

  it('returns correct env vars for email provider', () => {
    expect(getRequiredEnvVars('email')).toEqual(['RFD_API_MLINK_SECRET'])
  })
})

describe('getApiUrlMissingVars', () => {
  const envVarsToRestore: Record<string, string | undefined> = {}

  beforeEach(() => {
    const allVars = ['RFD_API', 'RFD_API_BACKEND_URL', 'RFD_API_FRONTEND_URL']
    for (const varName of allVars) {
      envVarsToRestore[varName] = process.env[varName]
      delete process.env[varName]
    }
  })

  afterEach(() => {
    for (const [varName, value] of Object.entries(envVarsToRestore)) {
      if (value === undefined) {
        delete process.env[varName]
      } else {
        process.env[varName] = value
      }
    }
  })

  it('returns empty when RFD_API is set (legacy mode)', () => {
    process.env.RFD_API = 'https://api.example.com'
    expect(getApiUrlMissingVars()).toEqual([])
  })

  it('returns empty when both new vars are set', () => {
    process.env.RFD_API_BACKEND_URL = 'https://internal.api.example.com'
    process.env.RFD_API_FRONTEND_URL = 'https://api.example.com'
    expect(getApiUrlMissingVars()).toEqual([])
  })

  it('returns empty when backend is set with RFD_API fallback for frontend', () => {
    process.env.RFD_API_BACKEND_URL = 'https://internal.api.example.com'
    process.env.RFD_API = 'https://api.example.com'
    expect(getApiUrlMissingVars()).toEqual([])
  })

  it('returns empty when frontend is set with RFD_API fallback for backend', () => {
    process.env.RFD_API_FRONTEND_URL = 'https://api.example.com'
    process.env.RFD_API = 'https://internal.api.example.com'
    expect(getApiUrlMissingVars()).toEqual([])
  })

  it('returns helpful error when only backend is set', () => {
    process.env.RFD_API_BACKEND_URL = 'https://internal.api.example.com'
    expect(getApiUrlMissingVars()).toEqual([
      'RFD_API_FRONTEND_URL (or RFD_API as fallback)',
    ])
  })

  it('returns helpful error when only frontend is set', () => {
    process.env.RFD_API_FRONTEND_URL = 'https://api.example.com'
    expect(getApiUrlMissingVars()).toEqual(['RFD_API_BACKEND_URL (or RFD_API as fallback)'])
  })

  it('returns error when no API URL vars are set', () => {
    expect(getApiUrlMissingVars()).toEqual([
      'RFD_API (or RFD_API_BACKEND_URL + RFD_API_FRONTEND_URL)',
    ])
  })
})

describe('getMissingEnvVars', () => {
  const envVarsToRestore: Record<string, string | undefined> = {}

  beforeEach(() => {
    // Save all relevant env vars
    const allVars = [
      'RFD_API',
      'RFD_API_BACKEND_URL',
      'RFD_API_FRONTEND_URL',
      'RFD_API_CLIENT_ID',
      'RFD_API_CLIENT_SECRET',
      'RFD_API_GITHUB_CALLBACK_URL',
      'RFD_API_GOOGLE_CALLBACK_URL',
      'RFD_API_MLINK_SECRET',
    ]
    for (const varName of allVars) {
      envVarsToRestore[varName] = process.env[varName]
      delete process.env[varName]
    }
  })

  afterEach(() => {
    // Restore all env vars
    for (const [varName, value] of Object.entries(envVarsToRestore)) {
      if (value === undefined) {
        delete process.env[varName]
      } else {
        process.env[varName] = value
      }
    }
  })

  it('returns API URL error plus provider vars when none are set for github', () => {
    expect(getMissingEnvVars('github')).toEqual([
      'RFD_API (or RFD_API_BACKEND_URL + RFD_API_FRONTEND_URL)',
      'RFD_API_CLIENT_ID',
      'RFD_API_CLIENT_SECRET',
      'RFD_API_GITHUB_CALLBACK_URL',
    ])
  })

  it('returns API URL error plus provider vars when none are set for google', () => {
    expect(getMissingEnvVars('google')).toEqual([
      'RFD_API (or RFD_API_BACKEND_URL + RFD_API_FRONTEND_URL)',
      'RFD_API_CLIENT_ID',
      'RFD_API_CLIENT_SECRET',
      'RFD_API_GOOGLE_CALLBACK_URL',
    ])
  })

  it('returns API URL error plus provider vars when none are set for email', () => {
    expect(getMissingEnvVars('email')).toEqual([
      'RFD_API (or RFD_API_BACKEND_URL + RFD_API_FRONTEND_URL)',
      'RFD_API_MLINK_SECRET',
    ])
  })

  it('returns empty array when all required vars are set for github (legacy RFD_API)', () => {
    process.env.RFD_API = 'https://api.example.com'
    process.env.RFD_API_CLIENT_ID = 'client-id'
    process.env.RFD_API_CLIENT_SECRET = 'client-secret'
    process.env.RFD_API_GITHUB_CALLBACK_URL = 'https://example.com/callback'

    expect(getMissingEnvVars('github')).toEqual([])
  })

  it('returns empty array when using split URLs for github', () => {
    process.env.RFD_API_BACKEND_URL = 'https://internal.api.example.com'
    process.env.RFD_API_FRONTEND_URL = 'https://api.example.com'
    process.env.RFD_API_CLIENT_ID = 'client-id'
    process.env.RFD_API_CLIENT_SECRET = 'client-secret'
    process.env.RFD_API_GITHUB_CALLBACK_URL = 'https://example.com/callback'

    expect(getMissingEnvVars('github')).toEqual([])
  })

  it('returns empty array when all required vars are set for google', () => {
    process.env.RFD_API = 'https://api.example.com'
    process.env.RFD_API_CLIENT_ID = 'client-id'
    process.env.RFD_API_CLIENT_SECRET = 'client-secret'
    process.env.RFD_API_GOOGLE_CALLBACK_URL = 'https://example.com/callback'

    expect(getMissingEnvVars('google')).toEqual([])
  })

  it('returns empty array when all required vars are set for email', () => {
    process.env.RFD_API = 'https://api.example.com'
    process.env.RFD_API_MLINK_SECRET = 'secret'

    expect(getMissingEnvVars('email')).toEqual([])
  })

  it('returns only missing vars when some are set for github', () => {
    process.env.RFD_API = 'https://api.example.com'
    process.env.RFD_API_CLIENT_ID = 'client-id'
    // Missing: RFD_API_CLIENT_SECRET and RFD_API_GITHUB_CALLBACK_URL

    expect(getMissingEnvVars('github')).toEqual([
      'RFD_API_CLIENT_SECRET',
      'RFD_API_GITHUB_CALLBACK_URL',
    ])
  })

  it('returns only missing vars when some are set for email', () => {
    process.env.RFD_API = 'https://api.example.com'
    // Missing: RFD_API_MLINK_SECRET

    expect(getMissingEnvVars('email')).toEqual(['RFD_API_MLINK_SECRET'])
  })
})

describe('validateAuthProviders', () => {
  const envVarsToRestore: Record<string, string | undefined> = {}

  beforeEach(() => {
    // Save all relevant env vars
    const allVars = [
      'AUTH_PROVIDERS',
      'RFD_API',
      'RFD_API_BACKEND_URL',
      'RFD_API_FRONTEND_URL',
      'RFD_API_CLIENT_ID',
      'RFD_API_CLIENT_SECRET',
      'RFD_API_GITHUB_CALLBACK_URL',
      'RFD_API_GOOGLE_CALLBACK_URL',
      'RFD_API_MLINK_SECRET',
    ]
    for (const varName of allVars) {
      envVarsToRestore[varName] = process.env[varName]
      delete process.env[varName]
    }
    _resetForTesting()
  })

  afterEach(() => {
    // Restore all env vars
    for (const [varName, value] of Object.entries(envVarsToRestore)) {
      if (value === undefined) {
        delete process.env[varName]
      } else {
        process.env[varName] = value
      }
    }
    _resetForTesting()
  })

  it('returns valid with providers when all env vars are set', () => {
    process.env.AUTH_PROVIDERS = 'github'
    process.env.RFD_API = 'https://api.example.com'
    process.env.RFD_API_CLIENT_ID = 'client-id'
    process.env.RFD_API_CLIENT_SECRET = 'client-secret'
    process.env.RFD_API_GITHUB_CALLBACK_URL = 'https://example.com/callback'

    const result = validateAuthProviders()

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.providers).toEqual(['github'])
    }
  })

  it('returns valid for multiple providers when all env vars are set', () => {
    process.env.AUTH_PROVIDERS = 'github,email'
    process.env.RFD_API = 'https://api.example.com'
    process.env.RFD_API_CLIENT_ID = 'client-id'
    process.env.RFD_API_CLIENT_SECRET = 'client-secret'
    process.env.RFD_API_GITHUB_CALLBACK_URL = 'https://example.com/callback'
    process.env.RFD_API_MLINK_SECRET = 'secret'

    const result = validateAuthProviders()

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.providers).toEqual(['github', 'email'])
    }
  })

  it('returns invalid with errors when env vars are missing', () => {
    process.env.AUTH_PROVIDERS = 'github'
    // No env vars set

    const result = validateAuthProviders()

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].provider).toBe('github')
      expect(result.errors[0].missing).toEqual([
        'RFD_API (or RFD_API_BACKEND_URL + RFD_API_FRONTEND_URL)',
        'RFD_API_CLIENT_ID',
        'RFD_API_CLIENT_SECRET',
        'RFD_API_GITHUB_CALLBACK_URL',
      ])
    }
  })

  it('returns errors for each misconfigured provider', () => {
    process.env.AUTH_PROVIDERS = 'github,google,email'
    // No env vars set

    const result = validateAuthProviders()

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors).toHaveLength(3)
      expect(result.errors.map((e) => e.provider)).toEqual(['github', 'google', 'email'])
    }
  })

  it('returns valid when only some providers are enabled and configured', () => {
    process.env.AUTH_PROVIDERS = 'email'
    process.env.RFD_API = 'https://api.example.com'
    process.env.RFD_API_MLINK_SECRET = 'secret'

    const result = validateAuthProviders()

    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.providers).toEqual(['email'])
    }
  })

  it('returns only partially missing vars in errors', () => {
    process.env.AUTH_PROVIDERS = 'github'
    process.env.RFD_API = 'https://api.example.com'
    process.env.RFD_API_CLIENT_ID = 'client-id'
    // Missing: RFD_API_CLIENT_SECRET and RFD_API_GITHUB_CALLBACK_URL

    const result = validateAuthProviders()

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.errors[0].missing).toEqual([
        'RFD_API_CLIENT_SECRET',
        'RFD_API_GITHUB_CALLBACK_URL',
      ])
    }
  })
})
