"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDate } from "@/lib/utils"
import { CreditCard, Shield, CheckCircle, XCircle, Clock, AlertTriangle, ArrowLeft } from "lucide-react"

interface Subscription {
  id: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
}

export default function SubscriptionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const fetchSubscription = async () => {
      try {
        console.log("Buscando suscripción para usuario:", user.id)

        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error al cargar suscripción:", error)
          throw error
        }

        console.log("Suscripción encontrada:", data)
        setSubscription(data)
      } catch (error) {
        console.error("Error al cargar suscripción:", error)
        setError("Error al cargar información de suscripción")
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user, router, supabase])

  const handleCreateSubscription = async () => {
    try {
      setCreating(true)
      setError(null)

      console.log("Creando suscripción...")

      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      console.log("Respuesta de creación:", result)

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.url) {
        console.log("Redirigiendo a Stripe:", result.url)
        window.location.href = result.url
      } else {
        throw new Error("No se recibió URL de pago")
      }
    } catch (error) {
      console.error("Error al crear suscripción:", error)
      setError("Error al crear suscripción: " + (error as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return

    try {
      setCanceling(true)
      setError(null)

      console.log("Cancelando suscripción:", subscription.stripe_subscription_id)

      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      })

      const result = await response.json()
      console.log("Respuesta de cancelación:", result)

      if (result.error) {
        throw new Error(result.error)
      }

      // Actualizar el estado local
      setSubscription((prev) => (prev ? { ...prev, status: "canceled" } : null))
      alert("Suscripción cancelada exitosamente")
    } catch (error) {
      console.error("Error al cancelar suscripción:", error)
      setError("Error al cancelar suscripción: " + (error as Error).message)
    } finally {
      setCanceling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" /> Activa
          </Badge>
        )
      case "past_due":
        return (
          <Badge variant="destructive">
            <Clock className="mr-1 h-3 w-3" /> Vencida
          </Badge>
        )
      case "canceled":
        return (
          <Badge variant="outline">
            <XCircle className="mr-1 h-3 w-3" /> Cancelada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container py-10 max-w-4xl mx-auto">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al perfil
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Suscripción</h1>
          <p className="text-muted-foreground">Gestiona tu suscripción al Registro Nacional de Bicicletas</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {subscription && subscription.status === "active" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-green-600" />
                    Suscripción Activa
                  </CardTitle>
                  <CardDescription>Tu suscripción está activa y al día</CardDescription>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Período actual</h3>
                  <p className="text-lg">
                    {subscription.current_period_start && formatDate(subscription.current_period_start)} -{" "}
                    {subscription.current_period_end && formatDate(subscription.current_period_end)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Próximo pago</h3>
                  <p className="text-lg">
                    {subscription.current_period_end && formatDate(subscription.current_period_end)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <h3 className="font-medium text-green-800">Beneficios incluidos:</h3>
                <ul className="mt-2 space-y-1 text-sm text-green-700">
                  <li>✓ Registro ilimitado de bicicletas</li>
                  <li>✓ Certificados oficiales</li>
                  <li>✓ Códigos QR de verificación</li>
                  <li>✓ Reportes de robo</li>
                  <li>✓ Soporte prioritario</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <Button variant="destructive" onClick={handleCancelSubscription} disabled={canceling} size="sm">
                  {canceling ? "Cancelando..." : "Cancelar suscripción"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Puedes cancelar en cualquier momento. El acceso continuará hasta el final del período actual.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Suscripción Mensual
              </CardTitle>
              <CardDescription>Accede a todas las funciones del Registro Nacional de Bicicletas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold">$40 MXN</div>
                <div className="text-muted-foreground">por mes</div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Incluye:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Registro ilimitado de bicicletas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Certificados oficiales en PDF
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Códigos QR para verificación
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Sistema de reportes de robo
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Soporte técnico prioritario
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Domiciliación automática
                  </li>
                </ul>
              </div>

              {subscription && subscription.status !== "active" && (
                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="flex items-center">
                    {getStatusBadge(subscription.status)}
                    <span className="ml-2 text-sm text-amber-800">
                      {subscription.status === "past_due" &&
                        "Tu suscripción está vencida. Renueva para continuar usando el servicio."}
                      {subscription.status === "canceled" &&
                        "Tu suscripción fue cancelada. Puedes reactivarla en cualquier momento."}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreateSubscription} disabled={creating} className="w-full" size="lg">
                {creating
                  ? "Procesando..."
                  : subscription?.status === "canceled"
                    ? "Reactivar suscripción"
                    : "Suscribirse ahora"}
              </Button>
            </CardFooter>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Información sobre domiciliación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Al suscribirte, autorizas el cargo automático mensual de $40 MXN a tu tarjeta de crédito o débito. Puedes
              cancelar tu suscripción en cualquier momento desde esta página.
            </p>
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="font-medium text-blue-800">Ventajas de la domiciliación:</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-700">
                <li>• Sin interrupciones en el servicio</li>
                <li>• No necesitas recordar fechas de pago</li>
                <li>• Proceso 100% seguro con Stripe</li>
                <li>• Puedes cancelar cuando quieras</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Debug info en desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify({ subscription, user: user?.id }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
