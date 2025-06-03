import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Rutas que requieren autenticación
  const protectedRoutes = ["/profile", "/bicycles"]

  // Rutas de autenticación
  const authRoutes = ["/auth/login", "/auth/register"]

  const { pathname } = req.nextUrl

  try {
    // Verificar sesión del usuario
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    console.log("Middleware - Ruta:", pathname, "Sesión:", !!session, "Error:", error)

    // Si está en una ruta protegida y no tiene sesión, redirigir a login
    if (protectedRoutes.some((route) => pathname.startsWith(route)) && !session) {
      console.log("Redirigiendo a login desde ruta protegida:", pathname)
      const redirectUrl = new URL("/auth/login", req.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Si está en una ruta de auth y ya tiene sesión, redirigir al perfil
    if (authRoutes.some((route) => pathname.startsWith(route)) && session) {
      console.log("Redirigiendo a perfil desde ruta de auth:", pathname)
      return NextResponse.redirect(new URL("/profile", req.url))
    }

    return res
  } catch (error) {
    console.error("Error en middleware:", error)
    return res
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
