"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    if (!sessionId) {
      router.push("/bicycles")
    }
  }, [sessionId, router])

  if (!sessionId) {
    return null
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <CardTitle>¡Pago completado con éxito!</CardTitle>
          </div>
          <CardDescription>Tu bicicleta ha sido registrada oficialmente en el sistema nacional</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Registro exitoso</AlertTitle>
            <AlertDescription className="text-green-600">
              El pago ha sido procesado correctamente y tu bicicleta está ahora registrada en el sistema nacional.
              Recibirás un correo electrónico con los detalles de tu registro.
            </AlertDescription>
          </Alert>

          <div className="mt-6 rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">ID de transacción</p>
            <p className="font-mono text-xs">{sessionId}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Link href="/bicycles">
            <Button>Ver mis bicicletas</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Volver al inicio</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
