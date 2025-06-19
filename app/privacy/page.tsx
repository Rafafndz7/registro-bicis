import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
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
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-12 text-white text-center">
            <h1 className="text-4xl font-bold mb-4">Política de Privacidad</h1>
            <p className="text-green-100 text-lg">Última actualización: 19 de junio de 2025</p>
          </div>

          <div className="px-8 py-12 space-y-8">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                En Registro Nacional de Bicis, accesible desde registronacionaldebicis.com, una de nuestras principales
                prioridades es la privacidad de nuestros visitantes. Este documento de Política de Privacidad contiene
                los tipos de información que se recopilan y registran por Registro Nacional de Bicis y cómo la
                utilizamos.
              </p>

              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                Si tienes preguntas adicionales o requieres más información sobre nuestra Política de Privacidad, no
                dudes en contactarnos.
              </p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Información que recopilamos</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Cuando te registras en nuestro sitio, se te solicita proporcionar cierta información personal,
                  incluyendo:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center space-x-3">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">Nombre completo</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">Dirección de correo electrónico</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">Número de teléfono</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">Fecha de nacimiento</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">CURP (opcional)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">Dirección (opcional)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">Información de bicicletas</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">Imágenes de bicicletas</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600 dark:text-gray-300">Información de suscripción</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Cómo utilizamos tu información
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Utilizamos la información que recopilamos de varias formas, incluyendo:
                </p>
                <div className="space-y-3">
                  {[
                    "Proporcionar, operar y mantener nuestro sitio web",
                    "Mejorar, personalizar y expandir nuestro sitio web",
                    "Entender y analizar cómo utilizas nuestro sitio web",
                    "Desarrollar nuevos productos, servicios, características y funcionalidades",
                    "Facilitar la recuperación de bicicletas robadas",
                    "Verificar la propiedad de bicicletas registradas",
                    "Procesar transacciones de pago y gestionar suscripciones",
                    "Generar certificados oficiales y códigos QR de verificación",
                    "Comunicarnos contigo, ya sea directamente o a través de uno de nuestros socios",
                    "Enviarte correos electrónicos relacionados con el servicio y notificaciones de suscripción",
                    "Encontrar y prevenir fraudes",
                    "Proporcionar soporte técnico y atención al cliente",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-600 dark:text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 my-8 border-l-4 border-blue-500">
                <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-400 mb-4">
                  Información de Suscripciones y Pagos
                </h2>
                <p className="text-blue-700 dark:text-blue-300 leading-relaxed mb-4">
                  Para procesar los pagos de suscripción, trabajamos con Stripe, un procesador de pagos de terceros.
                  Stripe puede recopilar y procesar información de pago de acuerdo con su propia política de privacidad.
                  No almacenamos información completa de tarjetas de crédito en nuestros servidores.
                </p>
                <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                  La información de suscripción, incluyendo el plan seleccionado, fechas de facturación y estado de
                  pago, se almacena de forma segura para gestionar tu cuenta y proporcionar el servicio contratado.
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 my-8 border-l-4 border-green-500">
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-4">
                  📱 Acceso a Certificados y Códigos QR
                </h2>
                <p className="text-green-700 dark:text-green-300 leading-relaxed font-medium">
                  <strong>💡 Recordatorio importante:</strong> Una vez que registres tu bicicleta, asegúrate de
                  descargar tu certificado oficial y código QR en tu dispositivo móvil. Esto te permitirá tener acceso
                  inmediato a la documentación de tu bicicleta en cualquier momento, incluso sin conexión a internet.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cookies</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Registro Nacional de Bicis utiliza cookies para mejorar la experiencia del usuario. Las cookies son
                  archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Utilizamos cookies
                  para recordar tus preferencias, mantener tu sesión activa, entender cómo interactúas con nuestro sitio
                  y mejorar tu experiencia.
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 my-8 border-l-4 border-yellow-500">
                <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-400 mb-4">Compartir Información</h2>
                <p className="text-yellow-700 dark:text-yellow-300 leading-relaxed mb-4">
                  No vendemos, intercambiamos o transferimos tu información personal a terceros sin tu consentimiento,
                  excepto en los siguientes casos:
                </p>
                <div className="space-y-3">
                  {[
                    "Con procesadores de pago (Stripe) para procesar transacciones",
                    "Con autoridades competentes cuando sea requerido por ley",
                    "Para facilitar la recuperación de bicicletas robadas reportadas",
                    "Con proveedores de servicios que nos ayudan a operar nuestro sitio web",
                  ].map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-yellow-700 dark:text-yellow-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Seguridad</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  La seguridad de tu información personal es importante para nosotros. Implementamos medidas de
                  seguridad técnicas, administrativas y físicas para proteger tu información personal contra acceso no
                  autorizado, alteración, divulgación o destrucción. Sin embargo, ningún método de transmisión por
                  Internet o método de almacenamiento electrónico es 100% seguro.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Retención de Datos</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Conservamos tu información personal durante el tiempo que mantengas una cuenta activa con nosotros o
                  según sea necesario para proporcionarte servicios. También podemos conservar y usar tu información
                  según sea necesario para cumplir con nuestras obligaciones legales, resolver disputas y hacer cumplir
                  nuestros acuerdos.
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 my-8 border-l-4 border-purple-500">
                <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-400 mb-4">Tus Derechos</h2>
                <p className="text-purple-700 dark:text-purple-300 leading-relaxed">
                  Tienes derecho a acceder, actualizar, corregir o eliminar tu información personal. También puedes
                  solicitar la portabilidad de tus datos o restringir el procesamiento de tu información. Para ejercer
                  estos derechos, contáctanos a través de nuestro formulario de contacto.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 my-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Cambios a esta política de privacidad
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Podemos actualizar nuestra Política de Privacidad de vez en cuando. Te notificaremos cualquier cambio
                  publicando la nueva Política de Privacidad en esta página y actualizando la fecha de "última
                  actualización" en la parte superior. También te enviaremos una notificación por correo electrónico si
                  los cambios son significativos.
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 my-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¿Tienes preguntas?</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Si tienes alguna pregunta sobre esta Política de Privacidad, necesitas ejercer tus derechos de
                  privacidad, o requieres asistencia con tu cuenta, estamos aquí para ayudarte.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
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
