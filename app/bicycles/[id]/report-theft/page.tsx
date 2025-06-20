"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, ChevronLeft, MapPin, FileText, Phone } from "lucide-react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const theftReportSchema = z.object({
  location: z.string().min(5, { message: "La ubicación debe tener al menos 5 caracteres" }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres" }),
  policeReportNumber: z.string().optional(),
})

type TheftReportFormValues = z.infer<typeof theftReportSchema>

interface Bicycle {
  id: string
  brand: string
  model: string
  serial_number: string
  theft_status: string
}

export default function ReportTheftPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [bicycle, setBicycle] = useState<Bicycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<TheftReportFormValues>({
    resolver: zodResolver(theftReportSchema),
    defaultValues: {
      location: "",
      description: "",
      policeReportNumber: "",
    },
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
          .select("id, brand, model, serial_number, theft_status")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single()

        if (error) throw error

        if (data.theft_status === "reported_stolen") {
          router.push(`/bicycles/${params.id}`)
          return
        }

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

  const onSubmit = async (data: TheftReportFormValues) => {
    if (!bicycle) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/bicycles/${bicycle.id}/report-theft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: data.location,
          description: data.description,
          policeReportNumber: data.policeReportNumber || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al reportar robo")
      }

      // Redirigir a la página de la bicicleta
      router.push(`/bicycles/${bicycle.id}?theft_reported=true`)
    } catch (error) {
      console.error("Error al reportar robo:", error)
      setError(error instanceof Error ? error.message : "Error al reportar robo")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!bicycle) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <AlertTriangle className="mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold">Bicicleta no encontrada</h2>
              <p className="mb-6 text-center text-muted-foreground">
                No se encontró la bicicleta o ya está reportada como robada
              </p>
              <Link href="/bicycles">
                <Button>Ver mis bicicletas</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="mb-6">
          <Link
            href={`/bicycles/${bicycle.id}`}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a la bicicleta
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Reportar Robo de Bicicleta
            </CardTitle>
            <CardDescription>
              Reporta el robo de tu {bicycle.brand} {bicycle.model} (Serie: {bicycle.serial_number})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                Una vez reportada como robada, esta bicicleta aparecerá en las búsquedas públicas como ROBADA. Esta
                acción no se puede deshacer fácilmente.
              </AlertDescription>
            </Alert>

            <Alert>
              <Phone className="h-4 w-4" />
              <AlertTitle>Recomendación</AlertTitle>
              <AlertDescription>
                Te recomendamos presentar una denuncia ante las autoridades locales antes o después de este reporte. El
                número de denuncia policial ayudará en caso de recuperación.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Ubicación del robo *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Calle 5 de Mayo #123, Colonia Centro, Ciudad de México" {...field} />
                      </FormControl>
                      <FormDescription>
                        Proporciona la ubicación más específica posible donde ocurrió el robo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción del incidente *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe cómo ocurrió el robo: fecha, hora aproximada, circunstancias, si había testigos, etc."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Incluye todos los detalles relevantes que puedan ayudar en la identificación o recuperación
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="policeReportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Número de denuncia policial (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: FGJ/123456/2024" {...field} />
                      </FormControl>
                      <FormDescription>
                        Si ya presentaste una denuncia ante las autoridades, proporciona el número de folio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/bicycles/${bicycle.id}`)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" variant="destructive" className="flex-1" disabled={submitting}>
                    {submitting ? "Reportando..." : "Reportar como robada"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
