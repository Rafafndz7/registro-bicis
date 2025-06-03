"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BikeIcon as Bicycle, Search, QrCode, AlertTriangle, CheckCircle, XCircle, Phone, Mail } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface BicycleVerification {
  id: string
  brand: string
  model: string
  serial_number: string
  color: string
  type: string
  registered_at: string
  payment_status: boolean
  stolen: boolean
  user_id: string
  owner_name: string
  owner_phone: string
  owner_email: string
}

export default function SearchPage() {
  const supabase = createClientComponentClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<"serial" | "id" | "color" | "model">("serial")
  const [bicycle, setBicycle] = useState<BicycleVerification | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    setError(null)
    setBicycle(null)
    setSearched(true)

    try {
      console.log(`Buscando bicicleta por ${searchType}:`, searchTerm)

      let query = supabase
        .from("bicycles")
        .select(
          `
          id,
          brand,
          model,
          serial_number,
          color,
          type,
          created_at,
          registration_date,
          payment_status,
          stolen,
          user_id,
          profiles:user_id (full_name, phone, email)
        `,
        )
        .eq("payment_status", true)

      // Aplicar filtro según el tipo de búsqueda
      switch (searchType) {
        case "serial":
          query = query.ilike("serial_number", searchTerm)
          break
        case "id":
          query = query.eq("id", searchTerm)
          break
        case "color":
          query = query.ilike("color", `%${searchTerm}%`)
          break
        case "model":
          query = query.ilike("model", `%${searchTerm}%`)
          break
      }

      // Para color y modelo, podemos tener múltiples resultados
      let data
      if (searchType === "color" || searchType === "model") {
        const { data: results, error } = await query.limit(10)

        if (error) throw error

        if (!results || results.length === 0) {
          throw new Error(`No se encontraron bicicletas con ese ${searchType === "color" ? "color" : "modelo"}`)
        }

        // Tomar el primer resultado para mostrar
        data = results[0]
        console.log(`Se encontraron ${results.length} bicicletas. Mostrando la primera.`)
      } else {
        // Para serial e id, esperamos un único resultado
        const { data: result, error } = await query.single()

        if (error) {
          console.error("Error al buscar bicicleta:", error)
          throw new Error("No se encontró ninguna bicicleta con ese número")
        }

        data = result
      }

      console.log("Bicicleta encontrada:", data)

      if (!data) {
        throw new Error("No se encontró ninguna bicicleta")
      }

      // Transformar los datos para el formato de verificación con validación
      const verificationData: BicycleVerification = {
        id: data.id || "",
        brand: data.brand || "",
        model: data.model || "",
        serial_number: data.serial_number || "",
        color: data.color || "",
        type: data.type || "No especificado",
        registered_at: data.registration_date || data.created_at || new Date().toISOString(),
        payment_status: !!data.payment_status,
        stolen: !!data.stolen,
        user_id: data.user_id || "",
        owner_name: data.profiles?.full_name || "No disponible",
        owner_phone: data.profiles?.phone || "No disponible",
        owner_email: data.profiles?.email || "No disponible",
      }

      setBicycle(verificationData)
    } catch (error) {
      console.error("Error:", error)
      setError((error as Error).message || "Error al buscar la bicicleta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Verificar Bicicleta</h1>
          <p className="text-muted-foreground">
            Comprueba si una bicicleta está registrada oficialmente o reportada como robada
          </p>
        </div>

        <Card className="mx-auto">
          <CardHeader>
            <CardTitle>Buscar Bicicleta</CardTitle>
            <CardDescription>Busca por número de serie, ID de registro, color o modelo</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="serial"
              onValueChange={(value) => setSearchType(value as "serial" | "id" | "color" | "model")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="serial">
                  <Bicycle className="mr-2 h-4 w-4" />
                  Serie
                </TabsTrigger>
                <TabsTrigger value="id">
                  <QrCode className="mr-2 h-4 w-4" />
                  ID
                </TabsTrigger>
                <TabsTrigger value="color">
                  <span className="mr-2">🎨</span>
                  Color
                </TabsTrigger>
                <TabsTrigger value="model">
                  <span className="mr-2">🚲</span>
                  Modelo
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="searchTerm">
                    {searchType === "serial" && "Número de Serie de la Bicicleta"}
                    {searchType === "id" && "ID de Registro"}
                    {searchType === "color" && "Color de la Bicicleta"}
                    {searchType === "model" && "Modelo de la Bicicleta"}
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="searchTerm"
                      placeholder={
                        searchType === "serial"
                          ? "Ej: AB123456789"
                          : searchType === "id"
                            ? "Ej: 123e4567-e89b-12d3-a456-426614174000"
                            : searchType === "color"
                              ? "Ej: Rojo, Azul, Negro"
                              : "Ej: Mountain Bike, Urbana, BMX"
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit" disabled={loading}>
                      {loading ? "Buscando..." : "Buscar"}
                      <Search className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {bicycle && (
          <Card className="mx-auto border-2 border-blue-100">
            <CardHeader className="bg-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Bicicleta Verificada</CardTitle>
                  <CardDescription>Esta bicicleta está registrada oficialmente</CardDescription>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Información del propietario - Destacada */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Información del Propietario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <span className="bg-blue-100 p-2 rounded-full mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-blue-600"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{bicycle.owner_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="bg-blue-100 p-2 rounded-full mr-3">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </span>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{bicycle.owner_phone}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <a href={`tel:${bicycle.owner_phone}`} className="flex-1 mr-2">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Phone className="mr-2 h-4 w-4" /> Llamar
                    </Button>
                  </a>
                  <a
                    href={`mailto:${bicycle.owner_email}?subject=Bicicleta%20encontrada%20-%20${bicycle.serial_number}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      <Mail className="mr-2 h-4 w-4" /> Email
                    </Button>
                  </a>
                </CardFooter>
              </Card>

              {/* Información de la bicicleta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Marca</h3>
                  <p className="text-lg">{bicycle.brand}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Modelo</h3>
                  <p className="text-lg">{bicycle.model}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Número de Serie</h3>
                  <p className="text-lg">{bicycle.serial_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Color</h3>
                  <p className="text-lg">{bicycle.color}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Tipo</h3>
                  <p className="text-lg">{bicycle.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Fecha de Registro</h3>
                  <p className="text-lg">{formatDate(bicycle.registered_at)}</p>
                </div>
              </div>

              {bicycle.stolen && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-bold">
                    ¡ALERTA! Esta bicicleta ha sido reportada como robada.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 flex justify-between">
              <div className="flex items-center">
                <QrCode className="h-4 w-4 mr-2 text-blue-600" />
                <span className="text-sm text-muted-foreground">ID: {bicycle.id}</span>
              </div>
              <Link href={`/verify/${bicycle.id}`} target="_blank">
                <Button variant="outline" size="sm">
                  Ver certificado
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {searched && !bicycle && !error && (
          <Card className="mx-auto border-2 border-red-100">
            <CardHeader className="bg-red-50">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Bicicleta No Encontrada</CardTitle>
                  <CardDescription>No se encontró ninguna bicicleta con ese número</CardDescription>
                </div>
                <div className="flex items-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p>
                La bicicleta que buscas no está registrada en nuestro sistema o no ha completado su proceso de registro.
                Esto puede significar que:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>El número ingresado es incorrecto</li>
                <li>La bicicleta no está registrada oficialmente</li>
                <li>El registro está en proceso pero no se ha completado el pago</li>
              </ul>
            </CardContent>
            <CardFooter className="bg-gray-50">
              <div className="text-sm text-muted-foreground">
                Si crees que esto es un error, por favor contacta con soporte.
              </div>
            </CardFooter>
          </Card>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">¿Quieres registrar tu bicicleta en el sistema nacional?</p>
          <Link href="/auth/register">
            <Button variant="outline">Registrar mi bicicleta</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
