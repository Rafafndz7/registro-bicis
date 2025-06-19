import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container max-w-4xl py-12 px-6 mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white text-center">
            <h1 className="text-4xl font-bold mb-4">Términos de Servicio</h1>
            <p className="text-blue-100 text-lg">Última actualización: 19 de junio de 2025</p>
          </div>

          <div className="px-8 py-12 space-y-8">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                Bienvenido a Registro Nacional de Bicis. Estos términos y condiciones describen las reglas y
                regulaciones para el uso del sitio web de Registro Nacional de Bicis, ubicado en
                registronacionaldebicis.com.
              </p>

              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                Al acceder a este sitio web, asumimos que aceptas estos términos y condiciones. No continúes usando
                Registro Nacional de Bicis si no estás de acuerdo con todos los términos y condiciones establecidos en
                esta página.
              </p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Licencia</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  A menos que se indique lo contrario, Registro Nacional de Bicis y/o sus licenciantes poseen los
                  derechos de propiedad intelectual de todo el material en Registro Nacional de Bicis. Todos los
                  derechos de propiedad intelectual están reservados.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Restricciones</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Se te restringe específicamente de todo lo siguiente:
                </p>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Publicar cualquier material del sitio web en cualquier otro medio
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Vender, sublicenciar y/o comercializar cualquier material del sitio web
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Realizar y/o mostrar públicamente cualquier material del sitio web
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Usar este sitio web de cualquier manera que pueda dañar el sitio o impedir su acceso
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Usar este sitio web de cualquier manera que impacte el acceso de usuarios al sitio
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Usar este sitio web contrario a las leyes y regulaciones aplicables, o que pueda causar daño al
                    sitio
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Participar en cualquier minería de datos, recolección de datos, extracción de datos o cualquier otra
                    actividad similar
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Usar este sitio web para participar en cualquier publicidad o marketing
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Registro de Bicicletas</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Al registrar una bicicleta en nuestro sistema, declaras y garantizas que eres el propietario legítimo
                  de la bicicleta o que tienes la autorización del propietario para registrarla. Proporcionar
                  información falsa o registrar bicicletas robadas o de procedencia ilícita está estrictamente prohibido
                  y puede resultar en acciones legales.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-lg border-l-4 border-blue-500">
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    <strong>💡 Importante:</strong> Una vez registrada tu bicicleta, recuerda descargar tu código QR y
                    certificado oficial en tu dispositivo móvil para tener acceso rápido en caso de necesitarlo para
                    verificación o en situaciones de emergencia.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Planes de Suscripción y Pagos</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  Ofrecemos diferentes planes de suscripción mensual para adaptarse a las necesidades de cada usuario:
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Plan Básico - $40 MXN/mes</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      1 bicicleta registrada, certificado oficial PDF, código QR de verificación, sistema de reportes
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="font-bold text-green-600 dark:text-green-400 mb-2">Plan Estándar - $60 MXN/mes</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      2 bicicletas registradas, certificados oficiales PDF, códigos QR de verificación, soporte
                      prioritario
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="font-bold text-purple-600 dark:text-purple-400 mb-2">
                      Plan Familiar - $120 MXN/mes
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      4 bicicletas registradas, gestión familiar, soporte prioritario, todos los beneficios
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="font-bold text-yellow-600 dark:text-yellow-400 mb-2">Plan Premium - $180 MXN/mes</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      6 bicicletas registradas, soporte VIP 24/7, reportes avanzados, todos los beneficios
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-6">
                  Los pagos se procesan mensualmente a través de Stripe, un procesador de pagos seguro de terceros. Las
                  suscripciones se renuevan automáticamente cada mes hasta que sean canceladas.
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 my-8 border-l-4 border-red-500">
                <h2 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-4">Cancelación de Suscripciones</h2>
                <p className="text-red-700 dark:text-red-300 leading-relaxed mb-4">
                  Para cancelar tu suscripción, debes contactarnos directamente a través de nuestro formulario de
                  contacto o enviando un correo electrónico. Debido a las configuraciones técnicas de nuestro sistema de
                  pagos con Stripe, no es posible cancelar automáticamente desde la plataforma.
                </p>
                <p className="text-red-700 dark:text-red-300 leading-relaxed">
                  Las cancelaciones se procesarán dentro de las siguientes 24-48 horas hábiles después de recibir tu
                  solicitud. Tu acceso continuará hasta el final del período de facturación actual.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reembolsos</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Los pagos de suscripción son no reembolsables. Sin embargo, evaluaremos solicitudes de reembolso en
                  circunstancias excepcionales caso por caso. Para solicitar un reembolso, debes contactarnos dentro de
                  los primeros 7 días de tu suscripción inicial.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Privacidad</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Tu privacidad es importante para nosotros. Consulta nuestra{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                  >
                    Política de Privacidad
                  </Link>{" "}
                  para entender cómo recopilamos, usamos y protegemos tu información personal.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Limitación de Responsabilidad</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  En ningún caso Registro Nacional de Bicis, ni sus directores, empleados, socios, agentes, proveedores
                  o afiliados, serán responsables por cualquier daño indirecto, incidental, especial, consecuente o
                  punitivo, incluyendo sin limitación, pérdida de ganancias, datos, uso, buena voluntad, u otras
                  pérdidas intangibles, resultantes de (i) tu acceso o uso o incapacidad para acceder o usar el
                  Servicio; (ii) cualquier conducta o contenido de terceros en el Servicio; (iii) cualquier contenido
                  obtenido del Servicio; y (iv) acceso no autorizado, uso o alteración de tus transmisiones o contenido,
                  ya sea basado en garantía, contrato, agravio (incluyendo negligencia) o cualquier otra teoría legal,
                  ya sea que hayamos sido informados o no de la posibilidad de tal daño.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cambios a estos Términos</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en
                  cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días
                  antes de que los nuevos términos entren en vigencia. Lo que constituye un cambio material será
                  determinado a nuestra sola discreción.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 my-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¿Necesitas ayuda?</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Si tienes alguna pregunta sobre estos Términos, necesitas cancelar tu suscripción, o requieres
                  asistencia, estamos aquí para ayudarte.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Contáctanos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
