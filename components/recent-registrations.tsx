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
  created_at: string
  theft_status: string
  image_url: string | null
}

export function RecentRegistrations() {
  const [bicycles, setBicycles] = useState<Bicycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentBicycles() {
      try {
        console.log("🚲 Buscando bicicletas recientes...")

        // Obtener bicicletas
        const { data: bicyclesData, error: bicyclesError } = await supabase
          .from("bicycles")
          .select("id, brand, model, color, created_at, theft_status")
          .eq("payment_status", true)
          .order("created_at", { ascending: false })
          .limit(6)

        if (bicyclesError || !bicyclesData) {
          console.log("❌ Error obteniendo bicicletas:", bicyclesError)
          setBicycles([])
          setLoading(false)
          return
        }

        console.log(`✅ ${bicyclesData.length} bicicletas encontradas`)

        // Obtener imágenes para todas las bicicletas
        const bicycleIds = bicyclesData.map((bike) => bike.id)
        const { data: images, error: imagesError } = await supabase
          .from("bicycle_images")
          .select("bicycle_id, image_url")
          .in("bicycle_id", bicycleIds)

        if (imagesError) {
          console.log("❌ Error obteniendo imágenes:", imagesError)
        } else {
          console.log(`🖼️ ${images?.length || 0} imágenes encontradas`)
        }

        // Crear mapa de imágenes
        const imageMap: { [key: string]: string } = {}
        if (images) {
          images.forEach((img) => {
            if (!imageMap[img.bicycle_id]) {
              imageMap[img.bicycle_id] = img.image_url
            }
          })
        }

        // Combinar datos
        const result = bicyclesData.map((bike) => ({
          ...bike,
          image_url: imageMap[bike.id] || null,
        }))

        console.log("📊 Resultado final:")
        result.forEach((bike) => {
          console.log(`  🚲 ${bike.brand} ${bike.model} - ${bike.image_url ? "✅ Con imagen" : "❌ Sin imagen"}`)
        })

        setBicycles(result)
      } catch (error) {
        console.error("💥 Error:", error)
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
      {bicycles.map((bicycle) => (
        <Card key={bicycle.id} className="overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="relative h-40 bg-gray-100">
            {bicycle.image_url ? (
              <Image
                src={bicycle.image_url || "/placeholder.svg"}
                alt={`${bicycle.brand} ${bicycle.model}`}
                fill
                className="object-cover"
                onLoad={() => console.log(`✅ Imagen cargada: ${bicycle.brand} ${bicycle.model}`)}
                onError={(e) => {
                  console.log(`❌ Error cargando imagen: ${bicycle.brand} ${bicycle.model}`)
                  console.log(`🔗 URL problemática: ${bicycle.image_url}`)
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
      ))}
    </div>
  )
}
