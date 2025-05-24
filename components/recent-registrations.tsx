"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { BikeIcon as Bicycle } from "lucide-react"
import { RNBLogo } from "@/components/rnb-logo"
import Link from "next/link"

interface BicycleRegistration {
  id: string
  serial_number: string
  brand: string
  model: string
  color: string
  registration_date: string
  profiles: {
    full_name: string
  } | null
  bicycle_images: {
    image_url: string
  }[]
}

export function RecentRegistrations() {
  const [bicycles, setBicycles] = useState<BicycleRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchRecentBicycles = async () => {
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
            registration_date,
            profiles (
              full_name
            ),
            bicycle_images (
              image_url
            )
          `,
          )
          .eq("payment_status", true)
          .order("registration_date", { ascending: false })
          .limit(6)

        if (error) throw error

        // Mapear los datos para asegurar el tipo correcto
        const mappedData: BicycleRegistration[] = (data || []).map((item: any) => ({
          id: item.id,
          serial_number: item.serial_number,
          brand: item.brand,
          model: item.model,
          color: item.color,
          registration_date: item.registration_date,
          profiles: item.profiles,
          bicycle_images: item.bicycle_images || [],
        }))

        setBicycles(mappedData)
      } catch (error) {
        console.error("Error al cargar bicicletas recientes:", error)
        setBicycles([]) // Establecer array vacío en caso de error
      } finally {
        setLoading(false)
      }
    }

    fetchRecentBicycles()
  }, [supabase])

  if (loading) {
    return (
      <div className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4">
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="mb-4 h-4 w-1/2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-3">
      {bicycles.length === 0 ? (
        <div className="col-span-full text-center">
          <RNBLogo size={60} className="mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No hay bicicletas registradas aún</p>
        </div>
      ) : (
        bicycles.map((bicycle) => (
          <Link href={`/search?serial=${bicycle.serial_number}`} key={bicycle.id}>
            <Card className="overflow-hidden transition-all hover:shadow-md hover:scale-105">
              <CardContent className="p-0">
                {/* Imagen de la bicicleta */}
                <div className="relative aspect-video overflow-hidden bg-gradient-to-r from-bike-primary/10 to-bike-primary/5">
                  {bicycle.bicycle_images && bicycle.bicycle_images.length > 0 ? (
                    <img
                      src={bicycle.bicycle_images[0].image_url || "/placeholder.svg"}
                      alt={`${bicycle.brand} ${bicycle.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Bicycle className="h-16 w-16 text-bike-primary opacity-20" />
                    </div>
                  )}

                  {/* Logo RNB en la esquina */}
                  <div className="absolute top-2 left-2">
                    <RNBLogo size={30} />
                  </div>

                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm border-bike-primary text-bike-primary"
                    >
                      Registrada
                    </Badge>
                  </div>
                </div>

                {/* Información de la bicicleta */}
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-bike-primary">
                      {bicycle.brand} {bicycle.model}
                    </h3>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Serie: {bicycle.serial_number.substring(0, 4)}...
                    {bicycle.serial_number.substring(bicycle.serial_number.length - 4)}
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Propietario: {bicycle.profiles?.full_name?.split(" ")[0] || "Usuario"}</span>
                    <span>{formatDate(bicycle.registration_date)}</span>
                  </div>
                  <div className="mt-2 text-xs text-bike-primary font-medium">✓ Verificado por RNB</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  )
}
