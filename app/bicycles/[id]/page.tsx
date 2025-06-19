"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import {
  BikeIcon as BicycleIcon,
  AlertCircle,
  ChevronLeft,
  ImageIcon,
  FileDown,
  QrCode,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  theft_status: string | null
}

interface BicycleImage {
  id: string
  bicycle_id: string
  image_url: string
}

export default function BicycleDetailsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [bicycle, setBicycle] = useState<Bicycle | null>(null)
  const [images, setImages] = useState<BicycleImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [downloadingCertificate, setDownloadingCertificate] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reportingTheft, setReportingTheft] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const fetchBicycleDetails = async () => {
      try {
        // Obtener detalles de la bicicleta
        const { data: bicycleData, error: bicycleError } = await supabase
          .from("bicycles")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single()

        if (bicycleError) throw bicycleError

        // Obtener imágenes de la bicicleta
        const { data: imagesData, error: imagesError } = await supabase
          .from("bicycle_images")
          .select("*")
          .eq("bicycle_id", params.id)

        if (imagesError) throw imagesError

        setBicycle(bicycleData)
        setImages(imagesData || [])
        if (imagesData && imagesData.length > 0) {
          setSelectedImage(imagesData[0].image_url)
        }
      } catch (error) {
        console.error("Error al cargar detalles de la bicicleta:", error)
        router.push("/bicycles")
      } finally {
        setLoading(false)
      }
    }

    fetchBicycleDetails()
  }, [user, router, supabase, params.id])

  const handlePayment = async () => {
    if (!bicycle) return

    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bicycleId: bicycle.id }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error al crear sesión de pago:", error)
    }
  }

  const handleDelete = async () => {
    if (!bicycle) return

    try {
      setDeleting(true)

      const response = await fetch(`/api/bicycles/${bicycle.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar bicicleta")
      }

      // Redirigir a la lista de bicicletas
      router.push("/bicycles")
    } catch (error) {
      console.error("Error al eliminar bicicleta:", error)
      alert("Error al eliminar bicicleta: " + (error as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  const handleReportTheft = async () => {
    if (!bicycle) return

    try {
      setReportingTheft(true)
      router.push(`/bicycles/${bicycle.id}/report-theft`)
    } catch (error) {
      console.error("Error al reportar robo:", error)
      alert("Error al reportar robo: " + (error as Error).message)
    } finally {
      setReportingTheft(false)
    }
  }

  const downloadCertificate = async () => {
    if (!bicycle || !bicycle.payment_status) return

    try {
      setDownloadingCertificate(true)

      // Detectar si es móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      const url = `/api/bicycles/generate-certificate?bicycleId=${bicycle.id}`

      if (isMobile) {
        // En móvil, redirigir directamente a la URL
        window.location.href = url
      } else {
        // En PC, abrir en nueva ventana
        window.open(url, "_blank")
      }
    } catch (error) {
      console.error("Error al descargar certificado:", error)
      alert("Error al descargar el certificado. Por favor, inténtalo de nuevo más tarde.")
    } finally {
      setDownloadingCertificate(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="mb-6">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!bicycle) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Bicicleta no encontrada</h2>
            <p className="mb-6 text-center text-muted-foreground">
              No se encontró la bicicleta solicitada o no tienes permisos para verla
            </p>
            <Link href="/bicycles">
              <Button>Ver mis bicicletas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link href="/bicycles" className="flex items-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a mis bicicletas
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
            {selectedImage ? (
              <img
                src={selectedImage || "/placeholder.svg"}
                alt={`${bicycle.brand} ${bicycle.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BicycleIcon className="h-24 w-24 text-muted-foreground opacity-20" />
              </div>
            )}

            {bicycle.theft_status === "reported_stolen" && (
              <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-center py-2 font-bold">
                REPORTADA COMO ROBADA
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image) => (
                <button
                  key={image.id}
                  className={`relative aspect-square overflow-hidden rounded-md border ${
                    selectedImage === image.image_url ? "ring-2 ring-bike-primary ring-offset-2" : ""
                  }`}
                  onClick={() => setSelectedImage(image.image_url)}
                >
                  <img src={image.image_url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              {Array.from({ length: 4 - images.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex aspect-square items-center justify-center rounded-md border bg-muted"
                >
                  <ImageIcon className="h-6 w-6 text-muted-foreground opacity-20" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h1 className="text-3xl font-bold">
                {bicycle.brand} {bicycle.model}
              </h1>
              <div className="flex space-x-2">
                <Badge variant={bicycle.payment_status ? "default" : "outline"} className="ml-2">
                  {bicycle.payment_status ? "Registrada" : "Pendiente"}
                </Badge>

                {bicycle.theft_status === "reported_stolen" && <Badge variant="destructive">Robada</Badge>}
              </div>
            </div>
            <p className="text-xl text-muted-foreground">Número de serie: {bicycle.serial_number}</p>
          </div>

          {bicycle.theft_status === "reported_stolen" && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Bicicleta reportada como robada</AlertTitle>
              <AlertDescription>
                Esta bicicleta ha sido reportada como robada. Si la recuperas, contacta con nosotros para actualizar su
                estado.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="registration">Registro</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 pt-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Color</h3>
                <p className="text-lg">{bicycle.color}</p>
              </div>
              {bicycle.characteristics && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Características</h3>
                  <p className="text-lg">{bicycle.characteristics}</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="registration" className="space-y-4 pt-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Fecha de registro</h3>
                <p className="text-lg">{formatDate(bicycle.registration_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Estado del registro</h3>
                <p className="text-lg">{bicycle.payment_status ? "Registro completo" : "Pendiente de pago"}</p>
              </div>
              {bicycle.theft_status && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Estado de robo</h3>
                  <p className="text-lg">
                    {bicycle.theft_status === "reported_stolen" ? "Reportada como robada" : "No reportada"}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {!bicycle.payment_status && (
            <Alert variant="warning" className="bg-amber-50 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Pago pendiente</AlertTitle>
              <AlertDescription>
                Esta bicicleta no estará oficialmente registrada hasta completar el pago.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col space-y-2">
            {!bicycle.payment_status && (
              <Button onClick={handlePayment} className="w-full">
                Completar pago
              </Button>
            )}

            {bicycle.payment_status && (
              <>
                <Button onClick={downloadCertificate} className="w-full" disabled={downloadingCertificate}>
                  {downloadingCertificate ? (
                    <>Generando certificado...</>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" /> Ver certificado
                    </>
                  )}
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/bicycles/${bicycle.id}/qr`}>
                    <QrCode className="mr-2 h-4 w-4" /> Ver código QR
                  </Link>
                </Button>

                {bicycle.theft_status !== "reported_stolen" && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleReportTheft}
                    disabled={reportingTheft}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    {reportingTheft ? "Redirigiendo..." : "Reportar como robada"}
                  </Button>
                )}
              </>
            )}

            {/* Botones de editar y eliminar solo para bicicletas no pag */}
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" className="flex-1" asChild>
                <Link href={`/bicycles/${bicycle.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente esta bicicleta de tu cuenta.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                      {deleting ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
