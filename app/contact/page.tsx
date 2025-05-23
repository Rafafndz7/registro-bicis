"use client"

import { useState } from "react"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ChevronLeft, AlertCircle, CheckCircle2, Mail, Phone, MapPin } from "lucide-react"

// Esquema de validación
const contactSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  subject: z.string().min(5, { message: "El asunto debe tener al menos 5 caracteres" }),
  message: z.string().min(10, { message: "El mensaje debe tener al menos 10 caracteres" }),
})

type ContactFormValues = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Aquí iría la lógica para enviar el formulario
      // Por ahora, simulamos un envío exitoso
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuccess(true)
      form.reset()
    } catch (error) {
      setError("Hubo un error al enviar tu mensaje. Por favor, intenta de nuevo más tarde.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver al inicio
        </Link>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h1 className="mb-4 text-3xl font-bold">Contacto</h1>
          <p className="mb-6 text-muted-foreground">
            ¿Tienes alguna pregunta o comentario? Estamos aquí para ayudarte. Completa el formulario y nos pondremos en
            contacto contigo lo antes posible.
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Mail className="mt-0.5 h-5 w-5 text-bike-primary" />
              <div>
                <h3 className="font-medium">Correo electrónico</h3>
                <p className="text-muted-foreground">contacto@registronacionaldebicis.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="mt-0.5 h-5 w-5 text-bike-primary" />
              <div>
                <h3 className="font-medium">Teléfono</h3>
                <p className="text-muted-foreground">(55) 1234-5678</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="mt-0.5 h-5 w-5 text-bike-primary" />
              <div>
                <h3 className="font-medium">Dirección</h3>
                <p className="text-muted-foreground">
                  Av. Insurgentes Sur 1602, Crédito Constructor, Benito Juárez, 03940 Ciudad de México, CDMX
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Envíanos un mensaje</CardTitle>
              <CardDescription>Completa el formulario a continuación para contactarnos</CardDescription>
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
                  <AlertTitle className="text-green-600">Mensaje enviado</AlertTitle>
                  <AlertDescription className="text-green-600">
                    Hemos recibido tu mensaje. Te responderemos lo antes posible.
                  </AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Tu nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo electrónico</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="tu@correo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asunto</FormLabel>
                        <FormControl>
                          <Input placeholder="Asunto de tu mensaje" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Escribe tu mensaje aquí" rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : "Enviar mensaje"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
