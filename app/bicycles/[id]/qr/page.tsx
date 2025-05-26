"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, Download, Printer, ExternalLink } from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { RNBLogo } from "@/components/rnb-logo"

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
  } | null
}

export default function BicycleQRPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [bicycle, setBicycle] = useState<Bicycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [verificationUrl, setVerificationUrl] = useState<string>("")

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const fetchBicycleDetails = async () => {
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
            payment_status,
            profiles (
              full_name
            )
          `,
          )
          .eq("id", params.id)
          .eq("user_id", user.id)
          .eq("payment_status", true)
          .single()

        if (error) {
          console.error("Error de Supabase:", error)
          throw error
        }

        if (data) {
          // Mapear los datos para asegurar el tipo correcto
          const mappedData: Bicycle = {
            id: data.id,
            serial_number: data.serial_number,
            brand: data.brand,
            model: data.model,
            color: data.color,
            registration_date: data.registration_date,
            payment_status: data.payment_status,
            profiles: data.profiles,
          }
          setBicycle(mappedData)

          // Establecer la URL de verificación usando la variable de entorno
          const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
            ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
            : window.location.origin
          setVerificationUrl(`${baseUrl}/verify/${data.id}`)
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

  const downloadQRCode = () => {
    if (!bicycle) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 400
    canvas.height = 550

    // Fondo blanco
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Header RNB
    ctx.fillStyle = "#1e88e5"
    ctx.fillRect(0, 0, canvas.width, 100)

    ctx.fillStyle = "white"
    ctx.font = "bold 28px Arial"
    ctx.textAlign = "center"
    ctx.fillText("RNB", canvas.width / 2, 40)
    ctx.font = "16px Arial"
    ctx.fillText("Registro Nacional de Bicis", canvas.width / 2, 65)
    ctx.font = "12px Arial"
    ctx.fillText("Sistema Oficial de Verificación", canvas.width / 2, 85)

    // Obtener el SVG del QR
    const svgElement = document.getElementById("qr-code") as unknown as SVGElement
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const svgUrl = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      // QR en el centro
      const qrSize = 250
      const qrX = (canvas.width - qrSize) / 2
      const qrY = 120
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize)

      // Información de la bicicleta
      ctx.fillStyle = "#333"
      ctx.font = "bold 18px Arial"
      ctx.fillText(`${bicycle.brand} ${bicycle.model}`, canvas.width / 2, qrY + qrSize + 30)

      ctx.font = "14px Arial"
      ctx.fillText(`Serie: ${bicycle.serial_number}`, canvas.width / 2, qrY + qrSize + 55)
      ctx.fillText(`Propietario: ${bicycle.profiles?.full_name || "Usuario"}`, canvas.width / 2, qrY + qrSize + 80)

      // URL de verificación
      ctx.font = "12px Arial"
      ctx.fillStyle = "#1e88e5"
      ctx.fillText("Escanea para verificar en:", canvas.width / 2, qrY + qrSize + 110)
      ctx.font = "10px Arial"
      const domain = process.env.NEXT_PUBLIC_VERCEL_URL || "localhost:3000"
      ctx.fillText(`${domain}/verify/${bicycle.id}`, canvas.width / 2, qrY + qrSize + 130)

      // Footer
      ctx.fillStyle = "#666"
      ctx.font = "10px Arial"
      ctx.fillText(
        `Registrado el ${new Date(bicycle.registration_date).toLocaleDateString("es-MX")}`,
        canvas.width / 2,
        qrY + qrSize + 155,
      )

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const downloadLink = document.createElement("a")
          downloadLink.href = url
          downloadLink.download = `qr-rnb-${bicycle.serial_number}.png`
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
          URL.revokeObjectURL(url)
        }
      })

      URL.revokeObjectURL(svgUrl)
    }
    img.src = svgUrl
  }

  const printQRCode = () => {
    window.print()
  }

  const testVerification = () => {
    if (!bicycle) return
    window.open(`/verify/${bicycle.id}`, "_blank")
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

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link href={`/bicycles/${params.id}`} className="flex items-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a detalles de la bicicleta
        </Link>
      </div>

      <Card className="mx-auto max-w-md print:border-none print:shadow-none">
        <CardHeader className="print:pb-2 text-center">
          <div className="mb-4 flex justify-center">
            <RNBLogo size={80} />
          </div>
          <CardTitle className="text-bike-primary">Código QR de Verificación</CardTitle>
          <CardDescription>
            Imprime este código QR y colócalo en tu bicicleta. Cualquier persona podrá escanearlo para verificar que
            está registrada y contactarte si la encuentran.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="mb-6 rounded-lg border-2 border-bike-primary/20 p-6 print:border-none">
            {verificationUrl && (
              <QRCodeSVG
                id="qr-code"
                value={verificationUrl}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#1e88e5"
                bgColor="#ffffff"
                className="h-auto w-full max-w-[200px]"
              />
            )}
          </div>
          <div className="w-full space-y-2 text-center">
            <h3 className="font-semibold text-lg">
              {bicycle.brand} {bicycle.model}
            </h3>
            <p className="text-sm text-muted-foreground">Serie: {bicycle.serial_number}</p>
            <p className="text-xs text-muted-foreground">
              Registrado en RNB el {new Date(bicycle.registration_date).toLocaleDateString("es-MX")}
            </p>
            <div className="mt-4 rounded-lg bg-bike-primary/5 p-3">
              <p className="text-xs text-bike-primary font-medium">
                Al escanear este QR se mostrará la información de registro y los datos de contacto del propietario
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 print:hidden">
          <div className="flex w-full justify-center space-x-2">
            <Button variant="outline" onClick={downloadQRCode}>
              <Download className="mr-2 h-4 w-4" /> Descargar
            </Button>
            <Button onClick={printQRCode} className="bg-bike-primary hover:bg-bike-primary/90">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
          </div>
          <Button variant="outline" onClick={testVerification} className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" /> Probar verificación
          </Button>
        </CardFooter>
      </Card>

      {/* Información adicional para impresión */}
      <div className="mt-8 hidden text-center text-xs text-muted-foreground print:block">
        <p>Registro Nacional de Bicis (RNB) - Sistema Oficial</p>
        <p>Verificar en: {verificationUrl}</p>
        <p>ID: {bicycle.id}</p>
      </div>
    </div>
  )
}
