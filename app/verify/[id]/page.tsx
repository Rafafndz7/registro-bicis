"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDate } from "@/lib/utils"
import { CheckCircle2, AlertCircle, Shield, User, Calendar, Hash } from "lucide-react"
import { RNBLogo } from "@/components/rnb-logo"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface BicycleVerification {
  id: string
  serial_number: string
  brand: string
  model: string
  color: string
  characteristics: string | null
  registration_date: string
  payment_status: boolean
  profiles: {
    full_name: string
    phone: string
  } | null
  bicycle_images: {
    image_url: string
  }[]
}

export default function VerifyBicyclePage({ params }: { params: { id: string } }) {
  const [bicycle, setBicycle] = useState<BicycleVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchBicycleVerification = async () => {
      try {
        const { data, error } = await supabase
          .from("bicycles")
          .select(
            `
            id,
            serial_number,
            brand,
            model,
            color,
            characteristics,
            registration_date,
            payment_status,
            profiles (
              full_name,
              phone
            ),
            bicycle_images (
              image_url
            )
          `,
          )
          .eq("id", params.id)
          .eq("payment_status", true)
          .single()

        if (error) {
          console.error("Error de Supabase:", error)
          throw error
        }

        if (data) {
          // Mapear los datos para asegurar el tipo correcto
          const mappedData: BicycleVerification = {
            id: data.id,
            serial_number: data.serial_number,
            brand: data.brand,
            model: data.model,
            color: data.color,
            characteristics: data.characteristics,
            registration_date: data.registration_date,
            payment_status: data.payment_status,
            profiles: data.profiles,
            bicycle_images: data.bicycle_images || [],
          }
          setBicycle(mappedData)
        } else {
          setError("No se encontró la bicicleta")
        }
      } catch (error) {
        console.error("Error al verificar bicicleta:", error)
        setError("No se encontró una bicicleta registrada con este ID o no está completamente registrada")
        setBicycle(null)
      } finally {
        setLoading(false)
      }
    }

    fetchBicycleVerification()
  }, [supabase, params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bike-primary/5 to-white">
        <div className="container py-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <Skeleton className="mx-auto h-20 w-20 rounded-full" />
              <Skeleton className="mx-auto mt-4 h-8 w-64" />
              <Skeleton className="mx-auto mt-2 h-4 w-48" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error || !bicycle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bike-primary/5 to-white">
        <div className="container py-10">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <RNBLogo size={80} />
              <h1 className="mt-4 text-3xl font-bold text-bike-primary">Verificación RNB</h1>
              <p className="mt-2 text-muted-foreground">Sistema de verificación de bicicletas registradas</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  <CardTitle>Bicicleta no encontrada</CardTitle>
                </div>
                <CardDescription>No se pudo verificar el registro de esta bicicleta</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error de verificación</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>

                <div className="mt-6 text-center">
                  <p className="mb-4 text-sm text-muted-foreground">
                    Si crees que esto es un error, por favor contacta al propietario de la bicicleta o verifica que el
                    código QR sea válido.
                  </p>
                  <Link href="/">
                    <Button variant="outline">Volver al inicio</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bike-primary/5 to-white">
      <div className="container py-10">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <RNBLogo size={80} />
            <h1 className="mt-4 text-3xl font-bold text-bike-primary">Verificación RNB</h1>
            <p className="mt-2 text-muted-foreground">Sistema de verificación de bicicletas registradas</p>
          </div>

          {/* Estado de verificación */}
          <Alert className="mb-8 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">✅ Bicicleta verificada</AlertTitle>
            <AlertDescription className="text-green-700">
              Esta bicicleta está oficialmente registrada en el Sistema Nacional de Registro de Bicicletas (RNB)
            </AlertDescription>
          </Alert>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Imagen de la bicicleta */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gradient-to-r from-bike-primary/10 to-bike-primary/5">
                    {bicycle.bicycle_images && bicycle.bicycle_images.length > 0 ? (
                      <img
                        src={bicycle.bicycle_images[0].image_url || "/placeholder.svg"}
                        alt={`${bicycle.brand} ${bicycle.model}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <RNBLogo size={120} className="opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-green-500 text-white">
                        <Shield className="mr-1 h-3 w-3" />
                        Verificada
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Imágenes adicionales */}
              {bicycle.bicycle_images && bicycle.bicycle_images.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {bicycle.bicycle_images.slice(1, 4).map((image, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-md border">
                      <img
                        src={image.image_url || "/placeholder.svg"}
                        alt={`Vista ${index + 2}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información de la bicicleta */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Hash className="h-5 w-5 text-bike-primary" />
                    <span>Información de la Bicicleta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-bike-primary">
                      {bicycle.brand} {bicycle.model}
                    </h3>
                    <p className="text-muted-foreground">Número de serie: {bicycle.serial_number}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Color</p>
                      <p className="text-lg">{bicycle.color}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Fecha de registro</p>
                      <p className="text-lg">{formatDate(bicycle.registration_date)}</p>
                    </div>
                  </div>

                  {bicycle.characteristics && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Características</p>
                      <p className="text-lg">{bicycle.characteristics}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-bike-primary" />
                    <span>Información del Propietario</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre del propietario</p>
                    <p className="text-lg font-medium">{bicycle.profiles?.full_name || "No disponible"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Teléfono de contacto</p>
                    <p className="text-lg">{bicycle.profiles?.phone || "No disponible"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-bike-primary" />
                    <span>Detalles del Registro</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID de registro</p>
                    <p className="font-mono text-sm">{bicycle.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <Badge className="bg-green-500 text-white">Registro completo y verificado</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Verificado el</p>
                    <p className="text-sm">
                      {new Date().toLocaleDateString("es-MX")} a las {new Date().toLocaleTimeString("es-MX")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer informativo */}
          <div className="mt-8 text-center">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>¿Encontraste esta bicicleta?</AlertTitle>
              <AlertDescription>
                Si encontraste esta bicicleta y no eres el propietario, por favor contacta al número de teléfono
                mostrado arriba para devolverla. El sistema RNB ayuda a reunir bicicletas perdidas con sus dueños.
              </AlertDescription>
            </Alert>
          </div>

          <div className="mt-6 text-center">
            <Link href="/">
              <Button variant="outline">Registrar mi bicicleta</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
