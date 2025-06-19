"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Calendar, CreditCard, Users, Bike, Crown, Star, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ManageSubscriptionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [bicycleCount, setBicycleCount] = useState(0)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/auth/login?redirectTo=/subscription/manage")
      return
    }

    fetchSubscriptionData()
  }, [user, authLoading, router])

  const fetchSubscriptionData = async () => {
    if (!user) return

    try {
      // Obtener suscripción activa
      const { data: subscriptionData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      if (subError) {
        console.error("Error fetching subscription:", subError)
        router.push("/subscription")
        return
      }

      setSubscription(subscriptionData)

      // Contar bicicletas registradas
      const { count, error: countError } = await supabase
        .from("bicycles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (!countError) {
        setBicycleCount(count || 0)
      }
    } catch (error) {
      console.error("Error:", error)
      router.push("/subscription")
    } finally {
      setLoading(false)
    }
  }

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case "premium":
        return <Crown className="w-6 h-6 text-yellow-500" />
      case "familiar":
        return <Users className="w-6 h-6 text-blue-500" />
      case "estándar":
        return <Star className="w-6 h-6 text-green-500" />
      default:
        return <Bike className="w-6 h-6 text-gray-500" />
    }
  }

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case "premium":
        return "bg-gradient-to-r from-yellow-400 to-orange-500"
      case "familiar":
        return "bg-gradient-to-r from-blue-400 to-blue-600"
      case "estándar":
        return "bg-gradient-to-r from-green-400 to-green-600"
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-600"
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-4xl py-10">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container mx-auto max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>No tienes suscripción activa</CardTitle>
            <CardDescription>Necesitas una suscripción para acceder a esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/subscription">
              <Button>Ver planes de suscripción</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const usagePercentage = (bicycleCount / subscription.bicycle_limit) * 100

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <div className="mb-6">
        <Link href="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al perfil
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header de suscripción */}
        <Card className={`${getPlanColor(subscription.plan_type)} text-white`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getPlanIcon(subscription.plan_type)}
                <div>
                  <CardTitle className="text-2xl capitalize">Plan {subscription.plan_type}</CardTitle>
                  <CardDescription className="text-white/80">
                    Suscripción activa desde {new Date(subscription.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <CheckCircle className="w-4 h-4 mr-1" />
                Activa
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Uso de bicicletas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bike className="w-5 h-5" />
              Uso de bicicletas
            </CardTitle>
            <CardDescription>
              Has registrado {bicycleCount} de {subscription.bicycle_limit} bicicletas permitidas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bicicletas registradas</span>
                <span>
                  {bicycleCount} / {subscription.bicycle_limit}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>

            {usagePercentage >= 80 && (
              <Alert className={usagePercentage >= 100 ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}>
                <AlertCircle className={`h-4 w-4 ${usagePercentage >= 100 ? "text-red-600" : "text-yellow-600"}`} />
                <AlertTitle className={usagePercentage >= 100 ? "text-red-800" : "text-yellow-800"}>
                  {usagePercentage >= 100 ? "Límite alcanzado" : "Cerca del límite"}
                </AlertTitle>
                <AlertDescription className={usagePercentage >= 100 ? "text-red-700" : "text-yellow-700"}>
                  {usagePercentage >= 100
                    ? "Has alcanzado el límite de tu plan. Actualiza para registrar más bicicletas."
                    : "Estás cerca del límite de tu plan. Considera actualizar si necesitas más espacio."}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Link href="/bicycles">
                <Button variant="outline" size="sm">
                  Ver mis bicicletas
                </Button>
              </Link>
              {bicycleCount < subscription.bicycle_limit && (
                <Link href="/bicycles/register">
                  <Button size="sm">Registrar nueva bicicleta</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detalles de la suscripción */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Período actual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inicio:</span>
                <span>{new Date(subscription.current_period_start).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fin:</span>
                <span>{new Date(subscription.current_period_end).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {subscription.status === "active" ? "Activa" : subscription.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Información de pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Stripe:</span>
                <span className="text-sm font-mono">{subscription.stripe_subscription_id?.slice(-8) || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="text-sm font-mono">{subscription.stripe_customer_id?.slice(-8) || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Beneficios del plan */}
        <Card>
          <CardHeader>
            <CardTitle>Beneficios de tu plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Hasta {subscription.bicycle_limit} bicicletas registradas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Certificados oficiales PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Códigos QR de verificación</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Sistema de reportes de robo</span>
              </div>
              {(subscription.plan_type === "familiar" || subscription.plan_type === "premium") && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Gestión familiar</span>
                </div>
              )}
              {subscription.plan_type === "premium" && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Soporte prioritario 24/7</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <Card>
          <CardHeader>
            <CardTitle>Gestionar suscripción</CardTitle>
            <CardDescription>Opciones para modificar o cancelar tu suscripción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/subscription">
                <Button variant="outline" className="w-full sm:w-auto">
                  Cambiar plan
                </Button>
              </Link>
              <Button variant="destructive" className="w-full sm:w-auto" disabled>
                Cancelar suscripción
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Para cancelar tu suscripción, contacta con soporte.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
