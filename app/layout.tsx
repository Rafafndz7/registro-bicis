import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Registro Nacional de Bicicletas México - Sistema Oficial",
  description:
    "Registra tu bicicleta en México. Certificados digitales, código QR único y protección contra robo. Más de 7,000 bicicletas ya registradas.",
  keywords:
    "registro bicicletas méxico, certificado bicicleta oficial, sistema nacional bicicletas, registro bici méxico, código QR bicicleta, verificar bicicleta robada, certificado propiedad bicicleta, base datos bicicletas méxico",
  authors: [{ name: "Registro Nacional de Bicicletas México" }],
  creator: "Registro Nacional de Bicicletas México",
  publisher: "Registro Nacional de Bicicletas México",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://registronacionaldebicis.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Registro Nacional de Bicicletas México - Sistema Oficial",
    description:
      "Registra tu bicicleta en México con nuestro sistema privado. Obtén certificado digital, código QR único, respaldo en línea. Fácil, rápido, seguro y confiable.",
    url: "https://registronacionaldebicis.com",
    siteName: "Registro Nacional de Bicicletas México",
    images: [
      {
        url: "/logo-rnb.png",
        width: 1200,
        height: 630,
        alt: "Registro Nacional de Bicicletas México",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Registro Nacional de Bicicletas México",
    description:
      "Sistema privado de registro de bicicletas en México. Certificados digitales y protección contra el robo.",
    images: ["/logo-rnb.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.png",
        color: "#2563eb",
      },
    ],
  },
  manifest: "/site.webmanifest",
  other: {
    "msapplication-TileColor": "#2563eb",
    "theme-color": "#ffffff",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://registronacionaldebicis.com" />
        <meta name="google-site-verification" content="your-google-verification-code" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
