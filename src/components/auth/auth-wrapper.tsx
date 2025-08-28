"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "./login-form"
import { SignUpForm } from "./signup-form"

interface User {
  id: string
  email: string
  name: string
}

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          // In a real app, you would validate the token with your backend
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

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      // Simulate API call - in a real app, this would be an actual API request
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock user data - replace with actual API response
      if (email === "demo@flowrelay.com" && password === "demo123") {
        const userData: User = {
          id: "1",
          email: "demo@flowrelay.com",
          name: "Usuário Demo"
        }
        
        // Store auth data
        localStorage.setItem('auth_token', 'mock_token_' + Date.now())
        localStorage.setItem('user_data', JSON.stringify(userData))
        
        setUser(userData)
      } else {
        setAuthError("Email ou senha inválidos")
      }
    } catch (error) {
      setAuthError("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      // Simulate API call - in a real app, this would be an actual API request
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock user creation - replace with actual API response
      const userData: User = {
        id: Date.now().toString(),
        email,
        name
      }
      
      // Store auth data
      localStorage.setItem('auth_token', 'mock_token_' + Date.now())
      localStorage.setItem('user_data', JSON.stringify(userData))
      
      setUser(userData)
    } catch (error) {
      setAuthError("Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Flow Relay</h1>
            <p className="text-muted-foreground">Automação de Workflows</p>
          </div>
          
          {isSignUp ? (
            <SignUpForm
              onSignUp={handleSignUp}
              onLogin={() => setIsSignUp(false)}
              isLoading={isLoading}
              error={authError || undefined}
            />
          ) : (
            <LoginForm
              onLogin={handleLogin}
              onSignUp={() => setIsSignUp(true)}
              isLoading={isLoading}
              error={authError || undefined}
            />
          )}
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Demo: demo@flowrelay.com / demo123</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      {/* User info in the top right - you can integrate this with your existing header */}
      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center gap-2 bg-background/95 backdrop-blur border border-border rounded-lg px-3 py-2">
          <span className="text-sm font-medium">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    </>
  )
}