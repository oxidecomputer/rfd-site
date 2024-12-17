if (!process.env.API_KEYS) {
  throw new Error('API_KEYS environment variable is required')
}

export const API_KEYS = new Set(process.env.API_KEYS.split(','))
