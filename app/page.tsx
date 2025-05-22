import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BikeIcon as Bicycle, Shield, CreditCard, Search } from "lucide-react"
import { BicycleAnimation } from "@/components/bicycle-animation"
import { RecentRegistrations } from "@/components/recent-registrations"

export default function Page() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Registro Nacional de Bicicletas
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Protege tu bicicleta con el registro oficial. Facilita su recuperación en caso de robo y contribuye a
                  un sistema nacional de seguridad para ciclistas.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-bike-primary hover:bg-bike-primary/90">
                    Registrar mi bicicleta
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline">
                    Iniciar sesión
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              {/* Reemplazamos la imagen estática con la animación de bicicletas */}
              <div className="w-full max-w-[550px] overflow-hidden rounded-xl bg-white p-4 shadow-lg dark:bg-gray-800">
                <BicycleAnimation />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Beneficios del Registro Nacional
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Conoce las ventajas de registrar tu bicicleta en nuestro sistema nacional
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3 lg:gap-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bike-primary/10">
                <Bicycle className="h-8 w-8 text-bike-primary" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold">Identificación Única</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tu bicicleta obtiene un registro único en la base de datos nacional, facilitando su identificación.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bike-primary/10">
                <Shield className="h-8 w-8 text-bike-primary" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold">Mayor Seguridad</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aumenta las posibilidades de recuperar tu bicicleta en caso de robo y disuade a los ladrones.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bike-primary/10">
                <CreditCard className="h-8 w-8 text-bike-primary" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold">Proceso Simple</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Registro rápido y sencillo con pago en línea seguro a través de nuestra plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Registrations Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-800/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Bicicletas Registradas</h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Estas son algunas de las bicicletas recientemente registradas en nuestro sistema
              </p>
            </div>
            <RecentRegistrations />
            <div className="w-full max-w-sm pt-6">
              <Link href="/search">
                <Button className="w-full" size="lg">
                  <Search className="mr-2 h-4 w-4" /> Buscar bicicleta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-bike-primary text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Protege tu bicicleta hoy mismo
              </h2>
              <p className="max-w-[600px] text-white/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Únete a miles de ciclistas que ya han registrado sus bicicletas en nuestro sistema nacional
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary">
                  Registrarme ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
