"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { CreditCard, Calendar, Users, AlertTriangle, ArrowDownCircle, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Subscription {
  id: string
  plan_type: string
  bicycle_limit: number
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  pending_plan_change: string | null
  pending_plan_change_date: string | null
  created_at: string
}

const planDetails = {
  basic: { name: "Básico", price: 40, bicycles: 1 },
  standard: { name: "Estándar", price: 60, bicycles: 2 },
  family: { name: "Familiar", price: 120, bicycles: 4 },
  premium: { name: "Premium", price: 180, bicycles: 6 },
}

export default function ManageSubscriptionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>("")

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchSubscription()
  }, [user, router])

  const fetchSubscription = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setSubscription(data)
    } catch (error) {
      console.error("Error al cargar suscripción:", error)
      setError("Error al cargar la suscripción")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async (immediate = false) => {
    if (!subscription) return

    setActionLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ immediate }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al cancelar suscripción")
      }

      // Recargar datos
      await fetchSubscription()

      // Mostrar mensaje de éxito
      alert(result.message)
    } catch (error) {
      console.error("Error al cancelar suscripción:", error)
      setError(error instanceof Error ? error.message : "Error al cancelar suscripción")
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangePlan = async () => {
    if (!subscription || !selectedPlan) return

    setActionLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/subscriptions/change-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPlan: selectedPlan }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al cambiar plan")
      }

      // Recargar datos
      await fetchSubscription()

      // Mostrar mensaje de éxito
      alert(result.message)
      setSelectedPlan("")
    } catch (error) {
      console.error("Error al cambiar plan:", error)
      setError(error instanceof Error ? error.message : "Error al cambiar plan")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <CreditCard className="mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold">No tienes suscripción activa</h2>
              <p className="mb-6 text-center text-muted-foreground">
                Necesitas una suscripción para registrar bicicletas
              </p>
              <Button onClick={() => router.push("/subscription")}>Ver planes de suscripción</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Verificar si el plan existe en planDetails
  const validPlan = planDetails[subscription.plan_type as keyof typeof planDetails]
  if (!validPlan) {
    console.warn(`Plan type ${subscription.plan_type} not found in planDetails`)
  }

  const currentPlan = planDetails[subscription.plan_type as keyof typeof planDetails] || {
    name: subscription.plan_type,
    price: 0,
    bicycles: subscription.bicycle_limit,
  }
  const availablePlans = Object.entries(planDetails).filter(([key]) => key !== subscription.plan_type)

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Gestionar Suscripción</h1>
          <p className="text-muted-foreground">Administra tu plan y configuraciones de suscripción</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Información actual de la suscripción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Plan Actual</span>
              <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                {subscription.status === "active" ? "Activo" : subscription.status}
              </Badge>
            </CardTitle>
            <CardDescription>Información de tu suscripción actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">{currentPlan.name}</p>
                  <p className="text-sm text-muted-foreground">${currentPlan.price} MXN/mes</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">{currentPlan.bicycles} bicicletas</p>
                  <p className="text-sm text-muted-foreground">Límite del plan</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
                  <p className="text-sm text-muted-foreground">Próxima renovación</p>
                </div>
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertTitle>Suscripción programada para cancelación</AlertTitle>
                <AlertDescription>
                  Tu suscripción se cancelará el {formatDate(subscription.current_period_end)}. No se realizarán más
                  cobros después de esta fecha.
                </AlertDescription>
              </Alert>
            )}

            {subscription.pending_plan_change && (
              <Alert>
                <ArrowDownCircle className="h-4 w-4" />
                <AlertTitle>Cambio de plan programado</AlertTitle>
                <AlertDescription>
                  Tu plan cambiará a {planDetails[subscription.pending_plan_change as keyof typeof planDetails]?.name}{" "}
                  el{" "}
                  {subscription.pending_plan_change_date
                    ? formatDate(subscription.pending_plan_change_date)
                    : "próximo período"}
                  .
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Cambiar plan */}
        {!subscription.cancel_at_period_end && (
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Plan</CardTitle>
              <CardDescription>Actualiza tu plan para cambiar el límite de bicicletas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecciona un nuevo plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map(([key, plan]) => (
                      <SelectItem key={key} value={key}>
                        {plan.name} - ${plan.price} MXN/mes ({plan.bicycles} bicicletas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleChangePlan} disabled={!selectedPlan || actionLoading}>
                  {actionLoading ? "Cambiando..." : "Cambiar Plan"}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  • <strong>Upgrade:</strong> El cambio es inmediato y se cobra la diferencia prorrateada
                </p>
                <p>
                  • <strong>Downgrade:</strong> El cambio se aplica al final del período actual
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancelar suscripción */}
        {!subscription.cancel_at_period_end && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
              <CardDescription>Acciones irreversibles para tu suscripción</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      Cancelar al final del período
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tu suscripción se cancelará el {formatDate(subscription.current_period_end)}. Podrás seguir
                        usando el servicio hasta esa fecha.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Mantener suscripción</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleCancelSubscription(false)} disabled={actionLoading}>
                        {actionLoading ? "Cancelando..." : "Cancelar al final del período"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      Cancelar inmediatamente
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cancelar inmediatamente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tu suscripción se cancelará inmediatamente y perderás acceso al servicio. Esta acción no se
                        puede deshacer y no se realizarán reembolsos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Mantener suscripción</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancelSubscription(true)}
                        disabled={actionLoading}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {actionLoading ? "Cancelando..." : "Cancelar inmediatamente"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
