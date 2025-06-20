"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { BikeIcon as BicycleIcon, User, Menu, LogOut, Home, Info, Phone, FileText, Shield, Search } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Verificar suscripción activa
  useEffect(() => {
    if (user) {
      checkSubscription()
    }
  }, [user])

  const checkSubscription = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single()

      setHasActiveSubscription(!error && !!data)
    } catch (error) {
      setHasActiveSubscription(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navItems = [
    { name: "Inicio", href: "/", icon: <Home className="h-4 w-4 mr-2" /> },
    { name: "Buscar", href: "/search", icon: <Search className="h-4 w-4 mr-2" /> },
    { name: "Acerca de", href: "/about", icon: <Info className="h-4 w-4 mr-2" /> },
    { name: "Contacto", href: "/contact", icon: <Phone className="h-4 w-4 mr-2" /> },
  ]

  const userNavItems = [
    { name: "Mis bicicletas", href: "/bicycles", icon: <BicycleIcon className="h-4 w-4 mr-2" /> },
    { name: "Mi perfil", href: "/profile", icon: <User className="h-4 w-4 mr-2" /> },
    {
      name: "Suscripción",
      href: hasActiveSubscription ? "/subscription/manage" : "/subscription",
      icon: <Shield className="h-4 w-4 mr-2" />,
    },
  ]

  const footerNavItems = [
    { name: "Términos de servicio", href: "/terms", icon: <FileText className="h-4 w-4 mr-2" /> },
    { name: "Política de privacidad", href: "/privacy", icon: <Shield className="h-4 w-4 mr-2" /> },
  ]

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur transition-all ${
        isScrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="flex items-center gap-2 lg:gap-3">
            <BicycleIcon className="h-7 w-7 lg:h-8 lg:w-8 text-blue-600" />
            <div className="flex flex-col">
              <span className="font-bold text-lg lg:text-xl leading-none">RNB</span>
              <span className="text-xs text-muted-foreground hidden sm:block">Registro Nacional</span>
            </div>
          </Link>

          <nav className="hidden md:flex gap-4 lg:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  pathname === item.href ? "text-foreground" : "text-foreground/60"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/bicycles/register" className="hidden lg:block">
                <Button variant="outline" size="sm">
                  <BicycleIcon className="mr-2 h-4 w-4" />
                  Registrar bicicleta
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 md:gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline-block">Mi cuenta</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userNavItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <DropdownMenuItem className="cursor-pointer">
                        {item.icon}
                        <span>{item.name}</span>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/auth/register" className="hidden md:block">
                <Button size="sm">Registrarse</Button>
              </Link>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader className="mb-4">
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 py-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                      pathname === item.href ? "bg-accent" : ""
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                {user ? (
                  <>
                    {userNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                      >
                        {item.icon}
                        {item.name}
                      </Link>
                    ))}
                    <Link
                      href="/bicycles/register"
                      className="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      <BicycleIcon className="mr-2 h-4 w-4" />
                      Registrar bicicleta
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/auth/register"
                      className="flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Registrarse
                    </Link>
                  </>
                )}
                <div className="my-2 h-px bg-border" />
                {footerNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
