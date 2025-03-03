export function rateLimit({ interval, uniqueTokenPerInterval = 500 }) {
  const tokens = new Map()
  
  return {
    check: async (limit: number, token: string) => {
      const now = Date.now()
      const windowStart = now - interval
      
      const tokenCount = tokens.get(token) || []
      const validTokens = tokenCount.filter(timestamp => timestamp > windowStart)
      
      if (validTokens.length >= limit) {
        throw new Error('Rate limit exceeded')
      }
      
      validTokens.push(now)
      tokens.set(token, validTokens)
      
      return true
    }
  }
} 