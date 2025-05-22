"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { BikeIcon as Bicycle } from "lucide-react"
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
  }
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
            )
          `,
          )
          .eq("payment_status", true)
          .order("registration_date", { ascending: false })
          .limit(6)

        if (error) throw error

        setBicycles(data || [])
      } catch (error) {
        console.error("Error al cargar bicicletas recientes:", error)
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
          <p className="text-muted-foreground">No hay bicicletas registradas aún</p>
        </div>
      ) : (
        bicycles.map((bicycle) => (
          <Link href={`/search?serial=${bicycle.serial_number}`} key={bicycle.id}>
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-bike-primary/10 to-bike-primary/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bicycle className="h-5 w-5 text-bike-primary" />
                      <h3 className="font-semibold">
                        {bicycle.brand} {bicycle.model}
                      </h3>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      Registrada
                    </Badge>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Serie: {bicycle.serial_number.substring(0, 4)}...
                    {bicycle.serial_number.substring(bicycle.serial_number.length - 4)}
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Propietario: {bicycle.profiles.full_name.split(" ")[0]}</span>
                    <span>{formatDate(bicycle.registration_date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  )
}
