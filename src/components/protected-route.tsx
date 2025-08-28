"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { SignUpForm } from "@/components/auth/signup-form"
import { useState } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, login, signup, isLoading, error } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)

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
              onSignUp={signup}
              onLogin={() => setIsSignUp(false)}
              isLoading={isLoading}
              error={error || undefined}
            />
          ) : (
            <LoginForm
              onLogin={login}
              onSignUp={() => setIsSignUp(true)}
              isLoading={isLoading}
              error={error || undefined}
            />
          )}
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Demo: demo@flowrelay.com / demo123</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}