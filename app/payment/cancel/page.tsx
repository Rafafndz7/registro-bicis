"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function PaymentCancelPage() {
  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            <CardTitle>Pago cancelado</CardTitle>
          </div>
          <CardDescription>El proceso de pago ha sido cancelado</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Pago no completado</AlertTitle>
            <AlertDescription>
              Has cancelado el proceso de pago. Tu bicicleta permanecerá en estado pendiente hasta que completes el
              pago.
            </AlertDescription>
          </Alert>

          <p className="text-center text-muted-foreground">
            Puedes intentar nuevamente el pago desde la sección de "Mis Bicicletas" en cualquier momento.
          </p>
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
