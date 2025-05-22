"use client"

import type React from "react"

import { useState } from "react"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Upload, X, ImageIcon } from "lucide-react"
import { useEffect } from "react"

// Esquema de validación
const bicycleSchema = z.object({
  serialNumber: z.string().min(5, { message: "El número de serie debe tener al menos 5 caracteres" }),
  brand: z.string().min(2, { message: "La marca es requerida" }),
  model: z.string().min(2, { message: "El modelo es requerido" }),
  color: z.string().min(2, { message: "El color es requerido" }),
  characteristics: z.string().optional(),
})

type BicycleFormValues = z.infer<typeof bicycleSchema>

export default function RegisterBicyclePage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
    }
  }, [user, router])

  const form = useForm<BicycleFormValues>({
    resolver: zodResolver(bicycleSchema),
    defaultValues: {
      serialNumber: "",
      brand: "",
      model: "",
      color: "",
      characteristics: "",
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Limitar a 4 imágenes
    const newImages = Array.from(files).slice(0, 4 - images.length)
    if (images.length + newImages.length > 4) {
      alert("Solo puedes subir un máximo de 4 imágenes")
      return
    }

    setImages((prev) => [...prev, ...newImages])

    // Crear URLs para previsualización
    const newImageUrls = newImages.map((file) => URL.createObjectURL(file))
    setImageUrls((prev) => [...prev, ...newImageUrls])
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imageUrls[index]) // Liberar memoria
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (bicycleId: string): Promise<string[]> => {
    if (images.length === 0) return []

    const uploadedUrls: string[] = []
    let progress = 0
    const progressIncrement = 100 / images.length

    for (const file of images) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bicycleId", bicycleId)

      try {
        const response = await fetch("/api/bicycles/upload-image", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Error al subir imagen")

        uploadedUrls.push(result.imageUrl)
        progress += progressIncrement
        setUploadProgress(Math.round(progress))
      } catch (error) {
        console.error("Error al subir imagen:", error)
      }
    }

    return uploadedUrls
  }

  const onSubmit = async (data: BicycleFormValues) => {
    if (!user) return

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      // 1. Registrar la bicicleta
      const response = await fetch("/api/bicycles/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serialNumber: data.serialNumber,
          brand: data.brand,
          model: data.model,
          color: data.color,
          characteristics: data.characteristics,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Error al registrar bicicleta")

      // 2. Subir imágenes si existen
      if (images.length > 0) {
        await uploadImages(result.bicycleId)
      }

      // 3. Redirigir a la página de pago
      router.push(`/payment/checkout?bicycleId=${result.bicycleId}`)
    } catch (error) {
      console.error("Error al registrar bicicleta:", error)
      setError(error instanceof Error ? error.message : "Error al registrar bicicleta")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Registrar Bicicleta</CardTitle>
          <CardDescription>Ingresa los datos de tu bicicleta para registrarla en el sistema nacional</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de serie</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC123456789" {...field} />
                    </FormControl>
                    <FormDescription>
                      El número de serie se encuentra generalmente debajo del pedalier o en el tubo del asiento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div>
                <FormLabel>Imágenes de la bicicleta (máximo 4)</FormLabel>
                <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-md border">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Bicicleta ${index + 1}`}
                        className="h-full w-full rounded-md object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-1 top-1 rounded-full bg-white p-1 shadow-sm"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Eliminar imagen</span>
                      </button>
                    </div>
                  ))}

                  {imageUrls.length < 4 && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground hover:bg-muted/50">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Upload className="h-8 w-8" />
                        <span>Subir imagen</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        multiple={imageUrls.length < 3}
                      />
                    </label>
                  )}

                  {imageUrls.length === 0 &&
                    Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="flex aspect-square items-center justify-center rounded-md border border-dashed text-muted-foreground"
                      >
                        <ImageIcon className="h-8 w-8 opacity-20" />
                      </div>
                    ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sube hasta 4 fotos claras de tu bicicleta desde diferentes ángulos
                </p>
              </div>

              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full bg-bike-primary" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-sm text-muted-foreground">Subiendo imágenes: {uploadProgress}%</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Registrando..." : "Registrar y continuar al pago"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            El registro tiene un costo de $250 MXN que deberás pagar al finalizar
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
