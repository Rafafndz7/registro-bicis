"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Bicycle {
  id: string
  serial_number: string
  brand: string
  model: string
  theft_status: string
}

export default function ReportTheftPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [bicycle, setBicycle] = useState<Bicycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    location: "",
    description: "",
    policeReportNumber: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const fetchBicycle = async () => {
      try {
        const { data, error } = await supabase
          .from("bicycles")
          .select("id, serial_number, brand, model, theft_status")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single()

        if (error) throw error

        setBicycle(data)
      } catch (error) {
        console.error("Error al cargar bicicleta:", error)
        router.push("/bicycles")
      } finally {
        setLoading(false)
      }
    }

    fetchBicycle()
  }, [user, router, supabase, params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bicycle) return

    try {
      setSubmitting(true)

      const response = await fetch("/api/theft-reports/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bicycleId: bicycle.id,
          location: formData.location,
          description: formData.description,
          policeReportNumber: formData.policeReportNumber,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al reportar robo")
      }

      // Redirigir a la página de la bicicleta
      router.push(`/bicycles/${bicycle.id}`)
    } catch (error) {
      console.error("Error al reportar robo:", error)
      alert("Error al reportar robo: " + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <Skeleton className="mb-6 h-8 w-40" />
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!bicycle) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertTriangle className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Bicicleta no encontrada</h2>
            <p className="mb-6 text-center text-muted-foreground">
              No se encontró la bicicleta o no tienes permisos para reportarla
            </p>
            <Link href="/bicycles">
              <Button>Ver mis bicicletas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (bicycle.theft_status === "reported_stolen") {
    return (
      <div className="container py-10">
        <div className="mb-6">
          <Link
            href={`/bicycles/${bicycle.id}`}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a la bicicleta
          </Link>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertTriangle className="mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-xl font-semibold">Bicicleta ya reportada</h2>
            <p className="mb-6 text-center text-muted-foreground">Esta bicicleta ya está reportada como robada</p>
            <Link href={`/bicycles/${bicycle.id}`}>
              <Button>Ver detalles</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link
          href={`/bicycles/${bicycle.id}`}
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a la bicicleta
        </Link>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Reportar Robo
          </CardTitle>
          <CardDescription>
            Reporta el robo de tu bicicleta {bicycle.brand} {bicycle.model} (Serie: {bicycle.serial_number})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Te recomendamos presentar una denuncia ante las autoridades locales antes de reportar el robo aquí. Esto
              ayudará en el proceso de recuperación.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="location">Ubicación del robo *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Calle 5 de Mayo, Centro, Ciudad de México"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción del incidente *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe las circunstancias del robo, hora aproximada, etc."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="policeReportNumber">Número de denuncia policial (opcional)</Label>
              <Input
                id="policeReportNumber"
                value={formData.policeReportNumber}
                onChange={(e) => setFormData({ ...formData, policeReportNumber: e.target.value })}
                placeholder="Ej: FGJ/123456/2024"
              />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Reportando..." : "Reportar robo"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/bicycles/${bicycle.id}`}>Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
