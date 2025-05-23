"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { BikeIcon as Bicycle, User } from "lucide-react"
import Link from "next/link"

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

interface BicycleCount {
  count: number
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bicycleCount, setBicycleCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const fetchProfile = async () => {
      try {
        // Obtener perfil del usuario
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) throw profileError

        // Obtener cantidad de bicicletas registradas
        const { count, error: countError } = await supabase
          .from("bicycles")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        if (countError) throw countError

        setProfile(profileData)
        setBicycleCount(count || 0)
      } catch (error) {
        console.error("Error al cargar datos del perfil:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, router, supabase])

  if (loading) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
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

  if (!profile) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>Perfil no encontrado</CardTitle>
            <CardDescription>No se pudo cargar la información del perfil</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Volver al inicio</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-bike-primary/10 p-2">
              <User className="h-8 w-8 text-bike-primary" />
            </div>
            <div>
              <CardTitle>{profile.full_name}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {profile.curp && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">CURP</h3>
                <p className="text-lg font-medium">{profile.curp}</p>
              </div>
            )}
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Fecha de nacimiento</h3>
              <p className="text-lg font-medium">{formatDate(profile.birth_date)}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Teléfono</h3>
              <p className="text-lg font-medium">{profile.phone}</p>
            </div>
          </div>

          {profile.address && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Dirección</h3>
              <p className="text-lg font-medium">{profile.address}</p>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bicycle className="h-5 w-5 text-bike-primary" />
                <span className="font-medium">Bicicletas registradas</span>
              </div>
              <span className="text-2xl font-bold">{bicycleCount}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/profile/edit")}>
            Editar perfil
          </Button>
          <Link href="/bicycles/register">
            <Button className="bg-bike-primary hover:bg-bike-primary/90">Registrar bicicleta</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
