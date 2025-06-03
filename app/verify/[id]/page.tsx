"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import {
  BikeIcon as BicycleIcon,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Mail,
  Calendar,
  Hash,
  Palette,
  Info,
  AlertTriangle,
} from "lucide-react"

interface BicycleVerification {
  id: string
  serial_number: string
  brand: string
  model: string
  color: string
  characteristics: string | null
  registration_date: string
  payment_status: boolean
  theft_status: string
  profiles: {
    full_name: string
    email: string
    phone: string
  } | null
  bicycle_images: Array<{
    id: string
    image_url: string
  }> | null
}

export default function VerifyPage({ params }: { params: { id: string } }) {
  const supabase = createClientComponentClient()
  const [bicycle, setBicycle] = useState<BicycleVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBicycleVerification = async () => {
      try {
        const { data, error } = await supabase
          .from("bicycles")
          .select(`
            id,
            serial_number,
            brand,
            model,
            color,
            characteristics,
            registration_date,
            payment_status,
            theft_status,
            profiles (
              full_name,
              email,
              phone
            ),
            bicycle_images (
              id,
              image_url
            )
          `)
          .eq("id", params.id)
          .eq("payment_status", true)
          .single()

        if (error) {
          if (error.code === "PGRST116") {
            setError("Bicicleta no encontrada o no está registrada oficialmente")
          } else {
            throw error
          }
        } else if (data) {
          const mappedData: BicycleVerification = {
            id: data.id,
            serial_number: data.serial_number,
            brand: data.brand,
            model: data.model,
            color: data.color,
            characteristics: data.characteristics,
            registration_date: data.registration_date,
            payment_status: data.payment_status,
            theft_status: data.theft_status || "safe",
            profiles: data.profiles,
            bicycle_images: data.bicycle_images || [],
          }
          setBicycle(mappedData)
        }
      } catch (error) {
        console.error("Error al verificar bicicleta:", error)
        setError("Error al cargar la información de verificación")
      } finally {
        setLoading(false)
      }
    }

    fetchBicycleVerification()
  }, [supabase, params.id])

  const handleCallOwner = () => {
    if (bicycle?.profiles?.phone) {
      window.open(`tel:${bicycle.profiles.phone}`, "_self")
    }
  }

  const handleEmailOwner = () => {
    if (bicycle?.profiles?.email) {
      window.open(
        `mailto:${bicycle.profiles.email}?subject=Consulta sobre tu bicicleta ${bicycle.brand} ${bicycle.model}`,
        "_self",
      )
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 lg:grid-cols-2">
              <Skeleton className="aspect-square rounded-lg" />
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !bicycle) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <XCircle className="mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-xl font-semibold">Verificación fallida</h2>
            <p className="text-center text-muted-foreground">{error || "No se pudo verificar esta bicicleta"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isStolen = bicycle.theft_status === "reported_stolen"

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header de verificación */}
        <Card className={`${isStolen ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isStolen ? (
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                )}
                <div>
                  <CardTitle className={`text-2xl ${isStolen ? "text-red-800" : "text-green-800"}`}>
                    {isStolen ? "⚠️ BICICLETA REPORTADA COMO ROBADA" : "✅ Bicicleta Verificada"}
                  </CardTitle>
                  <p className={`${isStolen ? "text-red-700" : "text-green-700"}`}>
                    {isStolen
                      ? "Esta bicicleta ha sido reportada como robada. Contacta a las autoridades."
                      : "Esta bicicleta está oficialmente registrada en el RNB"}
                  </p>
                </div>
              </div>
              <Badge variant={isStolen ? "destructive" : "default"} className="text-lg px-4 py-2">
                {isStolen ? "ROBADA" : "VERIFICADA"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Información principal */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Imágenes */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
              {bicycle.bicycle_images && bicycle.bicycle_images.length > 0 ? (
                <img
                  src={bicycle.bicycle_images[0].image_url || "/placeholder.svg"}
                  alt={`${bicycle.brand} ${bicycle.model}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <BicycleIcon className="h-24 w-24 text-muted-foreground opacity-20" />
                </div>
              )}
            </div>

            {bicycle.bicycle_images && bicycle.bicycle_images.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {bicycle.bicycle_images.slice(1, 4).map((image) => (
                  <div key={image.id} className="relative aspect-square overflow-hidden rounded-md border">
                    <img src={image.image_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Información de la bicicleta */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {bicycle.brand} {bicycle.model}
              </h1>
              <div className="flex items-center space-x-2 text-lg text-muted-foreground">
                <Hash className="h-5 w-5" />
                <span>Serie: {bicycle.serial_number}</span>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center space-x-3">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Color</p>
                  <p className="text-lg">{bicycle.color}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de registro</p>
                  <p className="text-lg">{formatDate(bicycle.registration_date)}</p>
                </div>
              </div>

              {bicycle.characteristics && (
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Características</p>
                    <p className="text-lg">{bicycle.characteristics}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información del propietario - AHORA PÚBLICA */}
        {bicycle.profiles && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <User className="mr-2 h-5 w-5" />
                Contactar al Propietario
              </CardTitle>
              <p className="text-sm text-blue-700">
                Si encontraste esta bicicleta o tienes información sobre ella, puedes contactar al propietario:
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-medium text-muted-foreground">Propietario</p>
                  </div>
                  <p className="text-xl font-bold text-blue-800">{bicycle.profiles.full_name}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center space-x-2 mb-2">
                    <Phone className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  </div>
                  <p className="text-xl font-bold text-green-800">{bicycle.profiles.phone}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                </div>
                <p className="text-lg font-medium text-purple-800">{bicycle.profiles.email}</p>
              </div>

              {/* Botones de contacto */}
              <div className="flex gap-4 pt-4">
                <Button onClick={handleCallOwner} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Phone className="mr-2 h-4 w-4" />
                  Llamar
                </Button>
                <Button
                  onClick={handleEmailOwner}
                  variant="outline"
                  className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información adicional */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Esta verificación confirma que la bicicleta está registrada en el
              </p>
              <p className="font-semibold text-lg">Registro Nacional de Bicicletas (RNB)</p>
              <p className="text-xs text-muted-foreground">ID de verificación: {bicycle.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
