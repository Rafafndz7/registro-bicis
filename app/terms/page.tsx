import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function TermsOfServicePage() {
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
          <h1 className="mb-4 text-3xl font-bold">Términos de Servicio</h1>
          <p className="text-muted-foreground">Última actualización: 23 de mayo de 2025</p>
        </div>

        <div className="space-y-4">
          <p>
            Bienvenido a Registro Nacional de Bicis. Estos términos y condiciones describen las reglas y regulaciones
            para el uso del sitio web de Registro Nacional de Bicis, ubicado en registronacionaldebicis.com.
          </p>

          <p>
            Al acceder a este sitio web, asumimos que aceptas estos términos y condiciones. No continúes usando Registro
            Nacional de Bicis si no estás de acuerdo con todos los términos y condiciones establecidos en esta página.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Licencia</h2>
          <p>
            A menos que se indique lo contrario, Registro Nacional de Bicis y/o sus licenciantes poseen los derechos de
            propiedad intelectual de todo el material en Registro Nacional de Bicis. Todos los derechos de propiedad
            intelectual están reservados.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Restricciones</h2>
          <p>Se te restringe específicamente de todo lo siguiente:</p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Publicar cualquier material del sitio web en cualquier otro medio</li>
            <li>Vender, sublicenciar y/o comercializar cualquier material del sitio web</li>
            <li>Realizar y/o mostrar públicamente cualquier material del sitio web</li>
            <li>Usar este sitio web de cualquier manera que pueda dañar el sitio o impedir su acceso</li>
            <li>Usar este sitio web de cualquier manera que impacte el acceso de usuarios al sitio</li>
            <li>
              Usar este sitio web contrario a las leyes y regulaciones aplicables, o que pueda causar daño al sitio
            </li>
            <li>
              Participar en cualquier minería de datos, recolección de datos, extracción de datos o cualquier otra
              actividad similar
            </li>
            <li>Usar este sitio web para participar en cualquier publicidad o marketing</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold">Registro de Bicicletas</h2>
          <p>
            Al registrar una bicicleta en nuestro sistema, declaras y garantizas que eres el propietario legítimo de la
            bicicleta o que tienes la autorización del propietario para registrarla. Proporcionar información falsa o
            registrar bicicletas robadas o de procedencia ilícita está estrictamente prohibido y puede resultar en
            acciones legales.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Pagos</h2>
          <p>
            El registro de bicicletas en nuestro sistema tiene un costo de $250 MXN por bicicleta. Este pago es único y
            no reembolsable una vez que la bicicleta ha sido registrada exitosamente. Los pagos se procesan a través de
            Stripe, un procesador de pagos seguro de terceros.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Privacidad</h2>
          <p>
            Tu privacidad es importante para nosotros. Consulta nuestra{" "}
            <Link href="/privacy" className="text-bike-primary hover:underline">
              Política de Privacidad
            </Link>{" "}
            para entender cómo recopilamos, usamos y protegemos tu información personal.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Limitación de Responsabilidad</h2>
          <p>
            En ningún caso Registro Nacional de Bicis, ni sus directores, empleados, socios, agentes, proveedores o
            afiliados, serán responsables por cualquier daño indirecto, incidental, especial, consecuente o punitivo,
            incluyendo sin limitación, pérdida de ganancias, datos, uso, buena voluntad, u otras pérdidas intangibles,
            resultantes de (i) tu acceso o uso o incapacidad para acceder o usar el Servicio; (ii) cualquier conducta o
            contenido de terceros en el Servicio; (iii) cualquier contenido obtenido del Servicio; y (iv) acceso no
            autorizado, uso o alteración de tus transmisiones o contenido, ya sea basado en garantía, contrato, agravio
            (incluyendo negligencia) o cualquier otra teoría legal, ya sea que hayamos sido informados o no de la
            posibilidad de tal daño.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Cambios a estos Términos</h2>
          <p>
            Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier
            momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que
            los nuevos términos entren en vigencia. Lo que constituye un cambio material será determinado a nuestra sola
            discreción.
          </p>

          <h2 className="mt-6 text-xl font-semibold">Contacto</h2>
          <p>
            Si tienes alguna pregunta sobre estos Términos, por favor{" "}
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
