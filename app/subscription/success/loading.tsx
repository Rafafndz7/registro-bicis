import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

export default function SubscriptionSuccessLoading() {
  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Suscripción al Registro Nacional de Bicicletas</CardTitle>
          <CardDescription>Procesando tu suscripción</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
