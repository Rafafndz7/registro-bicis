"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [isUpdating, setIsUpdating] = useState(false)
  const [bicycleId, setBicycleId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      router.push("/bicycles")
      return
    }

    // Intentar obtener el bicycleId de localStorage (guardado durante el checkout)
    const storedBicycleId = localStorage.getItem("currentCheckoutBicycleId")
    if (storedBicycleId) {
      setBicycleId(storedBicycleId)
      // Limpiar después de obtenerlo
      localStorage.removeItem("currentCheckoutBicycleId")
    }

    // Intentar actualizar manualmente el estado del pago (útil en entorno de prueba)
    const updatePaymentStatus = async () => {
      if (!storedBicycleId) return

      try {
        setIsUpdating(true)
        const response = await fetch("/api/payments/update-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bicycleId: storedBicycleId,
            sessionId,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Error al actualizar estado de pago")
        }

        setUpdateSuccess(true)
      } catch (error) {
        console.error("Error al actualizar estado de pago:", error)
        setUpdateError(
          "El pago se procesó correctamente en Stripe, pero hubo un problema al actualizar el estado en nuestro sistema. No te preocupes, tu pago está seguro y procesaremos la actualización manualmente.",
        )
      } finally {
        setIsUpdating(false)
      }
    }

    updatePaymentStatus()
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
          <CardDescription>Tu pago ha sido procesado correctamente por Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">Pago confirmado</AlertTitle>
            <AlertDescription className="text-green-600">
              Stripe ha confirmado que tu pago de $250 MXN se procesó exitosamente.
            </AlertDescription>
          </Alert>

          {isUpdating && (
            <div className="mb-4 flex items-center justify-center space-x-2 rounded-md bg-blue-50 p-4 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Actualizando el estado de tu registro...</span>
            </div>
          )}

          {updateSuccess && (
            <Alert className="mb-4 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">¡Registro completado!</AlertTitle>
              <AlertDescription className="text-green-600">
                Tu bicicleta ha sido registrada oficialmente en el sistema nacional. Ya puedes descargar tu certificado
                y código QR.
              </AlertDescription>
            </Alert>
          )}

          {updateError && (
            <Alert className="mb-4 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-700">Procesando registro</AlertTitle>
              <AlertDescription className="text-amber-700">
                {updateError}
                <br />
                <br />
                <strong>¿Qué hacer ahora?</strong>
                <br />
                1. Tu pago está confirmado y seguro
                <br />
                2. Puedes verificar el estado en "Mis Bicicletas"
                <br />
                3. Si el problema persiste, contáctanos con el ID de transacción
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 rounded-lg bg-muted p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">ID de transacción de Stripe</p>
              <p className="font-mono text-xs break-all">{sessionId}</p>
              <p className="mt-2 text-xs text-muted-foreground">Guarda este ID para cualquier consulta sobre tu pago</p>
            </div>
          </div>

          {!isUpdating && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {updateSuccess
                  ? "¡Todo listo! Tu bicicleta está oficialmente registrada."
                  : "Revisa el estado de tu registro en la sección 'Mis Bicicletas'."}
              </p>
            </div>
          )}
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
