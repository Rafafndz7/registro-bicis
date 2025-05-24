"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react"
import Link from "next/link"

// Esquema de validación
const editBicycleSchema = z.object({
  brand: z.string().min(2, { message: "La marca es requerida" }),
  model: z.string().min(2, { message: "El modelo es requerido" }),
  color: z.string().min(2, { message: "El color es requerido" }),
  characteristics: z.string().optional(),
})

type EditBicycleFormValues = z.infer<typeof editBicycleSchema>

interface Bicycle {
  id: string
  serial_number: string
  brand: string
  model: string
  color: string
  characteristics: string | null
  payment_status: boolean
}

export default function EditBicyclePage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [bicycle, setBicycle] = useState<Bicycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditBicycleFormValues>({
    resolver: zodResolver(editBicycleSchema),
    defaultValues: {
      brand: "",
      model: "",
      color: "",
      characteristics: "",
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
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single()

        if (error) throw error

        setBicycle(data)
        form.reset({
          brand: data.brand,
          model: data.model,
          color: data.color,
          characteristics: data.characteristics || "",
        })
      } catch (error) {
        console.error("Error al cargar bicicleta:", error)
        setError("No se pudo cargar la información de la bicicleta")
      } finally {
        setLoading(false)
      }
    }

    fetchBicycle()
  }, [user, router, supabase, params.id, form])

  const onSubmit = async (data: EditBicycleFormValues) => {
    if (!bicycle) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/bicycles/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar bicicleta")
      }

      setSuccess("Bicicleta actualizada correctamente")
      setBicycle({ ...bicycle, ...data })
    } catch (error) {
      console.error("Error al actualizar bicicleta:", error)
      setError(error instanceof Error ? error.message : "Error al actualizar bicicleta")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <div className="mb-6">
          <Skeleton className="h-8 w-40" />
        </div>
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
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
          <CardHeader>
            <CardTitle>Bicicleta no encontrada</CardTitle>
            <CardDescription>No se encontró la bicicleta o no tienes permisos para editarla</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (bicycle.payment_status) {
    return (
      <div className="container py-10">
        <div className="mb-6">
          <Link
            href={`/bicycles/${params.id}`}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a detalles de la bicicleta
          </Link>
        </div>
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>No se puede editar</CardTitle>
            <CardDescription>Esta bicicleta ya está registrada y pagada</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bicicleta registrada</AlertTitle>
              <AlertDescription>
                No se puede editar una bicicleta que ya está oficialmente registrada y pagada en el sistema nacional.
              </AlertDescription>
            </Alert>
          </CardContent>
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

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Editar Bicicleta</CardTitle>
          <CardDescription>
            Actualiza la información de tu bicicleta
            <br />
            <span className="text-sm text-muted-foreground">
              Número de serie: {bicycle.serial_number} (no se puede cambiar)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Éxito</AlertTitle>
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Trek, Specialized, Giant, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Marlin 5, Allez, Talon, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="Rojo, Azul, Negro, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="characteristics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Características adicionales</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe características distintivas de tu bicicleta (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Incluye detalles como calcomanías, accesorios permanentes, modificaciones, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => router.push(`/bicycles/${params.id}`)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
