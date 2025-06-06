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

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Obtener detalles de la bicicleta
  const { data: bicycle, error } = await supabase
    .from("bicycles")
    .select(`
      *,
      profiles (
        full_name,
        phone
      )
    `)
    .eq("id", params.id)
    .eq("payment_status", true)
    .single()

  if (error || !bicycle) {
    notFound()
  }

  // Obtener imágenes de la bicicleta
  const { data: images } = await supabase.from("bicycle_images").select("*").eq("bicycle_id", params.id)

  const bicycleImages = (images as BicycleImage[]) || []

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
                  <p className="font-semibold">Propietario: {bicycle.profiles?.full_name}</p>
                  {bicycle.profiles?.phone && (
                    <p className="flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-1" />
                      <a href={`tel:${bicycle.profiles.phone}`} className="text-white underline">
                        {bicycle.profiles.phone}
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
                  <div>
                    <p className="text-sm text-muted-foreground">Propietario</p>
                    <p className="font-medium">{bicycle.profiles?.full_name || "No disponible"}</p>
                  </div>
                  {bicycle.theft_status === "reported_stolen" && bicycle.profiles?.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contacto</p>
                      <p className="font-medium">{bicycle.profiles.phone}</p>
                    </div>
                  )}
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
