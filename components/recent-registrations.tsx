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
  image_url: string
  user_id: string
  status: string
}

export function RecentRegistrations() {
  const [bicycles, setBicycles] = useState<Bicycle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecentBicycles() {
      try {
        setLoading(true)

        // Obtener bicicletas con pagos completados
        const { data, error } = await supabase
          .from("bicycles")
          .select(`
            id, 
            brand, 
            model, 
            color, 
            serial_number, 
            created_at, 
            image_url,
            user_id,
            status
          `)
          .eq("payment_status", "completed")
          .order("created_at", { ascending: false })
          .limit(6)

        if (error) {
          console.error("Error fetching bicycles:", error)
          return
        }

        setBicycles(data || [])
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
      {bicycles.map((bicycle) => (
        <Card key={bicycle.id} className="overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="relative h-40 bg-gray-100">
            {bicycle.image_url ? (
              <Image
                src={bicycle.image_url || "/placeholder.svg"}
                alt={`${bicycle.brand} ${bicycle.model}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                <span>Sin imagen</span>
              </div>
            )}
            {bicycle.status === "stolen" && (
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
