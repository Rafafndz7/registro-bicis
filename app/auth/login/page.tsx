"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react"

// Esquema de validación
const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(1, { message: "La contraseña es requerida" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const supabase = createClientComponentClient({
    options: {
      // Aumentar el tiempo de espera para redes lentas
      global: {
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            // Aumentar timeout a 30 segundos
            signal: options?.signal || AbortSignal.timeout(30000),
            // Asegurar que las credenciales se envían
            credentials: "include",
          })
        },
      },
    },
  })

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error checking session:", sessionError)
          setDebugInfo(`Error de sesión: ${sessionError.message}`)
          return
        }

        if (session) {
          router.push("/profile")
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setDebugInfo(`Error inesperado: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    checkSession()
  }, [router, supabase.auth])

  // Manejar countdown para rate limit
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isRateLimited && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      setIsRateLimited(false)
      setRetryCount(0)
      setError(null)
      setCountdown(60)
    }
    return () => clearInterval(timer)
  }, [isRateLimited, countdown])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleRateLimit = () => {
    setIsRateLimited(true)
    setError(
      `Demasiados intentos de inicio de sesión. Por favor espera ${countdown} segundos antes de intentar nuevamente.`,
    )
  }

  const onSubmit = async (data: LoginFormValues) => {
    if (isRateLimited) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    setDebugInfo(null)

    try {
      // Agregar un pequeño delay para evitar spam
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
      }

      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        throw error
      }

      // Reset retry count on success
      setRetryCount(0)

      // Redirigir al perfil después del inicio de sesión exitoso
      router.push("/profile")
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error)
      setDebugInfo(`Error completo: ${JSON.stringify(error)}`)

      // Manejar diferentes tipos de errores
      if (error.message?.includes("rate limit") || error.message?.includes("Too many requests")) {
        handleRateLimit()
      } else if (error.message?.includes("Invalid login credentials")) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.")
      } else if (error.message?.includes("Email not confirmed")) {
        setError("Por favor confirma tu email antes de iniciar sesión.")
      } else {
        setError(`Error al iniciar sesión: ${error.message || "Intenta nuevamente."}`)
        setRetryCount((prev) => prev + 1)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getErrorIcon = () => {
    if (isRateLimited) {
      return <Clock className="h-4 w-4" />
    }
    return <AlertCircle className="h-4 w-4" />
  }

  const getErrorVariant = () => {
    if (isRateLimited) {
      return "default" as const
    }
    return "destructive" as const
  }

  const resetClient = async () => {
    try {
      // Limpiar cualquier sesión existente
      await supabase.auth.signOut()
      // Recargar la página para reiniciar todo
      window.location.reload()
    } catch (error) {
      console.error("Error resetting client:", error)
      setDebugInfo(`Error al reiniciar: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="container flex items-center justify-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-6 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Éxito</AlertTitle>
              <AlertDescription className="text-green-600">{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant={getErrorVariant()} className="mb-6">
              {getErrorIcon()}
              <AlertTitle>{isRateLimited ? `Límite de intentos (${countdown}s)` : "Error"}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {retryCount > 2 && !isRateLimited && (
            <Alert className="mb-6 bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-600">Múltiples intentos detectados</AlertTitle>
              <AlertDescription className="text-yellow-600">
                Si continúas teniendo problemas, verifica tus credenciales o contacta soporte.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="correo@ejemplo.com" {...field} disabled={isRateLimited} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} disabled={isRateLimited} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting || isRateLimited}>
                {isSubmitting ? "Iniciando sesión..." : isRateLimited ? `Esperando (${countdown}s)` : "Iniciar sesión"}
              </Button>
            </form>
          </Form>

          {debugInfo && (
            <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-2">
              <p className="text-xs text-gray-500">Información de depuración:</p>
              <pre className="mt-1 max-h-20 overflow-auto text-xs text-gray-600">{debugInfo}</pre>
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={resetClient} className="text-xs">
              <RefreshCw className="mr-1 h-3 w-3" /> Reiniciar cliente
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/auth/register" className="text-bike-primary hover:underline">
              Registrarse
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            <Link href="/auth/reset-password" className="text-bike-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          {isRateLimited && (
            <p className="text-xs text-center text-muted-foreground">
              El límite se restablecerá automáticamente en {countdown} segundos
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
