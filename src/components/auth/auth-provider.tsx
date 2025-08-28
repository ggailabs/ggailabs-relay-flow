"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const userData = localStorage.getItem('user_data')
          if (userData) {
            setUser(JSON.parse(userData))
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (email === "demo@flowrelay.com" && password === "demo123") {
        const userData: User = {
          id: "1",
          email: "demo@flowrelay.com",
          name: "Usuário Demo"
        }
        
        localStorage.setItem('auth_token', 'mock_token_' + Date.now())
        localStorage.setItem('user_data', JSON.stringify(userData))
        
        setUser(userData)
      } else {
        setError("Email ou senha inválidos")
        throw new Error("Email ou senha inválidos")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao fazer login")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const userData: User = {
        id: Date.now().toString(),
        email,
        name
      }
      
      localStorage.setItem('auth_token', 'mock_token_' + Date.now())
      localStorage.setItem('user_data', JSON.stringify(userData))
      
      setUser(userData)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao criar conta")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
    setError(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      isLoading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}