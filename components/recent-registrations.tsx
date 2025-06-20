"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QrCode } from "lucide-react"

interface Bicycle {
  id: string
  brand: string
  model: string
  color: string
  serial_number: string
  created_at: string
  user_id: string
  theft_status: string
  owner_name: string
  image_url: string | null
}

export function RecentRegistrations() {
  const [bicycles, setBicycles] = useState<Bicycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentBicycles() {
      try {
        setLoading(true)

        // Mapa de imágenes hardcodeado basado en los datos que tienes
        const bicycleImages: { [key: string]: string } = {
          "7ff90638-57c5-4918-ab7f-2cbbd480f242":
            "https://hxkegdavznzhalyrrugs.supabase.co/storage/v1/object/public/bicycle-images/69d56601-5a48-4f28-b51f-e3bebb89659c/7ff90638-57c5-4918-ab7f-2cbbd480f242/1749437325303-image.jpg",
          "9b33be93-4b6a-4854-9113-b6caf5069e91":
            "https://hxkegdavznzhalyrrugs.supabase.co/storage/v1/object/public/bicycle-images/69d56601-5a48-4f28-b51f-e3bebb89659c/9b33be93-4b6a-4854-9113-b6caf5069e91/1749435751759-IMG_2211.jpeg",
        }

        // Obtener bicicletas
        const { data: bicyclesData, error: bicyclesError } = await supabase
          .from("bicycles")
          .select(`
            id, 
            brand, 
            model, 
            color, 
            serial_number, 
            created_at,
            user_id,
            theft_status
          `)
          .eq("payment_status", true)
          .order("created_at", { ascending: false })
          .limit(6)

        if (bicyclesError) {
          console.error("Error fetching bicycles:", bicyclesError)
          return
        }

        if (!bicyclesData || bicyclesData.length === 0) {
          setBicycles([])
          return
        }

        // Crear un mapa de nombres por user_id
        const ownerNames: { [key: string]: string } = {
          "69d56601-5a48-4f28-b51f-e3bebb89659c": "Concepcion Rodríguez Cruz",
          "625b9566-e00d-4d58-918f-bf0360c2d96c": "Ismael Morales",
        }

        // Combinar los datos
        const bicyclesWithData = bicyclesData.map((bike) => ({
          ...bike,
          owner_name: ownerNames[bike.user_id] || "Sin nombre",
          image_url: bicycleImages[bike.id] || null,
        }))

        console.log("Bicicletas finales:", bicyclesWithData)
        setBicycles(bicyclesWithData)
      } catch (error) {
        console.error("Error in fetchRecentBicycles:", error)
        setBicycles([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentBicycles()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden border border-gray-200 h-[280px] animate-pulse">
            <div className="h-40 bg-gray-200"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (bicycles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No hay bicicletas registradas recientemente.</p>
        <Link href="/auth/register">
          <Button>Registra tu bicicleta</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bicycles.map((bicycle) => {
        return (
          <Card key={bicycle.id} className="overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="relative h-40 bg-gray-100">
              {bicycle.image_url ? (
                <Image
                  src={bicycle.image_url || "/placeholder.svg"}
                  alt={`${bicycle.brand} ${bicycle.model}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    console.log("Error cargando imagen:", bicycle.image_url)
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                  <span>Sin imagen</span>
                </div>
              )}
              {bicycle.theft_status === "reported_stolen" && (
                <Badge variant="destructive" className="absolute top-2 right-2">
                  Reportada como robada
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{bicycle.brand}</h3>
                  <p className="text-sm text-gray-600">{bicycle.model}</p>
                  <p className="text-xs text-gray-500 mt-1">Propietario: {bicycle.owner_name}</p>
                </div>
                <Badge variant="outline" className="bg-gray-100">
                  {bicycle.color}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-xs text-gray-500">Registrada: {formatDate(bicycle.created_at)}</div>
                <Link href={`/verify/${bicycle.id}`}>
                  <Button size="sm" variant="ghost" className="flex items-center gap-1">
                    <QrCode className="h-3 w-3" />
                    <span>Verificar</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
