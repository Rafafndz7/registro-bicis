import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BikeIcon as Bicycle,
  Shield,
  Users,
  CheckCircle,
  QrCode,
  AlertTriangle,
  Phone,
  Star,
  MapPin,
  Clock,
  Award,
} from "lucide-react"
import { BicycleAnimation } from "@/components/bicycle-animation"
import { RecentRegistrations } from "@/components/recent-registrations"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

export default async function Page() {
  // Verificar si el usuario está autenticado
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const isLoggedIn = !!session

  // Determinar la URL del botón de registro
  const registerUrl = isLoggedIn ? "/bicycles/register" : "/auth/register"

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>

        <div className="container relative px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
              <div className="space-y-4">
                <Badge className="w-fit mx-auto lg:mx-0 bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200 text-sm px-4 py-2">
                  🚴‍♂️ Sistema Oficial Nacional de México
                </Badge>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                  Registro Nacional de Bicicletas
                </h1>
                <p className="max-w-[600px] mx-auto lg:mx-0 text-gray-600 text-lg md:text-xl leading-relaxed dark:text-gray-300">
                  Protege tu bicicleta con el registro oficial de México. Facilita su recuperación en caso de robo,
                  obtén certificados oficiales y contribuye a un sistema nacional de seguridad para ciclistas.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row justify-center lg:justify-start">
                <Link href={registerUrl}>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-12 px-8 text-base"
                  >
                    <Bicycle className="mr-2 h-5 w-5" />
                    {isLoggedIn ? "Registrar mi bicicleta" : "Crear cuenta y registrar"}
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Registro oficial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">100% seguro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">+10,000 usuarios</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-[500px]">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-2xl blur-2xl"></div>
                <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-2xl border border-white/20 dark:bg-gray-800/80">
                  <BicycleAnimation />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="w-full py-8 bg-white dark:bg-gray-900 border-b">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 opacity-60">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span className="text-sm font-medium">Certificado Oficial</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Datos Protegidos</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Disponible 24/7</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span className="text-sm font-medium">Cobertura Nacional</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-16 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Impacto Real en la Seguridad</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Números que demuestran la efectividad de nuestro sistema
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">+7,000</div>
                <p className="text-gray-600 font-medium">Bicicletas registradas</p>
                <p className="text-sm text-gray-500 mt-1">Y creciendo cada día</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-green-600 mb-2">+100</div>
                <p className="text-gray-600 font-medium">Bicicletas recuperadas</p>
                <p className="text-sm text-gray-500 mt-1">Gracias al apoyo del sistema de verificación</p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">+4,000</div>
                <p className="text-gray-600 font-medium">Usuarios activos</p>
                <p className="text-sm text-gray-500 mt-1">Comunidad comprometida</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              ¿Por qué registrar tu bicicleta?
            </h2>
            <p className="max-w-[900px] mx-auto text-gray-600 text-lg dark:text-gray-300">
              Conoce las ventajas de formar parte del sistema nacional de registro de bicicletas
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors duration-300">
                  <Bicycle className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Identificación Única</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600 dark:text-gray-300">
                  Tu bicicleta obtiene un registro único en la base de datos nacional, facilitando su identificación
                  ante autoridades y compradores.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200 transition-colors duration-300">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Mayor Seguridad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600 dark:text-gray-300">
                  Aumenta significativamente las posibilidades de recuperar tu bicicleta en caso de robo y disuade a los
                  ladrones.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors duration-300">
                  <QrCode className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Verificación QR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-600 dark:text-gray-300">
                  Código QR único para verificación instantánea. Cualquier persona puede verificar la legitimidad de tu
                  bicicleta.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">¿Cómo funciona?</h2>
            <p className="max-w-[900px] mx-auto text-gray-600 text-lg dark:text-gray-300">
              Proceso simple y rápido para proteger tu bicicleta
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {[
              {
                step: "1",
                title: "Regístrate",
                description: "Crea tu cuenta y completa tu perfil con información básica",
                color: "bg-blue-600",
              },
              {
                step: "2",
                title: "Suscríbete",
                description: "Suscripción mensual desde solo $40 MXN para acceso completo",
                color: "bg-green-600",
              },
              {
                step: "3",
                title: "Registra tu bici",
                description: "Agrega fotos, datos técnicos y características de tu bicicleta",
                color: "bg-purple-600",
              },
              {
                step: "4",
                title: "¡Protegida!",
                description: "Obtén tu certificado oficial y código QR de verificación",
                color: "bg-orange-600",
              },
            ].map((item, index) => (
              <div key={index} className="text-center space-y-4 group">
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${item.color} text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Registrations Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">Bicicletas Registradas</h2>
            <p className="max-w-[900px] mx-auto text-gray-600 text-lg dark:text-gray-300">
              Estas son algunas de las bicicletas recientemente registradas en nuestro sistema nacional
            </p>
          </div>
          <RecentRegistrations />
        </div>
      </section>

      {/* Emergency Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <Card className="mx-auto max-w-4xl border-red-200 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="text-center space-y-6 p-8">
              <div className="flex items-center justify-center">
                <div className="p-4 bg-red-100 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-red-800 dark:text-red-400">
                ¿Tu bicicleta fue robada?
              </h2>
              <p className="text-lg text-red-700 dark:text-red-300 max-w-2xl mx-auto">
                Si tu bicicleta registrada fue robada, repórtala inmediatamente en nuestro sistema. Esto ayudará a las
                autoridades y a la comunidad a identificarla y recuperarla.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={isLoggedIn ? "/bicycles" : "/auth/login?redirectTo=/bicycles"}>
                  <Button variant="destructive" size="lg" className="shadow-lg w-full sm:w-auto">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Reportar robo
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-red-300 text-red-700 hover:bg-red-50 w-full sm:w-auto"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Contactar autoridades
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              Planes para todos los ciclistas
            </h2>
            <p className="max-w-[900px] mx-auto text-gray-600 text-lg dark:text-gray-300">
              Elige el plan que mejor se adapte a tus necesidades de registro
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {/* Plan Básico */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm relative">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Básico</CardTitle>
                <CardDescription>Perfecto para un ciclista</CardDescription>
                <div className="text-4xl font-bold text-blue-600 mt-4">$40</div>
                <div className="text-gray-500">MXN/mes</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />1 bicicleta registrada
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Certificado oficial PDF
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Código QR de verificación
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Sistema de reportes
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Plan Estándar */}
            <Card className="border-2 border-primary shadow-xl bg-white/90 backdrop-blur-sm relative scale-105">
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">Más Popular</Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Estándar</CardTitle>
                <CardDescription>Ideal para múltiples bicis</CardDescription>
                <div className="text-4xl font-bold text-blue-600 mt-4">$60</div>
                <div className="text-gray-500">MXN/mes</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />2 bicicletas registradas
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Certificados oficiales PDF
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Códigos QR de verificación
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Soporte prioritario
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Plan Familiar */}
            <Card className="border-purple-200 shadow-lg bg-gradient-to-br from-white to-purple-50 relative">
              <Badge className="absolute -top-2 right-4 bg-purple-600">Familiar</Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Familiar</CardTitle>
                <CardDescription>Perfecto para familias</CardDescription>
                <div className="text-4xl font-bold text-purple-600 mt-4">$120</div>
                <div className="text-gray-500">MXN/mes</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />4 bicicletas registradas
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Gestión familiar
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Soporte prioritario
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Todos los beneficios
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Plan Premium */}
            <Card className="border-yellow-200 shadow-lg bg-gradient-to-br from-white to-yellow-50 relative">
              <Badge className="absolute -top-2 right-4 bg-yellow-600">Premium</Badge>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Premium</CardTitle>
                <CardDescription>Para coleccionistas</CardDescription>
                <div className="text-4xl font-bold text-yellow-600 mt-4">$180</div>
                <div className="text-gray-500">MXN/mes</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />6 bicicletas registradas
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Soporte VIP 24/7
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Reportes avanzados
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Todos los beneficios
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href={isLoggedIn ? "/subscription" : "/auth/register"}>
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300">
                Ver todos los planes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Arreglado el botón que se perdía */}
      <section className="w-full py-16 md:py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="container relative px-4 md:px-6 mx-auto max-w-7xl">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Protege tu bicicleta hoy mismo
            </h2>
            <p className="max-w-[600px] mx-auto text-white/90 text-lg leading-relaxed">
              Únete a miles de ciclistas que ya han registrado sus bicicletas en nuestro sistema nacional. La seguridad
              de tu bicicleta es nuestra prioridad.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row justify-center">
              <Link href={registerUrl}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-12 px-8"
                >
                  <Star className="mr-2 h-4 w-4" />
                  {isLoggedIn ? "Registrar bicicleta" : "Registrarme ahora"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
