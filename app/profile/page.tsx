"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, BikeIcon as Bicycle, CreditCard, Settings, AlertTriangle } from "lucide-react"

interface Profile {
  id: string
  full_name: string
  email: string
  phone: string
  address: string
  curp: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const fetchProfile = async () => {
      try {
        console.log("Cargando perfil para usuario:", user.id)
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error al cargar perfil:", error)
          throw error
        }

        console.log("Perfil cargado:", data)
        setProfile(data)
      } catch (error) {
        console.error("Error al cargar perfil:", error)
        setError("Error al cargar información de perfil")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, router, supabase])

  if (loading) {
    return (
      <div className="container py-10 max-w-4xl mx-auto">
        <div className="space-y-8">
          <div className="text-center">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto mt-2" />
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y suscripciones</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="bicycles">
              <Bicycle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Bicicletas</span>
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Suscripción</span>
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ajustes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Tus datos personales registrados en el sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre Completo</Label>
                    <Input id="full_name" value={profile?.full_name || ""} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" value={profile?.email || ""} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" value={profile?.phone || ""} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="curp">CURP</Label>
                    <Input id="curp" value={profile?.curp || ""} readOnly />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" value={profile?.address || ""} readOnly />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/profile/edit">
                  <Button>Editar Perfil</Button>
                </Link>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="bicycles">
            <Card>
              <CardHeader>
                <CardTitle>Mis Bicicletas</CardTitle>
                <CardDescription>Bicicletas registradas a tu nombre</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="mb-4">Gestiona tus bicicletas registradas o registra una nueva</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/bicycles">
                      <Button>Ver mis bicicletas</Button>
                    </Link>
                    <Link href="/bicycles/register">
                      <Button variant="outline">Registrar nueva bicicleta</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Mi Suscripción</CardTitle>
                <CardDescription>Estado de tu suscripción al Registro Nacional de Bicicletas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="mb-4">Gestiona tu suscripción, revisa tu estado actual o actualiza tu plan</p>
                  <Link href="/subscription">
                    <Button>Gestionar suscripción</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Ajustes de Cuenta</CardTitle>
                <CardDescription>Configura las preferencias de tu cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="mb-4">Cambia tu contraseña o actualiza la configuración de tu cuenta</p>
                  <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => router.push("/"))}>
                    Cerrar sesión
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
