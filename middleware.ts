import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ["/profile", "/bicycles", "/payment", "/admin"]

  // Rutas solo para administradores
  const adminRoutes = ["/admin"]

  const path = req.nextUrl.pathname

  // Verificar si la ruta actual está protegida
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => path.startsWith(route))

  // Si es una ruta protegida y no hay sesión, redirigir a login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/auth/login", req.url)
    redirectUrl.searchParams.set("redirect", path)
    return NextResponse.redirect(redirectUrl)
  }

  // Si es una ruta de admin, verificar el rol
  if (isAdminRoute && session) {
    // Obtener el rol del usuario
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    // Si no es admin, redirigir a la página principal
    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Si hay sesión y el usuario intenta acceder a páginas de auth, redirigir a profile
  if (session && (path.startsWith("/auth/login") || path.startsWith("/auth/register"))) {
    return NextResponse.redirect(new URL("/profile", req.url))
  }

  return res
}

// Configurar las rutas que deben pasar por el middleware
export const config = {
  matcher: ["/profile/:path*", "/bicycles/:path*", "/payment/:path*", "/admin/:path*", "/auth/login", "/auth/register"],
}
