"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/auth-helpers-nextjs"

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshSession: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const refreshSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) {
        console.error("Error al obtener sesión:", error)
        setUser(null)
      } else {
        setUser(session?.user ?? null)
        console.log("Sesión actualizada:", !!session?.user)
      }
    } catch (error) {
      console.error("Error inesperado al obtener sesión:", error)
      setUser(null)
    }
  }

  useEffect(() => {
    // Obtener sesión inicial
    refreshSession().finally(() => setLoading(false))

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Cambio de estado de auth:", event, !!session?.user)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return <AuthContext.Provider value={{ user, loading, refreshSession }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
