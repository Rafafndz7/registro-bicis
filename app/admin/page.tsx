"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Users, BikeIcon as Bicycle, CreditCard } from "lucide-react"

interface User {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

interface BicycleRegistration {
  id: string
  serial_number: string
  brand: string
  model: string
  payment_status: boolean
  registration_date: string
  profiles: {
    full_name: string
    email: string
  }
}

interface PaymentRecord {
  id: string
  amount: number
  payment_status: string
  payment_date: string | null
  created_at: string
  profiles: {
    full_name: string
  }
  bicycles: {
    serial_number: string
    brand: string
    model: string
  }
}

interface DashboardStats {
  totalUsers: number
  totalBicycles: number
  totalPayments: number
  pendingPayments: number
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBicycles: 0,
    totalPayments: 0,
    pendingPayments: 0,
  })
  const [users, setUsers] = useState<User[]>([])
  const [bicycles, setBicycles] = useState<BicycleRegistration[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const checkAdminRole = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (error) throw error

        if (data.role !== "admin") {
          router.push("/")
          return
        }

        setUserRole(data.role)
        fetchDashboardData()
      } catch (error) {
        console.error("Error al verificar rol de administrador:", error)
        router.push("/")
      }
    }

    checkAdminRole()
  }, [user, router, supabase])

  const fetchDashboardData = async () => {
    try {
      // Obtener estadísticas
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

      const { count: bicycleCount } = await supabase.from("bicycles").select("*", { count: "exact", head: true })

      const { count: paymentCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "completed")

      const { count: pendingCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "pending")

      setStats({
        totalUsers: userCount || 0,
        totalBicycles: bicycleCount || 0,
        totalPayments: paymentCount || 0,
        pendingPayments: pendingCount || 0,
      })

      // Obtener usuarios
      const { data: userData } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(10)

      setUsers(userData || [])

      // Obtener bicicletas
      const { data: bicycleData } = await supabase
        .from("bicycles")
        .select("id, serial_number, brand, model, payment_status, registration_date, profiles(full_name, email)")
        .order("registration_date", { ascending: false })
        .limit(10)

      setBicycles(bicycleData || [])

      // Obtener pagos
      const { data: paymentData } = await supabase
        .from("payments")
        .select(
          "id, amount, payment_status, payment_date, created_at, profiles(full_name), bicycles(serial_number, brand, model)",
        )
        .order("created_at", { ascending: false })
        .limit(10)

      setPayments(paymentData || [])
    } catch (error) {
      console.error("Error al cargar datos del panel:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm) {
      fetchDashboardData()
      return
    }

    try {
      setLoading(true)

      // Buscar usuarios
      const { data: userData } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,curp.ilike.%${searchTerm}%`)
        .limit(10)

      setUsers(userData || [])

      // Buscar bicicletas
      const { data: bicycleData } = await supabase
        .from("bicycles")
        .select("id, serial_number, brand, model, payment_status, registration_date, profiles(full_name, email)")
        .or(`serial_number.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`)
        .limit(10)

      setBicycles(bicycleData || [])
    } catch (error) {
      console.error("Error al buscar:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || userRole !== "admin") {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Panel de Administración</CardTitle>
            <CardDescription>Cargando datos...</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-3xl font-bold">Panel de Administración</h1>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bicicletas Registradas</CardTitle>
            <Bicycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBicycles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Completados</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center space-x-2">
        <Input
          placeholder="Buscar por nombre, email, CURP o número de serie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={handleSearch} variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="bicycles">Bicicletas</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios Registrados</CardTitle>
              <CardDescription>Lista de usuarios registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de registro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "outline"}>
                            {user.role === "admin" ? "Administrador" : "Usuario"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bicycles">
          <Card>
            <CardHeader>
              <CardTitle>Bicicletas Registradas</CardTitle>
              <CardDescription>Lista de bicicletas registradas en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número de serie</TableHead>
                    <TableHead>Marca / Modelo</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de registro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bicycles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No se encontraron bicicletas
                      </TableCell>
                    </TableRow>
                  ) : (
                    bicycles.map((bicycle) => (
                      <TableRow key={bicycle.id}>
                        <TableCell className="font-medium">{bicycle.serial_number}</TableCell>
                        <TableCell>
                          {bicycle.brand} {bicycle.model}
                        </TableCell>
                        <TableCell>{bicycle.profiles.full_name}</TableCell>
                        <TableCell>
                          <Badge variant={bicycle.payment_status ? "default" : "outline"}>
                            {bicycle.payment_status ? "Registrada" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(bicycle.registration_date)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Lista de pagos realizados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID de Pago</TableHead>
                    <TableHead>Bicicleta</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No se encontraron pagos
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          {payment.bicycles.brand} {payment.bicycles.model}
                        </TableCell>
                        <TableCell>{payment.profiles.full_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.payment_status === "completed"
                                ? "default"
                                : payment.payment_status === "pending"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {payment.payment_status === "completed"
                              ? "Completado"
                              : payment.payment_status === "pending"
                                ? "Pendiente"
                                : "Fallido"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.payment_date ? formatDate(payment.payment_date) : formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
