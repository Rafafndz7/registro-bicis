"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDate } from "@/lib/utils"
import { BikeIcon as BicycleIcon, Plus, AlertCircle, FileDown, RefreshCw, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Bicycle {
  id: string
  serial_number: string
  brand: string
  model: string
  color: string
  characteristics: string | null
  registration_date: string
  payment_status: boolean
}

export default function BicyclesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [bicycles, setBicycles] = useState<Bicycle[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingCertificate, setDownloadingCertificate] = useState<string | null>(null)
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchBicycles()
  }, [user, router, supabase])

  const fetchBicycles = async () => {
    try {
      const { data, error } = await supabase
        .from("bicycles")
        .select("*")
        .eq("user_id", user.id)
        .order("registration_date", { ascending: false })

      if (error) throw error

      setBicycles(data || [])
    } catch (error) {
      console.error("Error al cargar bicicletas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (bicycleId: string) => {
    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bicycleId }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error al crear sesión de pago:", error)
    }
  }

  const updatePaymentStatus = async (bicycleId: string) => {
    try {
      setUpdatingPayment(bicycleId)

      const response = await fetch("/api/payments/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bicycleId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al actualizar estado de pago")
      }

      // Recargar las bicicletas para mostrar el estado actualizado
      fetchBicycles()
      alert("Estado de pago actualizado correctamente")
    } catch (error) {
      console.error("Error al actualizar estado de pago:", error)
      alert("Error al actualizar estado de pago: " + (error as Error).message)
    } finally {
      setUpdatingPayment(null)
    }
  }

  const downloadCertificate = async (bicycle: Bicycle) => {
    if (!bicycle.payment_status) return

    try {
      setDownloadingCertificate(bicycle.id)

      // Hacer la solicitud para generar el certificado
      const response = await fetch(`/api/bicycles/generate-certificate?bicycleId=${bicycle.id}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      // Crear un blob a partir de la respuesta
      const blob = await response.blob()

      // Crear una URL para el blob
      const url = window.URL.createObjectURL(blob)

      // Crear un enlace temporal para descargar el archivo
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `certificado-bicicleta-${bicycle.serial_number}.pdf`

      // Añadir el enlace al documento y hacer clic en él
      document.body.appendChild(a)
      a.click()

      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error al descargar certificado:", error)
      alert("Error al descargar el certificado. Por favor, inténtalo de nuevo más tarde.")
    } finally {
      setDownloadingCertificate(null)
    }
  }

  const handleDeleteBicycle = async (bicycleId: string) => {
    try {
      const response = await fetch(`/api/bicycles/${bicycleId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar bicicleta")
      }

      // Recargar la lista de bicicletas
      fetchBicycles()
      alert("Bicicleta eliminada correctamente")
    } catch (error) {
      console.error("Error al eliminar bicicleta:", error)
      alert("Error al eliminar bicicleta: " + (error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mis Bicicletas</h1>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Bicicletas</h1>
        <div className="flex space-x-2">
          <Button onClick={fetchBicycles} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Link href="/bicycles/register">
            <Button className="bg-bike-primary hover:bg-bike-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Registrar bicicleta
            </Button>
          </Link>
        </div>
      </div>

      {bicycles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <BicycleIcon className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No tienes bicicletas registradas</h2>
            <p className="mb-6 text-center text-muted-foreground">
              Registra tu primera bicicleta para protegerla en el sistema nacional
            </p>
            <Link href="/bicycles/register">
              <Button className="bg-bike-primary hover:bg-bike-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Registrar bicicleta
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bicycles.map((bicycle) => (
            <Card key={bicycle.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {bicycle.brand} {bicycle.model}
                    </CardTitle>
                    <CardDescription>Serie: {bicycle.serial_number}</CardDescription>
                  </div>
                  <Badge variant={bicycle.payment_status ? "default" : "outline"} className="ml-2">
                    {bicycle.payment_status ? "Registrada" : "Pendiente"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Color</p>
                  <p>{bicycle.color}</p>
                </div>
                {bicycle.characteristics && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Características</p>
                    <p>{bicycle.characteristics}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de registro</p>
                  <p>{formatDate(bicycle.registration_date)}</p>
                </div>

                {!bicycle.payment_status && (
                  <Alert variant="warning" className="bg-amber-50 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Pago pendiente</AlertTitle>
                    <AlertDescription>
                      Esta bicicleta no estará oficialmente registrada hasta completar el pago.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <div className="flex w-full flex-col space-y-2">
                  <Link href={`/bicycles/${bicycle.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      Ver detalles
                    </Button>
                  </Link>

                  {/* Botones de editar y eliminar para bicicletas no pagadas */}
                  {!bicycle.payment_status && (
                    <div className="flex space-x-2">
                      <Link href={`/bicycles/${bicycle.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex-1">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar bicicleta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente la bicicleta.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBicycle(bicycle.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {bicycle.payment_status ? (
                    <Button
                      onClick={() => downloadCertificate(bicycle)}
                      className="w-full"
                      disabled={downloadingCertificate === bicycle.id}
                    >
                      {downloadingCertificate === bicycle.id ? (
                        "Generando..."
                      ) : (
                        <>
                          <FileDown className="mr-2 h-4 w-4" /> Descargar certificado
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button className="flex-1" onClick={() => handlePayment(bicycle.id)}>
                        Completar pago
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePaymentStatus(bicycle.id)}
                        disabled={updatingPayment === bicycle.id}
                        title="Actualizar estado de pago manualmente"
                      >
                        {updatingPayment === bicycle.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
