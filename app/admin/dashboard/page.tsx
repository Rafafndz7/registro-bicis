"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, BikeIcon as Bicycle, CreditCard, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface DashboardStats {
  totalUsers: number
  totalBicycles: number
  totalSubscriptions: number
  monthlyRevenue: number
  recentRegistrations: number
  theftReports: number
}

interface ChartData {
  month: string
  registrations: number
  revenue: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBicycles: 0,
    totalSubscriptions: 0,
    monthlyRevenue: 0,
    recentRegistrations: 0,
    theftReports: 0,
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const validateAdminAccess = async () => {
      try {
        const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching profile:", error)
          router.push("/auth/login?message=Error al verificar el acceso")
          return
        }

        if (profile?.role !== "admin") {
          router.push("/auth/login?message=Acceso denegado")
          return
        }

        setUserRole(profile?.role)
        fetchDashboardData()
      } catch (error) {
        console.error("Error al validar acceso:", error)
        router.push("/auth/login")
      }
    }

    if (!user) {
      router.push("/auth/login")
      return
    }

    validateAdminAccess()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      // Obtener estadísticas básicas
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })
      const { count: bicycleCount } = await supabase.from("bicycles").select("*", { count: "exact", head: true })
      const { count: subscriptionCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")

      // Registros recientes (últimos 7 días)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { count: recentCount } = await supabase
        .from("bicycles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString())

      // Reportes de robo
      const { count: theftCount } = await supabase
        .from("bicycles")
        .select("*", { count: "exact", head: true })
        .eq("theft_status", "reported_stolen")

      // Calcular ingresos mensuales estimados
      const monthlyRevenue = (subscriptionCount || 0) * 60 // Promedio de $60 MXN por suscripción

      setStats({
        totalUsers: userCount || 0,
        totalBicycles: bicycleCount || 0,
        totalSubscriptions: subscriptionCount || 0,
        monthlyRevenue,
        recentRegistrations: recentCount || 0,
        theftReports: theftCount || 0,
      })

      // Datos para gráficos (simulados por ahora)
      const mockChartData = [
        { month: "Ene", registrations: 45, revenue: 2700 },
        { month: "Feb", registrations: 52, revenue: 3120 },
        { month: "Mar", registrations: 48, revenue: 2880 },
        { month: "Abr", registrations: 61, revenue: 3660 },
        { month: "May", registrations: 55, revenue: 3300 },
        { month: "Jun", registrations: 67, revenue: 4020 },
      ]
      setChartData(mockChartData)
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || userRole !== "admin") {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Administrativo</CardTitle>
            <CardDescription>Cargando datos...</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pieData = [
    { name: "Activas", value: stats.totalSubscriptions, color: "#3b82f6" },
    { name: "Inactivas", value: stats.totalUsers - stats.totalSubscriptions, color: "#e5e7eb" },
  ]

  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Sistema en línea
        </Badge>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+{stats.recentRegistrations} en los últimos 7 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bicicletas Registradas</CardTitle>
            <Bicycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBicycles}</div>
            <p className="text-xs text-muted-foreground">{stats.theftReports} reportadas como robadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
            <p className="text-xs text-muted-foreground">${stats.monthlyRevenue.toLocaleString()} MXN/mes estimado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">MXN estimado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reportes de Robo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.theftReports}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.theftReports / stats.totalBicycles) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.totalSubscriptions / stats.totalUsers) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Usuarios con suscripción</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="registrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registrations">Registros por Mes</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
          <TabsTrigger value="subscriptions">Distribución Suscripciones</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registros de Bicicletas por Mes</CardTitle>
              <CardDescription>Tendencia de registros en los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="registrations" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por Mes</CardTitle>
              <CardDescription>Ingresos estimados en MXN</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value} MXN`, "Ingresos"]} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Suscripciones</CardTitle>
              <CardDescription>Usuarios con y sin suscripción activa</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
