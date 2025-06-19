import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Award, Users, CheckCircle, BikeIcon, Star, Crown, Heart, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Acerca del Registro Nacional de Bicicletas</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Conoce más sobre nuestra misión, visión y el impacto que estamos generando en la seguridad de los ciclistas en
          México.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 mb-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-blue-600" />
              Nuestra Misión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Crear un sistema nacional confiable y accesible para el registro de bicicletas que ayude a reducir el
              robo, facilite la recuperación de bicicletas robadas y promueva una cultura de seguridad entre los
              ciclistas de México.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-green-600" />
              Nuestra Visión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Ser el sistema de referencia nacional para la identificación y registro de bicicletas, contribuyendo a
              crear comunidades ciclistas más seguras y promoviendo el uso de la bicicleta como medio de transporte
              sostenible en todo México.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">¿Por qué somos diferentes?</h2>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <BikeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-center">Sistema Nacional</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p>
                Somos el único registro con cobertura nacional y reconocimiento oficial, lo que facilita la
                identificación de bicicletas en todo el país.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-center">Seguridad Avanzada</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p>
                Utilizamos tecnología de punta para proteger los datos y garantizar la integridad de los registros de
                bicicletas en nuestra base de datos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-center">Comunidad Activa</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p>
                Contamos con una red de ciclistas comprometidos que colaboran activamente en la identificación y
                recuperación de bicicletas robadas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Nuestro Impacto</h2>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">+15,000</div>
              <p className="text-gray-600 font-medium">Bicicletas Registradas</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-green-600 mb-2">+500</div>
              <p className="text-gray-600 font-medium">Bicicletas Recuperadas</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-purple-600 mb-2">+8,000</div>
              <p className="text-gray-600 font-medium">Usuarios Activos</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-orange-600 mb-2">32</div>
              <p className="text-gray-600 font-medium">Estados Cubiertos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* NUEVA SECCIÓN DE PLANES DE SUSCRIPCIÓN */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Planes de Suscripción</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
          Ofrecemos diferentes planes para adaptarnos a las necesidades de cada ciclista, desde usuarios individuales
          hasta familias completas.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Plan Básico */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <BikeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Básico</CardTitle>
              <div className="text-3xl font-bold text-blue-600 mt-2">$40</div>
              <div className="text-gray-500">MXN/mes</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />1 bicicleta registrada
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Certificado oficial PDF
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Código QR de verificación
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Sistema de reportes
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Plan Estándar */}
          <Card className="border-2 border-primary shadow-xl bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 relative scale-105">
            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">Más Popular</Badge>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Star className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Estándar</CardTitle>
              <div className="text-3xl font-bold text-green-600 mt-2">$60</div>
              <div className="text-gray-500">MXN/mes</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />2 bicicletas registradas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Certificados oficiales PDF
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Códigos QR de verificación
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Soporte prioritario
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Plan Familiar */}
          <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 relative">
            <Badge className="absolute -top-2 right-4 bg-purple-600">Familiar</Badge>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Familiar</CardTitle>
              <div className="text-3xl font-bold text-purple-600 mt-2">$120</div>
              <div className="text-gray-500">MXN/mes</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />4 bicicletas registradas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Gestión familiar
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Soporte prioritario
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Todos los beneficios
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Plan Premium */}
          <Card className="border-yellow-200 shadow-lg bg-gradient-to-br from-white to-yellow-50 dark:from-gray-800 dark:to-yellow-900/20 relative">
            <Badge className="absolute -top-2 right-4 bg-yellow-600">Premium</Badge>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <Crown className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-xl">Premium</CardTitle>
              <div className="text-3xl font-bold text-yellow-600 mt-2">$180</div>
              <div className="text-gray-500">MXN/mes</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />6 bicicletas registradas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Soporte VIP 24/7
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Reportes avanzados
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Todos los beneficios
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link href="/subscription">
            <Button size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300">
              <Zap className="mr-2 h-4 w-4" />
              Ver todos los planes
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Nuestro Equipo</h2>

        <Card>
          <CardContent className="py-8">
            <div className="text-center max-w-3xl mx-auto">
              <p className="mb-6">
                Somos un equipo multidisciplinario de ciclistas apasionados, desarrolladores, expertos en seguridad y
                profesionales comprometidos con la movilidad sostenible.
              </p>

              <p className="mb-6">
                Nuestro equipo trabaja constantemente para mejorar el sistema, ampliar su alcance y desarrollar nuevas
                funcionalidades que beneficien a toda la comunidad ciclista.
              </p>

              <p>
                Colaboramos estrechamente con autoridades locales, asociaciones ciclistas y organizaciones de seguridad
                para crear un ecosistema integral de protección para las bicicletas en México.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-8 text-center">Preguntas Frecuentes</h2>

        <div className="space-y-6">
          {[
            {
              question: "¿Cómo funciona el registro de bicicletas?",
              answer:
                "El proceso es simple: creas una cuenta, te suscribes al servicio, registras los datos de tu bicicleta incluyendo fotos y características únicas, y recibes un certificado oficial con código QR para verificación.",
            },
            {
              question: "¿Cuáles son los diferentes planes disponibles?",
              answer:
                "Ofrecemos 4 planes: Básico ($40/mes - 1 bici), Estándar ($60/mes - 2 bicis), Familiar ($120/mes - 4 bicis) y Premium ($180/mes - 6 bicis). Cada plan incluye certificados oficiales, códigos QR y diferentes niveles de soporte.",
            },
            {
              question: "¿Qué hago si mi bicicleta es robada?",
              answer:
                "Si tu bicicleta registrada es robada, puedes reportarla inmediatamente en nuestro sistema. Esto la marcará como robada en la base de datos nacional, facilitando su identificación y recuperación.",
            },
            {
              question: "¿Cómo ayuda el registro a recuperar mi bicicleta?",
              answer:
                "Al estar registrada, cualquier persona puede verificar la propiedad de la bicicleta escaneando el código QR o buscando por número de serie. Si es identificada como robada, se muestra la información de contacto del propietario.",
            },
          ].map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
