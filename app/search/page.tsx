"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface SearchResult {
  id: string
  serial_number: string
  brand: string
  model: string
  color: string
  created_at: string
  payment_status: boolean
  status: string
  user_id: string
}

export default function SearchPage() {
  const supabase = createClientComponentClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setError("Por favor ingresa un número de serie o ID de registro")
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      console.log("Buscando:", searchQuery.trim())

      // Buscar en la tabla bicycles con las columnas correctas
      const { data, error } = await supabase
        .from("bicycles")
        .select(`
          id,
          serial_number,
          brand,
          model,
          color,
          created_at,
          payment_status,
          status,
          user_id
        `)
        .eq("payment_status", true)
        .or(`serial_number.ilike.%${searchQuery.trim()}%,id.eq.${searchQuery.trim()}`)
        .order("created_at", { ascending: false })

      console.log("Resultados de búsqueda:", data)
      console.log("Error de búsqueda:", error)

      if (error) {
        console.error("Error en consulta:", error)
        throw error
      }

      setSearchResults(data || [])
      setHasSearched(true)
    } catch (error) {
      console.error("Error al buscar:", error)
      setError("Ocurrió un error al realizar la búsqueda. Por favor, inténtalo de nuevo.")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Verificar Bicicleta</h1>
          <p className="text-muted-foreground">
            Verifica si una bicicleta está registrada oficialmente o ha sido reportada como robada
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar por número de serie o ID de registro</CardTitle>
            <CardDescription>
              Ingresa el número de serie de la bicicleta o el ID de registro para verificar su estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex space-x-2">
              <Input
                placeholder="Número de serie o ID de registro"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isSearching}>
                {isSearching ? "Buscando..." : <Search className="mr-2 h-4 w-4" />}
                {isSearching ? "" : "Buscar"}
              </Button>
            </form>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {hasSearched && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Resultados de la búsqueda</h2>
            {searchResults.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <XCircle className="mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-semibold">No se encontraron resultados</h3>
                  <p className="text-center text-muted-foreground">
                    No se encontró ninguna bicicleta registrada con ese número de serie o ID
                  </p>
                  <p className="text-center text-muted-foreground mt-2 text-sm">
                    Asegúrate de que el número de serie esté escrito correctamente
                  </p>
                </CardContent>
              </Card>
            ) : (
              searchResults.map((bicycle) => (
                <Card key={bicycle.id} className={bicycle.status === "stolen" ? "border-red-500" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          {bicycle.brand} {bicycle.model}
                          {bicycle.status === "stolen" ? (
                            <Badge variant="destructive" className="ml-2">
                              ROBADA
                            </Badge>
                          ) : (
                            <Badge className="ml-2">Registrada</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>ID: {bicycle.id}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Número de serie</p>
                        <p>{bicycle.serial_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Color</p>
                        <p>{bicycle.color}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Fecha de registro</p>
                        <p>{formatDate(bicycle.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Estado</p>
                        <p>{bicycle.status === "stolen" ? "Reportada como robada" : "Registrada oficialmente"}</p>
                      </div>
                    </div>

                    {bicycle.status === "stolen" && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Bicicleta reportada como robada</AlertTitle>
                        <AlertDescription>
                          <p className="mb-2">
                            Esta bicicleta ha sido reportada como robada por su propietario legítimo.
                          </p>
                          <p className="text-sm">
                            Si tienes información sobre esta bicicleta, contacta a las autoridades.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Link href={`/verify/${bicycle.id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        Ver detalles completos
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle className="mb-4 h-12 w-12 text-green-600" />
            <h3 className="mb-2 text-xl font-semibold">Verificación oficial</h3>
            <p className="mb-4 text-muted-foreground">
              El Registro Nacional de Bicicletas es el sistema oficial para verificar la propiedad legítima de
              bicicletas en México
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register">
                <Button variant="outline">Registrar mi bicicleta</Button>
              </Link>
              <Link href="/about">
                <Button variant="link">Conocer más</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
