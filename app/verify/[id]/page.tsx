import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDate } from "@/lib/utils"
import { CheckCircle, AlertTriangle, Phone, QrCode } from "lucide-react"
import Link from "next/link"

interface BicycleImage {
  id: string
  bicycle_id: string
  image_url: string
}

interface BicycleWithOwner {
  id: string
  user_id: string
  serial_number: string
  brand: string
  model: string
  color: string
  characteristics: string | null
  bike_type: string
  year: number | null
  wheel_size: string | null
  groupset: string | null
  registration_date: string
  payment_status: boolean
  theft_status: string
  created_at: string
  updated_at: string
  owner_name: string | null
  owner_phone: string | null
}

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Hacer JOIN explícito para obtener información del propietario
  const { data: bicycleData, error } = await supabase
    .from("bicycles")
    .select(`
      *,
      profiles!bicycles_user_id_fkey (
        full_name,
        phone
      )
    `)
    .eq("id", params.id)
    .eq("payment_status", true)
    .single()

  console.log("🚴 Bicycle data from DB:", bicycleData)
  console.log("❌ Error:", error)

  // Si la consulta con relación falla, intentamos con una consulta separada
  if (error || !bicycleData) {
    console.log("🔄 Trying alternative query...")

    // Primero obtener la bicicleta
    const { data: bicycle, error: bicycleError } = await supabase
      .from("bicycles")
      .select("*")
      .eq("id", params.id)
      .eq("payment_status", true)
      .single()

    if (bicycleError || !bicycle) {
      console.error("❌ Error fetching bicycle:", bicycleError)
      notFound()
    }

    // Luego obtener el perfil del propietario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", bicycle.user_id)
      .single()

    console.log("👤 Profile data:", profile)
    console.log("❌ Profile error:", profileError)

    // Combinar los datos
    const combinedData = {
      ...bicycle,
      profiles: profile || null,
    }

    return renderPage(combinedData, params.id, supabase)
  }

  return renderPage(bicycleData, params.id, supabase)
}

async function renderPage(bicycle: any, bicycleId: string, supabase: any) {
  // Obtener imágenes de la bicicleta
  const { data: images } = await supabase.from("bicycle_images").select("*").eq("bicycle_id", bicycleId)
  const bicycleImages = (images as BicycleImage[]) || []

  console.log("🖼️ Images:", images)
  console.log("👤 Final bicycle with profile:", bicycle)

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Verificación de Bicicleta</h1>
          <p className="text-muted-foreground">Información oficial del Registro Nacional de Bicicletas</p>
        </div>

        <Card className={bicycle.theft_status === "reported_stolen" ? "border-red-500" : "border-green-500"}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  {bicycle.brand} {bicycle.model}
                  {bicycle.theft_status === "reported_stolen" ? (
                    <Badge variant="destructive" className="ml-2">
                      ROBADA
                    </Badge>
                  ) : (
                    <Badge variant="default" className="ml-2 bg-green-600">
                      REGISTRADA
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>ID de registro: {bicycle.id}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {bicycle.theft_status === "reported_stolen" ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Bicicleta reportada como robada</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Esta bicicleta ha sido reportada como robada por su propietario legítimo.</p>
                  <p className="font-semibold">Propietario: {bicycle.profiles?.full_name || "No disponible"}</p>
                  {bicycle.profiles?.phone && (
                    <p className="flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-1" />
                      <a href={`https://wa.me/52${bicycle.profiles.phone}`} className="text-white underline">
                        {bicycle.profiles.phone} (WhatsApp)
                      </a>
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Bicicleta registrada oficialmente</AlertTitle>
                <AlertDescription className="text-green-700">
                  Esta bicicleta está registrada oficialmente en el Registro Nacional de Bicicletas.
                </AlertDescription>
              </Alert>
            )}

            {/* Información de contacto SIEMPRE visible */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium mb-3 text-blue-800 text-lg">👤 Información del propietario</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-blue-700">Nombre:</span>
                  <span className="text-blue-900 text-lg">
                    {bicycle.profiles?.full_name || "Cargando información..."}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-blue-700">User ID:</span>
                  <span className="text-blue-900 text-sm">{bicycle.user_id}</span>
                </div>
                {bicycle.profiles?.phone ? (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Contacto:</span>
                    <a
                      href={`https://wa.me/52${bicycle.profiles.phone}`}
                      className="text-blue-900 underline hover:text-blue-700 font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {bicycle.profiles.phone} (WhatsApp)
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-600">Contacto:</span>
                    <span className="text-gray-500">Buscando información...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">Información de la bicicleta</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Marca</p>
                    <p className="font-medium">{bicycle.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-medium">{bicycle.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium">{bicycle.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Número de serie</p>
                    <p className="font-medium">{bicycle.serial_number}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Información del registro</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de registro</p>
                    <p className="font-medium">{formatDate(bicycle.registration_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="font-medium">
                      {bicycle.theft_status === "reported_stolen" ? "Reportada como robada" : "Registrada oficialmente"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {bicycleImages.length > 0 && (
              <div>
                <h3 className="font-medium mb-4">Imágenes registradas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {bicycleImages.map((image) => (
                    <div key={image.id} className="aspect-square rounded-md overflow-hidden border">
                      <img
                        src={image.image_url || "/placeholder.svg"}
                        alt={`${bicycle.brand} ${bicycle.model}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bicycle.characteristics && (
              <div>
                <h3 className="font-medium mb-2">Características adicionales</h3>
                <p>{bicycle.characteristics}</p>
              </div>
            )}

            {/* DEBUG INFO - Remover en producción */}
            <div className="bg-gray-100 p-4 rounded text-xs">
              <p>
                <strong>DEBUG:</strong>
              </p>
              <p>Bicycle ID: {bicycle.id}</p>
              <p>User ID: {bicycle.user_id}</p>
              <p>Profile data: {JSON.stringify(bicycle.profiles)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center w-full">
              <p className="text-sm text-muted-foreground mb-2">
                Este es un documento oficial del Registro Nacional de Bicicletas
              </p>
              <div className="flex justify-center">
                <QrCode className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Link href="/search" className="w-full">
                <Button variant="outline" className="w-full">
                  Verificar otra bicicleta
                </Button>
              </Link>
              <Link href="/" className="w-full">
                <Button className="w-full">Ir al inicio</Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
