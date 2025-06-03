"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react"

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      router.push("/subscription")
      return
    }

    if (!user) {
      console.log("Esperando usuario...")
      return
    }

    const processSubscription = async () => {
      try {
        console.log("Procesando suscripción con sessionId:", sessionId, "userId:", user.id)
        setLoading(true)
        setError(null)

        const response = await fetch("/api/subscriptions/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            userId: user.id,
          }),
        })

        const result = await response.json()
        console.log("Resultado del procesamiento:", result)

        if (!response.ok) {
          throw new Error(result.error || `Error ${response.status}`)
        }

        if (result.error) {
          throw new Error(result.error)
        }

        setSuccess(true)
      } catch (error) {
        console.error("Error al procesar suscripción:", error)
        setError((error as Error).message || "Error al procesar la suscripción")
      } finally {
        setLoading(false)
      }
    }

    // Esperar un poco para asegurar que el usuario esté cargado
    const timer = setTimeout(processSubscription, 1000)
    return () => clearTimeout(timer)
  }, [sessionId, user, router])

  if (!sessionId) {
    return null
  }

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Procesando tu suscripción</CardTitle>
          <CardDescription>Registro Nacional de Bicicletas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-lg text-center">Procesando tu suscripción...</p>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Verificando el pago con Stripe y activando tu cuenta.
              </p>
              <div className="mt-4 text-xs text-muted-foreground">
                <p>Session ID: {sessionId}</p>
                <p>Usuario: {user?.id || "Cargando..."}</p>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800">¡Suscripción exitosa!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Tu suscripción ha sido procesada correctamente. Ahora tienes acceso completo a todas las funciones del
                  Registro Nacional de Bicicletas.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">¿Qué puedes hacer ahora?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Registrar bicicletas ilimitadas</li>
                  <li>• Generar certificados oficiales</li>
                  <li>• Reportar robos</li>
                  <li>• Acceso a estadísticas avanzadas</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error al procesar la suscripción</AlertTitle>
                <AlertDescription>{error || "Ocurrió un error inesperado"}</AlertDescription>
              </Alert>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">¿Qué hacer ahora?</AlertTitle>
                <AlertDescription className="text-amber-700">
                  <div className="space-y-2">
                    <p>1. Tu pago fue procesado correctamente en Stripe</p>
                    <p>2. El error es solo al guardar en nuestra base de datos</p>
                    <p>3. Puedes intentar nuevamente o contactar soporte</p>
                    <p className="text-xs mt-2">ID de sesión: {sessionId}</p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          {success ? (
            <>
              <Link href="/subscription">
                <Button>Ver mi suscripción</Button>
              </Link>
              <Link href="/bicycles/register">
                <Button variant="outline">Registrar bicicleta</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/subscription">
                <Button variant="outline">Volver a suscripciones</Button>
              </Link>
              {error && (
                <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                  Intentar nuevamente
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
