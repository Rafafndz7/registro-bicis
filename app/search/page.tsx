"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { BikeIcon as Bicycle, Search, AlertCircle, CheckCircle2, Phone } from "lucide-react"
import { RecentRegistrations } from "@/components/recent-registrations"

interface BicycleSearchResult {
  id: string
  serial_number: string
  brand: string
  model: string
  color: string
  registration_date: string
  payment_status: boolean
  profiles: {
    full_name: string
    phone: string
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialSerialNumber = searchParams.get("serial") || ""
  const [serialNumber, setSerialNumber] = useState(initialSerialNumber)
  const [searchResult, setSearchResult] = useState<BicycleSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (initialSerialNumber) {
      handleSearch(new Event("submit") as any)
    }
  }, [initialSerialNumber])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!serialNumber.trim()) {
      setError("Por favor, ingresa un número de serie")
      return
    }

    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      // Buscar bicicleta por número de serie
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
          payment_status,
          profiles (
            full_name,
            phone
          )
        `,
        )
        .eq("serial_number", serialNumber.trim())
        .eq("payment_status", true) // Solo bicicletas con pago completado
        .single()

      if (error) throw error

      setSearchResult(data)
    } catch (error) {
      console.error("Error al buscar bicicleta:", error)
      setSearchResult(null)
      setError("No se encontró ninguna bicicleta registrada con ese número de serie")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold">Buscar Bicicleta</h1>
        <Card>
          <CardHeader>
            <CardTitle>Verificar registro de bicicleta</CardTitle>
            <CardDescription>
              Ingresa el número de serie de la bicicleta para verificar si está registrada en el sistema nacional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="serial-number" className="text-sm font-medium">
                  Número de serie
                </label>
                <div className="flex space-x-2">
                  <Input
                    id="serial-number"
                    placeholder="Ej. ABC123456789"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? "Buscando..." : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  El número de serie generalmente se encuentra debajo del pedalier o en el tubo del asiento
                </p>
              </div>
            </form>

            {loading && (
              <div className="mt-6 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {error && !loading && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No encontrada</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {searchResult && !loading && (
              <div className="mt-6 space-y-6">
                <Alert className="bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">Bicicleta registrada</AlertTitle>
                  <AlertDescription className="text-green-600">
                    Esta bicicleta está oficialmente registrada en el sistema nacional
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border p-4">
                  <div className="mb-4 flex items-center space-x-2">
                    <Bicycle className="h-5 w-5 text-bike-primary" />
                    <h3 className="text-lg font-semibold">
                      {searchResult.brand} {searchResult.model}
                    </h3>
                  </div>

                  <div className="grid gap-2">
                    <div className="grid grid-cols-2">
                      <span className="text-sm font-medium text-muted-foreground">Número de serie:</span>
                      <span>{searchResult.serial_number}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm font-medium text-muted-foreground">Color:</span>
                      <span>{searchResult.color}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-sm font-medium text-muted-foreground">Fecha de registro:</span>
                      <span>{formatDate(searchResult.registration_date)}</span>
                    </div>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <h4 className="mb-2 text-sm font-semibold">Información del propietario</h4>
                    <p className="font-medium">{searchResult.profiles.full_name}</p>
                    <div className="mt-2 flex items-center text-sm text-muted-foreground">
                      <Phone className="mr-1 h-4 w-4" />
                      <span>{searchResult.profiles.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && !searchResult && searched && (
              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No encontrada</AlertTitle>
                <AlertDescription>No se encontró ninguna bicicleta registrada con ese número de serie</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t px-6 py-4">
            <p className="text-center text-sm text-muted-foreground">
              Si encontraste una bicicleta registrada, por favor contacta a su propietario para devolverla
            </p>
          </CardFooter>
        </Card>

        <div className="mt-12">
          <h2 className="mb-6 text-center text-2xl font-bold">Bicicletas Recientemente Registradas</h2>
          <RecentRegistrations />
        </div>
      </div>
    </div>
  )
}
