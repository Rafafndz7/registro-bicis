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
import { AlertCircle, CheckCircle2, ChevronLeft, Upload, FileText, Trash2, Eye } from "lucide-react"
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

  const [invoice, setInvoice] = useState<any>(null)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [uploadingInvoice, setUploadingInvoice] = useState(false)

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

    // Cargar factura existente
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/bicycles/${params.id}/invoice`)
        if (response.ok) {
          const data = await response.json()
          setInvoice(data.invoice)
        }
      } catch (error) {
        console.error("Error al cargar factura:", error)
      }
    }

    fetchInvoice()
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

  const handleInvoiceUpload = async () => {
    if (!invoiceFile) return

    setUploadingInvoice(true)
    try {
      const formData = new FormData()
      formData.append("invoice", invoiceFile)

      const response = await fetch(`/api/bicycles/${params.id}/invoice`, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al subir factura")
      }

      setInvoice(result.invoice)
      setInvoiceFile(null)
      setSuccess("Factura subida correctamente")
    } catch (error) {
      console.error("Error al subir factura:", error)
      setError(error instanceof Error ? error.message : "Error al subir factura")
    } finally {
      setUploadingInvoice(false)
    }
  }

  const handleInvoiceDelete = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/bicycles/${params.id}/invoice`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar factura")
      }

      setInvoice(null)
      setSuccess("Factura eliminada correctamente")
    } catch (error) {
      console.error("Error al eliminar factura:", error)
      setError("Error al eliminar factura")
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
            {bicycle.payment_status && (
              <>
                <br />
                <span className="text-sm text-green-600 font-medium">✓ Bicicleta registrada oficialmente</span>
              </>
            )}
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

              {/* Sección de Factura */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Factura (Opcional)</h3>

                {invoice ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">Factura subida</p>
                          <p className="text-sm text-green-600">
                            Subida el {new Date(invoice.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(invoice.file_url, "_blank")}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleInvoiceDelete}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleInvoiceUpload} disabled={!invoiceFile || uploadingInvoice}>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingInvoice ? "Subiendo..." : "Subir Factura"}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">Formatos aceptados: PDF, JPG, PNG. Máximo 5MB.</p>
                  </div>
                )}
              </div>

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
