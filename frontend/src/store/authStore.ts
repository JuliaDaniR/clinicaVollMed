import { create } from 'zustand'

interface User {
  email: string
  id: string
  roles: string[]
}

interface DecodedToken {
  email: string
  id: string
  roles: string[]
  exp: number
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  tokenExp: number | null
  setTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

const parseJwt = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const decoded = JSON.parse(jsonPayload)
    return {
      email: decoded.sub,
      id: decoded.id,
      roles: decoded.roles || [],
      exp: decoded.exp,
    }
  } catch (e) {
    console.error('Failed to parse JWT token', e)
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const initialAccess = localStorage.getItem('accessToken')
  const initialRefresh = localStorage.getItem('refreshToken')
  const decoded = initialAccess ? parseJwt(initialAccess) : null

  return {
    accessToken: initialAccess,
    refreshToken: initialRefresh,
    user: decoded ? { email: decoded.email, id: decoded.id, roles: decoded.roles } : null,
    tokenExp: decoded ? decoded.exp : null,
    setTokens: (accessToken, refreshToken) => {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      const decoded = parseJwt(accessToken)
      set({ 
        accessToken, 
        refreshToken, 
        user: decoded ? { email: decoded.email, id: decoded.id, roles: decoded.roles } : null,
        tokenExp: decoded ? decoded.exp : null 
      })
    },
    clearAuth: () => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({ accessToken: null, refreshToken: null, user: null, tokenExp: null })
    },
  }
})

