import Link from "next/link"
import { BikeIcon as Bicycle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Bicycle className="h-6 w-6 text-bike-primary" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Registro Nacional de Bicis. Todos los derechos reservados.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-6 md:px-0">
          <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
            Términos de servicio
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
            Política de privacidad
          </Link>
          <Link href="/contact" className="text-sm text-muted-foreground hover:underline">
            Contacto
          </Link>
        </div>
      </div>
    </footer>
  )
}
