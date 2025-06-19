"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { BikeIcon as BicycleIcon, Plus, Search, CheckCircle, AlertTriangle, Download, QrCode, Eye } from "lucide-react"
import Link from "next/link"

interface Bicycle {
  id: string
  serial_number: string
  brand: string
  model: string
  color: string
  bike_type: string
  year: number | null
  wheel_size: string | null
  groupset: string | null
  characteristics: string | null
  registration_date: string
  payment_status: boolean
  theft_status: string
  bicycle_images: { image_url: string }[]
}

function BicyclesContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [bicycles, setBicycles] = useState<Bicycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)

  const success = searchParams.get("success")

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/auth/login?redirectTo=/bicycles")
      return
    }

    fetchData()
  }, [user, authLoading, router])

  const fetchData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Verificar suscripción
      const { data: subscriptionData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)

      if (subscriptionData && subscriptionData.length > 0) {
        setHasActiveSubscription(true)
        setSubscriptionData(subscriptionData[0])
      }

      // Cargar bicicletas
      const { data: bicyclesData, error: bicyclesError } = await supabase
        .from("bicycles")
        .select(`
          *,
          bicycle_images (
            image_url
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (bicyclesError) throw bicyclesError

      setBicycles(bicyclesData || [])
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setError("Error al cargar las bicicletas")
    } finally {
      setLoading(false)
    }
  }

  const getTheftStatusBadge = (status: string) => {
    switch (status) {
      case "stolen":
        return <Badge variant="destructive">Reportada como robada</Badge>
      case "recovered":
        return <Badge variant="secondary">Recuperada</Badge>
      default:
        return <Badge variant="outline">Activa</Badge>
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-6xl py-10">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="container mx-auto max-w-6xl py-10">
      <div className="space-y-6">
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>¡Bicicleta registrada exitosamente!</AlertTitle>
            <AlertDescription>Tu bicicleta ha sido registrada en el sistema nacional.</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis Bicicletas</h1>
            <p className="text-muted-foreground">
              {bicycles.length} bicicleta{bicycles.length !== 1 ? "s" : ""} registrada{bicycles.length !== 1 ? "s" : ""}
              {subscriptionData && ` de ${subscriptionData.bicycle_limit} permitidas`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/search">
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Buscar bicicletas
              </Button>
            </Link>
            {hasActiveSubscription && (
              <Link href="/bicycles/register">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar bicicleta
                </Button>
              </Link>
            )}
          </div>
        </div>

        {!hasActiveSubscription && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Suscripción requerida</AlertTitle>
            <AlertDescription>
              Necesitas una suscripción activa para registrar nuevas bicicletas.{" "}
              <Link href="/subscription" className="underline">
                Ver planes disponibles
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {bicycles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BicycleIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No tienes bicicletas registradas</CardTitle>
              <CardDescription className="mb-4">
                Registra tu primera bicicleta para comenzar a usar el sistema nacional de registro.
              </CardDescription>
              {hasActiveSubscription ? (
                <Link href="/bicycles/register">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar mi primera bicicleta
                  </Button>
                </Link>
              ) : (
                <Link href="/subscription">
                  <Button>Ver planes de suscripción</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bicycles.map((bicycle) => (
              <Card key={bicycle.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {bicycle.brand} {bicycle.model}
                      </CardTitle>
                      <CardDescription>
                        {bicycle.bike_type} • {bicycle.color}
                        {bicycle.year && ` • ${bicycle.year}`}
                      </CardDescription>
                    </div>
                    {getTheftStatusBadge(bicycle.theft_status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bicycle.bicycle_images && bicycle.bicycle_images.length > 0 && (
                    <div className="aspect-video rounded-md overflow-hidden bg-muted">
                      <img
                        src={bicycle.bicycle_images[0].image_url || "/placeholder.svg"}
                        alt={`${bicycle.brand} ${bicycle.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Número de serie:</span>
                      <span className="font-mono">{bicycle.serial_number}</span>
                    </div>
                    {bicycle.wheel_size && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rodada:</span>
                        <span>{bicycle.wheel_size}</span>
                      </div>
                    )}
                    {bicycle.groupset && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Grupo:</span>
                        <span>{bicycle.groupset}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Registrada:</span>
                      <span>{new Date(bicycle.registration_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/bicycles/${bicycle.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </Button>
                    </Link>
                    <Link href={`/bicycles/${bicycle.id}/qr`}>
                      <Button variant="outline" size="sm">
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch("/api/bicycles/generate-certificate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ bicycleId: bicycle.id }),
                          })

                          if (response.ok) {
                            const blob = await response.blob()
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement("a")
                            a.href = url
                            a.download = `certificado-${bicycle.serial_number}.pdf`
                            document.body.appendChild(a)
                            a.click()
                            window.URL.revokeObjectURL(url)
                            document.body.removeChild(a)
                          }
                        } catch (error) {
                          console.error("Error al descargar certificado:", error)
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BicyclesPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-6xl py-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <BicyclesContent />
    </Suspense>
  )
}
