"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, CreditCard } from "lucide-react"
import Link from "next/link"

interface BicyclePayment {
  id: string
  amount: number
  payment_status: string
  bicycles: {
    id: string
    serial_number: string
    brand: string
    model: string
    color: string
  }
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bicycleId = searchParams.get("bicycleId")
  const sessionId = searchParams.get("session_id")
  const supabase = createClientComponentClient()
  const [payment, setPayment] = useState<BicyclePayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    // Si hay un session_id, verificar el estado del pago
    if (sessionId) {
      setPaymentSuccess(true)
      setLoading(false)
      return
    }

    // Si no hay bicycleId, redirigir a la página de bicicletas
    if (!bicycleId) {
      router.push("/bicycles")
      return
    }

    const fetchPaymentDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("payments")
          .select(
            `
            id,
            amount,
            payment_status,
            bicycles (
              id,
              serial_number,
              brand,
              model,
              color
            )
          `,
          )
          .eq("bicycle_id", bicycleId)
          .eq("user_id", user.id)
          .eq("payment_status", "pending")
          .single()

        if (error) throw error

        setPayment(data)
      } catch (error) {
        console.error("Error al cargar detalles del pago:", error)
        setError("No se encontró un pago pendiente para esta bicicleta")
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [user, router, supabase, bicycleId, sessionId])

  const handlePayment = async () => {
    if (!payment) return

    try {
      // Guardar el bicycleId en localStorage para recuperarlo en la página de éxito
      localStorage.setItem("currentCheckoutBicycleId", payment.bicycles.id)

      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bicycleId: payment.bicycles.id }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error al crear sesión de pago:", error)
      setError("Error al procesar el pago. Inténtalo de nuevo más tarde.")
    }
  }

  if (loading) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (paymentSuccess) {
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

  if (error || !payment) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <CardTitle>Error al procesar el pago</CardTitle>
            </div>
            <CardDescription>No se pudo encontrar la información de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error || "No se encontró un pago pendiente para esta bicicleta"}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Link href="/bicycles">
              <Button>Ver mis bicicletas</Button>
            </Link>
            <Link href="/bicycles/register">
              <Button variant="outline">Registrar otra bicicleta</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Completar pago de registro</CardTitle>
          <CardDescription>
            Realiza el pago para completar el registro de tu bicicleta en el sistema nacional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-lg font-medium">Detalles de la bicicleta</h3>
            <div className="grid gap-2">
              <div className="grid grid-cols-2">
                <span className="text-sm text-muted-foreground">Marca y modelo:</span>
                <span>
                  {payment.bicycles.brand} {payment.bicycles.model}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-sm text-muted-foreground">Número de serie:</span>
                <span>{payment.bicycles.serial_number}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-sm text-muted-foreground">Color:</span>
                <span>{payment.bicycles.color}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Total a pagar</h3>
                <p className="text-sm text-muted-foreground">Registro anual - Incluye IVA y todos los cargos</p>
              </div>
              <span className="text-2xl font-bold">$250.00 MXN</span>
            </div>
          </div>

          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertTitle>Pago seguro</AlertTitle>
            <AlertDescription>
              Todos los pagos son procesados de forma segura a través de Stripe. No almacenamos tu información de pago.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button onClick={handlePayment} className="w-full" size="lg">
            Pagar con tarjeta
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Al completar el pago, aceptas nuestros términos y condiciones del servicio.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
