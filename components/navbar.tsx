"use client"

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
import { User, BikeIcon as Bicycle, LogOut, UserCircle } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Bicycle className="h-6 w-6 text-bike-primary" />
            <span className="hidden font-bold sm:inline-block">Registro Nacional de Bicis</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex-1 md:flex-none">
            <div className="hidden items-center space-x-4 md:flex">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/") ? "text-foreground" : "text-foreground/60"
                }`}
              >
                Inicio
              </Link>
              {user ? (
                <>
                  <Link
                    href="/bicycles"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive("/bicycles") ? "text-foreground" : "text-foreground/60"
                    }`}
                  >
                    Mis Bicicletas
                  </Link>
                  <Link
                    href="/bicycles/register"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive("/bicycles/register") ? "text-foreground" : "text-foreground/60"
                    }`}
                  >
                    Registrar Bicicleta
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserCircle className="h-5 w-5" />
                    <span className="sr-only">Menú de usuario</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex w-full cursor-pointer items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bicycles" className="flex w-full cursor-pointer items-center">
                      <Bicycle className="mr-2 h-4 w-4" />
                      <span>Mis Bicicletas</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
