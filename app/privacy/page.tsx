import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver al inicio
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="mb-4 text-3xl font-bold">Política de Privacidad</h1>
          <p className="text-muted-foreground">Última actualización: 23 de mayo de 2025</p>
        </div>

        <div className="space-y-4">
          <p>
            En Registro Nacional de Bicis, accesible desde registronacionaldebicis.com, una de nuestras principales
            prioridades es la privacidad de nuestros visitantes. Este documento de Política de Privacidad contiene los
            tipos de información que se recopilan y registran por Registro Nacional de Bicis y cómo la utilizamos.
          </p>

          <p>
            Si tienes preguntas adicionales o requieres más información sobre nuestra Política de Privacidad, no dudes
            en contactarnos.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Información que recopilamos</h2>
          <p>
            Cuando te registras en nuestro sitio, se te solicita proporcionar cierta información personal, incluyendo:
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Nombre completo</li>
            <li>Dirección de correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Fecha de nacimiento</li>
            <li>CURP (opcional)</li>
            <li>Dirección (opcional)</li>
            <li>Información sobre tus bicicletas (número de serie, marca, modelo, color, etc.)</li>
            <li>Imágenes de tus bicicletas</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold">Cómo utilizamos tu información</h2>
          <p>Utilizamos la información que recopilamos de varias formas, incluyendo:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Proporcionar, operar y mantener nuestro sitio web</li>
            <li>Mejorar, personalizar y expandir nuestro sitio web</li>
            <li>Entender y analizar cómo utilizas nuestro sitio web</li>
            <li>Desarrollar nuevos productos, servicios, características y funcionalidades</li>
            <li>Facilitar la recuperación de bicicletas robadas</li>
            <li>Verificar la propiedad de bicicletas registradas</li>
            <li>Procesar transacciones de pago</li>
            <li>Comunicarnos contigo, ya sea directamente o a través de uno de nuestros socios</li>
            <li>Enviarte correos electrónicos relacionados con el servicio</li>
            <li>Encontrar y prevenir fraudes</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold">Cookies</h2>
          <p>
            Registro Nacional de Bicis utiliza cookies para mejorar la experiencia del usuario. Las cookies son archivos
            de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Utilizamos cookies para recordar
            tus preferencias, entender cómo interactúas con nuestro sitio y mejorar tu experiencia.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Seguridad</h2>
          <p>
            La seguridad de tu información personal es importante para nosotros, pero recuerda que ningún método de
            transmisión por Internet o método de almacenamiento electrónico es 100% seguro. Aunque nos esforzamos por
            utilizar medios comercialmente aceptables para proteger tu información personal, no podemos garantizar su
            seguridad absoluta.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Cambios a esta política de privacidad</h2>
          <p>
            Podemos actualizar nuestra Política de Privacidad de vez en cuando. Te notificaremos cualquier cambio
            publicando la nueva Política de Privacidad en esta página y actualizando la fecha de "última actualización"
            en la parte superior.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Contacto</h2>
          <p>
            Si tienes alguna pregunta sobre esta Política de Privacidad, por favor{" "}
            <Link href="/contact" className="text-bike-primary hover:underline">
              contáctanos
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
