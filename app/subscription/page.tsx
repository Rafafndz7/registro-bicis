"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Star, Users, Crown, AlertCircle, Tag, Percent } from "lucide-react"

const plans = [
  {
    id: "basic",
    name: "Básico",
    price: 40,
    bicycles: 1,
    description: "Perfecto para ciclistas individuales",
    features: [
      "1 bicicleta registrada",
      "Certificado oficial PDF",
      "Código QR de verificación",
      "Sistema de reportes de robo",
      "Soporte por email",
    ],
    popular: false,
    family: false,
  },
  {
    id: "standard",
    name: "Estándar",
    price: 60,
    bicycles: 2,
    description: "Ideal para parejas o ciclistas con múltiples bicis",
    features: [
      "2 bicicletas registradas",
      "Certificados oficiales PDF",
      "Códigos QR de verificación",
      "Sistema de reportes de robo",
      "Soporte prioritario",
    ],
    popular: true,
    family: false,
  },
  {
    id: "family",
    name: "Familiar",
    price: 120,
    bicycles: 4,
    description: "Perfecto para familias pequeñas",
    features: [
      "4 bicicletas registradas",
      "Certificados oficiales PDF",
      "Códigos QR de verificación",
      "Sistema de reportes de robo",
      "Soporte prioritario",
      "Gestión familiar",
    ],
    popular: false,
    family: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 180,
    bicycles: 6,
    description: "Para familias grandes o grupos de ciclistas",
    features: [
      "6 bicicletas registradas",
      "Certificados oficiales PDF",
      "Códigos QR de verificación",
      "Sistema de reportes de robo",
      "Soporte prioritario 24/7",
      "Gestión familiar avanzada",
      "Reportes estadísticos",
    ],
    popular: false,
    family: true,
  },
]

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState("")
  const [promoDiscount, setPromoDiscount] = useState<any>(null)
  const [promoError, setPromoError] = useState("")

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/auth/login?redirectTo=/subscription")
      return
    }

    fetchCurrentSubscription()
  }, [user, authLoading, router])

  const fetchCurrentSubscription = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      if (!error && data) {
        setCurrentSubscription(data)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const validatePromoCode = async (code: string, planId: string) => {
    if (!code.trim()) {
      setPromoDiscount(null)
      setPromoError("")
      return
    }

    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), planId }),
      })

      const result = await response.json()

      if (response.ok) {
        setPromoDiscount(result)
        setPromoError("")
      } else {
        setPromoDiscount(null)
        setPromoError(result.error)
      }
    } catch (error) {
      setPromoDiscount(null)
      setPromoError("Error al validar código")
    }
  }

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!promoDiscount) return originalPrice

    if (promoDiscount.discount_type === "percentage") {
      return originalPrice - (originalPrice * promoDiscount.discount_value) / 100
    } else {
      return Math.max(originalPrice - promoDiscount.discount_value, 0)
    }
  }

  const createSubscription = async (planId: string) => {
    if (!user) return

    setIsCreatingSubscription(true)
    setSelectedPlan(planId)

    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: planId,
          promoCode: promoCode.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al crear suscripción")
      }

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error("Error creating subscription:", error)
      alert("Error al crear suscripción: " + (error instanceof Error ? error.message : "Error desconocido"))
    } finally {
      setIsCreatingSubscription(false)
      setSelectedPlan(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-6xl py-10">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Planes de Suscripción</h1>
        <p className="text-xl text-muted-foreground">
          Elige el plan que mejor se adapte a tus necesidades de registro de bicicletas
        </p>
      </div>

      {currentSubscription && (
        <Alert className="mb-8">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Suscripción Activa</AlertTitle>
          <AlertDescription>
            Tienes una suscripción {currentSubscription.plan_type} activa que permite registrar hasta{" "}
            {currentSubscription.bicycle_limit} bicicleta{currentSubscription.bicycle_limit > 1 ? "s" : ""}.
          </AlertDescription>
        </Alert>
      )}

      {/* Sección de código promocional */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Código Promocional
          </CardTitle>
          <CardDescription>¿Tienes un código promocional? Ingrésalo aquí para obtener descuentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 max-w-md">
            <Input
              placeholder="Ingresa tu código promocional"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase())
                if (e.target.value.trim()) {
                  validatePromoCode(e.target.value, "basic") // Validar con plan básico por defecto
                } else {
                  setPromoDiscount(null)
                  setPromoError("")
                }
              }}
            />
          </div>
          {promoDiscount && (
            <Alert className="mt-4 bg-green-50">
              <Percent className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">¡Código válido!</AlertTitle>
              <AlertDescription className="text-green-600">
                Descuento de{" "}
                {promoDiscount.discount_type === "percentage"
                  ? `${promoDiscount.discount_value}%`
                  : `$${promoDiscount.discount_value} MXN`}{" "}
                aplicado
              </AlertDescription>
            </Alert>
          )}
          {promoError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Código no válido</AlertTitle>
              <AlertDescription>{promoError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const originalPrice = plan.price
          const discountedPrice = calculateDiscountedPrice(originalPrice)
          const hasDiscount = promoDiscount && discountedPrice < originalPrice

          return (
            <Card key={plan.id} className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  <Star className="w-3 h-3 mr-1" />
                  Más Popular
                </Badge>
              )}
              {plan.family && !plan.popular && (
                <Badge variant="secondary" className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Users className="w-3 h-3 mr-1" />
                  Familiar
                </Badge>
              )}

              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.id === "premium" && <Crown className="w-5 h-5 text-yellow-500" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  {hasDiscount ? (
                    <div className="space-y-1">
                      <div className="text-2xl font-bold line-through text-muted-foreground">${originalPrice} MXN</div>
                      <div className="text-4xl font-bold text-green-600">${Math.round(discountedPrice)} MXN</div>
                      <div className="text-sm text-green-600">
                        ¡Ahorras ${Math.round(originalPrice - discountedPrice)} MXN!
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold">${originalPrice}</span>
                      <span className="text-muted-foreground"> MXN/mes</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Hasta {plan.bicycles} bicicleta{plan.bicycles > 1 ? "s" : ""}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => createSubscription(plan.id)}
                  disabled={
                    isCreatingSubscription ||
                    currentSubscription?.plan_type === plan.name.toLowerCase() ||
                    selectedPlan === plan.id
                  }
                >
                  {currentSubscription?.plan_type === plan.name.toLowerCase()
                    ? "Plan Actual"
                    : selectedPlan === plan.id
                      ? "Procesando..."
                      : `Seleccionar ${plan.name}`}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center">
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Información Importante</AlertTitle>
          <AlertDescription>
            • Todos los planes incluyen certificados oficiales y códigos QR
            <br />• Los planes familiares permiten gestionar múltiples bicicletas
            <br />• Puedes cambiar de plan en cualquier momento
            <br />• Los códigos promocionales se aplican solo al primer mes
            <br />• Soporte técnico incluido en todos los planes
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
