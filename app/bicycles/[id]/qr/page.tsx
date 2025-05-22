"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, Download, Printer } from "lucide-react"
import Link from "next/link"
import QRCode from "qrcode.react"

interface Bicycle {
  id: string
  serial_number: string
  brand: string
  model: string
  color: string
  registration_date: string
  payment_status: boolean
  profiles: {
    full_name: string
  }
}

export default function BicycleQRPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [bicycle, setBicycle] = useState<Bicycle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const fetchBicycleDetails = async () => {
      try {
        // Obtener detalles de la bicicleta
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
              full_name
            )
          `,
          )
          .eq("id", params.id)
          .eq("user_id", user.id)
          .eq("payment_status", true) // Solo bicicletas con pago completado
          .single()

        if (error) throw error

        setBicycle(data)
      } catch (error) {
        console.error("Error al cargar detalles de la bicicleta:", error)
        router.push("/bicycles")
      } finally {
        setLoading(false)
      }
    }

    fetchBicycleDetails()
  }, [user, router, supabase, params.id])

  const downloadQRCode = () => {
    if (!bicycle) return

    const canvas = document.getElementById("qr-code") as HTMLCanvasElement
    if (!canvas) return

    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
    const downloadLink = document.createElement("a")
    downloadLink.href = pngUrl
    downloadLink.download = `qr-bicicleta-${bicycle.serial_number}.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const printQRCode = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="mb-6">
          <Skeleton className="h-8 w-40" />
        </div>
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <Skeleton className="h-64 w-64" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!bicycle) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Bicicleta no encontrada</CardTitle>
            <CardDescription>No se encontró la bicicleta o no está registrada completamente</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/bicycles">
              <Button>Volver a mis bicicletas</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Datos para el código QR
  const qrData = {
    bicycleId: bicycle.id,
    serialNumber: bicycle.serial_number,
    brand: bicycle.brand,
    model: bicycle.model,
    ownerName: bicycle.profiles.full_name,
    registrationDate: bicycle.registration_date,
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link href={`/bicycles/${params.id}`} className="flex items-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a detalles de la bicicleta
        </Link>
      </div>

      <Card className="mx-auto max-w-md print:border-none print:shadow-none">
        <CardHeader className="print:pb-2">
          <CardTitle>Código QR de Identificación</CardTitle>
          <CardDescription>
            Imprime este código QR y colócalo en tu bicicleta para facilitar su identificación
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="mb-6 rounded-lg border border-dashed p-8 print:border-none">
            <QRCode
              id="qr-code"
              value={JSON.stringify(qrData)}
              size={200}
              level="H"
              includeMargin={true}
              className="h-auto w-full max-w-[200px]"
            />
          </div>
          <div className="w-full space-y-2 text-center">
            <h3 className="font-semibold">
              {bicycle.brand} {bicycle.model}
            </h3>
            <p className="text-sm text-muted-foreground">Serie: {bicycle.serial_number}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4 print:hidden">
          <Button variant="outline" onClick={downloadQRCode}>
            <Download className="mr-2 h-4 w-4" /> Descargar
          </Button>
          <Button onClick={printQRCode}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
