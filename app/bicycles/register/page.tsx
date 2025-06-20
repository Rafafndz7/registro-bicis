"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Upload, X, ImageIcon, Info, CreditCard, CheckCircle, FileText } from "lucide-react"

// Esquema de validación actualizado
const bicycleSchema = z.object({
  serialNumber: z.string().min(5, { message: "El número de serie debe tener al menos 5 caracteres" }),
  brand: z.string().min(2, { message: "La marca es requerida" }),
  model: z.string().min(2, { message: "El modelo es requerido" }),
  color: z.string().min(2, { message: "El color es requerido" }),
  bikeType: z.string().min(1, { message: "El tipo de bicicleta es requerido" }),
  year: z
    .number()
    .min(1990)
    .max(new Date().getFullYear() + 1)
    .optional(),
  wheelSize: z.string().optional(),
  groupset: z.string().optional(),
  characteristics: z.string().optional(),
  curp: z.string().optional(),
  address: z.string().optional(),
})

type BicycleFormValues = z.infer<typeof bicycleSchema>

const bikeTypes = [
  { value: "montaña", label: "Montaña (MTB)" },
  { value: "ruta", label: "Ruta (Road)" },
  { value: "urbana", label: "Urbana" },
  { value: "híbrida", label: "Híbrida" },
  { value: "bmx", label: "BMX" },
  { value: "eléctrica", label: "Eléctrica" },
]

const wheelSizes = [
  { value: '20"', label: '20"' },
  { value: '24"', label: '24"' },
  { value: '26"', label: '26"' },
  { value: '27.5"', label: '27.5" (650B)' },
  { value: '29"', label: '29" (700C)' },
  { value: "700c", label: "700C" },
]

export default function RegisterBicyclePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [invoice, setInvoice] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bicycleCount, setBicycleCount] = useState(0)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)

  const form = useForm<BicycleFormValues>({
    resolver: zodResolver(bicycleSchema),
    defaultValues: {
      serialNumber: "",
      brand: "",
      model: "",
      color: "",
      bikeType: "",
      year: undefined,
      wheelSize: "",
      groupset: "",
      characteristics: "",
      curp: "",
      address: "",
    },
  })

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/auth/login?redirectTo=/bicycles/register")
      return
    }

    fetchUserData()
  }, [user, authLoading, router])

  const fetchUserData = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Cargar perfil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        if (profileError.code === "PGRST116") {
          router.push("/profile")
          return
        }
        throw profileError
      }

      setProfile(profileData)

      // Verificar suscripción activa - VERSIÓN SIMPLIFICADA
      const { data: subscriptions, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      console.log("🔍 Buscando suscripciones para usuario:", user.id)
      console.log("📊 Suscripciones encontradas:", subscriptions)

      if (subscriptions && subscriptions.length > 0) {
        const activeSubscription = subscriptions[0]
        setHasActiveSubscription(true)
        setSubscriptionData(activeSubscription)
        console.log("✅ Suscripción activa encontrada:", activeSubscription)
      } else {
        setHasActiveSubscription(false)
        setSubscriptionData(null)
        console.log("❌ No se encontró suscripción activa")
      }

      // Contar bicicletas del usuario
      const { count, error: countError } = await supabase
        .from("bicycles")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (countError) throw countError

      setBicycleCount(count || 0)

      // Pre-llenar los campos si ya existen datos
      if (profileData) {
        form.setValue("curp", profileData.curp || "")
        form.setValue("address", profileData.address || "")
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error)
      setError("Error al cargar datos del usuario")
    } finally {
      setLoading(false)
    }

    // Al final de fetchUserData, agrega:
    console.log("Estado final:", {
      hasActiveSubscription,
      subscriptionData,
      bicycleCount,
      bicycleLimit: subscriptionData?.bicycle_limit,
    })
  }

  // Mostrar loading mientras se autentica
  if (authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-10">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Registrar Bicicleta</CardTitle>
            <CardDescription>Verificando autenticación...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si no hay usuario después de cargar, no mostrar nada (se redirigirá)
  if (!user) {
    return null
  }

  // Si no tiene suscripción activa, mostrar mensaje
  if (!loading && !hasActiveSubscription) {
    return (
      <div className="container mx-auto max-w-4xl py-10">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Suscripción requerida</CardTitle>
            <CardDescription>Necesitas una suscripción activa para registrar bicicletas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertTitle>Planes de suscripción disponibles</AlertTitle>
              <AlertDescription>
                Elige el plan que mejor se adapte a tus necesidades:
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>
                    <strong>Básico ($40 MXN/mes):</strong> 1 bicicleta
                  </li>
                  <li>
                    <strong>Estándar ($60 MXN/mes):</strong> 2 bicicletas
                  </li>
                  <li>
                    <strong>Familiar ($120 MXN/mes):</strong> 4 bicicletas
                  </li>
                  <li>
                    <strong>Premium ($180 MXN/mes):</strong> 6 bicicletas
                  </li>
                </ul>
                <p className="mt-2">Todos incluyen certificados oficiales, códigos QR y sistema de reportes de robo.</p>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/subscription")} className="w-full">
              Ver planes de suscripción
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Si el usuario ya alcanzó el límite de su plan, mostrar mensaje
  const bicycleLimit = subscriptionData?.bicycle_limit || 1
  if (!loading && bicycleCount >= bicycleLimit) {
    return (
      <div className="container mx-auto max-w-4xl py-10">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Límite de registros alcanzado</CardTitle>
            <CardDescription>Has alcanzado el límite de tu plan actual</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Límite del plan {subscriptionData?.plan_type}</AlertTitle>
              <AlertDescription>
                Tu plan actual permite registrar hasta {bicycleLimit} bicicleta{bicycleLimit > 1 ? "s" : ""}.
                Actualmente tienes {bicycleCount} bicicleta{bicycleCount > 1 ? "s" : ""} registrada
                {bicycleCount > 1 ? "s" : ""}.
                <br />
                <br />
                Puedes actualizar tu plan para registrar más bicicletas.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex space-x-2">
            <Button onClick={() => router.push("/bicycles")} variant="outline" className="flex-1">
              Ver mis bicicletas
            </Button>
            <Button onClick={() => router.push("/subscription")} className="flex-1">
              Actualizar plan
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

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

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de archivo no permitido. Solo PDF, JPG, PNG")
      return
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 5MB")
      return
    }

    setInvoice(file)
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
    const progressIncrement = 50 / images.length // 50% para imágenes

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

  const uploadInvoice = async (bicycleId: string): Promise<void> => {
    if (!invoice) return

    const formData = new FormData()
    formData.append("invoice", invoice)

    try {
      const response = await fetch(`/api/bicycles/${bicycleId}/invoice`, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Error al subir factura")

      setUploadProgress(100)
    } catch (error) {
      console.error("Error al subir factura:", error)
    }
  }

  const onSubmit = async (data: BicycleFormValues) => {
    if (!user) return

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Actualizar perfil con CURP y dirección si se proporcionaron
      if (data.curp || data.address) {
        const updateData: any = {}
        if (data.curp) updateData.curp = data.curp
        if (data.address) updateData.address = data.address

        const { error: updateError } = await supabase.from("profiles").update(updateData).eq("id", user.id)

        if (updateError) {
          throw new Error("Error al actualizar perfil: " + updateError.message)
        }
      }

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
          bikeType: data.bikeType,
          year: data.year,
          wheelSize: data.wheelSize,
          groupset: data.groupset,
          characteristics: data.characteristics,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Error al registrar bicicleta")
      }

      const bicycleId = result.bicycleId

      // 2. Subir imágenes si existen
      if (images.length > 0) {
        await uploadImages(bicycleId)
      }

      // 3. Subir factura si existe
      if (invoice) {
        await uploadInvoice(bicycleId)
      }

      // 4. Redirigir al panel de bicicletas
      router.push("/bicycles?success=true")
    } catch (error) {
      console.error("Error al registrar bicicleta:", error)
      setError(error instanceof Error ? error.message : "Error al registrar bicicleta")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-10">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Registrar Bicicleta</CardTitle>
            <CardDescription>Cargando datos...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Registrar Bicicleta</CardTitle>
          <CardDescription>
            Ingresa los datos de tu bicicleta para registrarla en el sistema nacional
            <br />
            <span className="text-sm text-muted-foreground">
              Tienes {bicycleCount} de {bicycleLimit} bicicletas registradas (Plan {subscriptionData?.plan_type})
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

          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Suscripción activa</AlertTitle>
            <AlertDescription>
              Tienes una suscripción activa desde el{" "}
              {subscriptionData?.created_at ? new Date(subscriptionData.created_at).toLocaleDateString() : ""}. Plan{" "}
              {subscriptionData?.plan_type} - hasta {bicycleLimit} bicicletas.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-medium">Información de la bicicleta</h3>

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de serie *</FormLabel>
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
                        <FormLabel>Marca *</FormLabel>
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
                        <FormLabel>Modelo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Marlin 5, Allez, Talon, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color *</FormLabel>
                        <FormControl>
                          <Input placeholder="Rojo, Azul, Negro, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bikeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de bicicleta *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bikeTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Año</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2024"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number.parseInt(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormDescription>Año de fabricación</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="wheelSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rodada</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona rodada" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {wheelSizes.map((size) => (
                              <SelectItem key={size.value} value={size.value}>
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Tamaño de rueda</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="groupset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grupo</FormLabel>
                        <FormControl>
                          <Input placeholder="Shimano Altus, SRAM GX, etc." {...field} />
                        </FormControl>
                        <FormDescription>Grupo de componentes</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-medium">Información personal</h3>

                <FormField
                  control={form.control}
                  name="curp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CURP</FormLabel>
                      <FormControl>
                        <Input placeholder="ABCD123456HDFXYZ01" {...field} />
                      </FormControl>
                      <FormDescription>Clave Única de Registro de Población (opcional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Calle, número, colonia, ciudad, estado, CP" {...field} />
                      </FormControl>
                      <FormDescription>Dirección completa (opcional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Imágenes de la bicicleta (máximo 4)</h3>
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
                        className="absolute right-1 top-1 rounded-full bg-white p-1 shadow-sm hover:bg-gray-100"
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
                  Sube hasta 4 fotos claras de tu bicicleta desde diferentes ángulos (opcional)
                </p>
              </div>

              {/* Nueva sección para factura */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-medium">Factura de compra (opcional)</h3>
                <div className="space-y-4">
                  {invoice ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">{invoice.name}</p>
                          <p className="text-sm text-green-600">{(invoice.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setInvoice(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted/50">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileText className="h-8 w-8" />
                        <span>Subir factura</span>
                        <span className="text-xs">PDF, JPG, PNG (máx. 5MB)</span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleInvoiceChange}
                      />
                    </label>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Sube la factura de compra de tu bicicleta para tener un respaldo adicional (opcional)
                  </p>
                </div>
              </div>

              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {uploadProgress < 50
                      ? "Subiendo imágenes..."
                      : uploadProgress < 100
                        ? "Subiendo factura..."
                        : "Completando registro..."}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Registrando bicicleta..." : "Registrar bicicleta"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Tu suscripción {subscriptionData?.plan_type} incluye el registro de hasta {bicycleLimit} bicicletas
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
