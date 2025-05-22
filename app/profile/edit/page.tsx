"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { validatePhone } from "@/lib/utils"
import { AlertCircle, CheckCircle2 } from "lucide-react"

// Esquema de validación
const profileSchema = z.object({
  fullName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  phone: z.string().refine(validatePhone, {
    message: "Número de teléfono inválido",
  }),
  address: z.string().min(10, { message: "La dirección debe tener al menos 10 caracteres" }),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface Profile {
  id: string
  full_name: string
  email: string
  birth_date: string
  curp: string
  address: string
  phone: string
  role: string
}

export default function EditProfilePage() {
  const { user, refreshSession } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
    },
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) throw error

        setProfile(data)
        form.reset({
          fullName: data.full_name,
          phone: data.phone,
          address: data.address,
        })
      } catch (error) {
        console.error("Error al cargar perfil:", error)
        setError("No se pudo cargar la información del perfil")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, router, supabase, form])

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          phone: data.phone,
          address: data.address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setSuccess("Perfil actualizado correctamente")
      await refreshSession()
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      setError("Error al actualizar perfil")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Editar perfil</CardTitle>
            <CardDescription>Actualiza tu información personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded-md bg-muted" />
                <div className="h-10 w-full rounded-md bg-muted" />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <div className="h-10 w-full rounded-md bg-muted" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No se pudo cargar la información del perfil</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/profile")}>Volver al perfil</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Editar perfil</CardTitle>
          <CardDescription>Actualiza tu información personal</CardDescription>
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
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Correo electrónico
                  </label>
                  <Input value={profile.email} disabled className="mt-1" />
                  <p className="mt-1 text-xs text-muted-foreground">No se puede cambiar</p>
                </div>

                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    CURP
                  </label>
                  <Input value={profile.curp} disabled className="mt-1" />
                  <p className="mt-1 text-xs text-muted-foreground">No se puede cambiar</p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/profile")}>
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
