import Link from "next/link"
import { BikeIcon as Bicycle, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo y descripción */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bicycle className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">RNB</span>
            </div>
            <p className="text-gray-300 text-sm">
              Registro Nacional de Bicicletas - El sistema oficial de México para proteger tu bicicleta y facilitar su
              recuperación.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enlaces rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  Acerca de nosotros
                </Link>
              </li>
              <li>
                <Link href="/subscription" className="text-gray-300 hover:text-white transition-colors">
                  Planes y precios
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/bicycles/register" className="text-gray-300 hover:text-white transition-colors">
                  Registrar bicicleta
                </Link>
              </li>
            </ul>
          </div>

          {/* Servicios */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Servicios</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-300">Registro oficial</span>
              </li>
              <li>
                <span className="text-gray-300">Certificados digitales</span>
              </li>
              <li>
                <span className="text-gray-300">Códigos QR únicos</span>
              </li>
              <li>
                <span className="text-gray-300">Reportes de robo</span>
              </li>
              <li>
                <span className="text-gray-300">Verificación pública</span>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 break-all">soporteregistronacionalbicis@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">(618) 261-4228</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">Ciudad de México, México</span>
              </div>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400 text-center md:text-left">
              &copy; {new Date().getFullYear()} Registro Nacional de Bicicletas. Todos los derechos reservados.
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-center">
                Términos de servicio
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-center">
                Política de privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
