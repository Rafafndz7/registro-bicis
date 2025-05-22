"use client"

import { useEffect, useRef } from "react"

export function BicycleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Establecer dimensiones del canvas
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // Colores modernos
    const frameColors = ["#1e88e5", "#43a047", "#ff9800", "#e53935", "#5e35b1", "#00acc1", "#ec407a"]
    const wheelColors = ["#212121", "#424242", "#616161"]
    const accentColors = ["#ffc107", "#00bcd4", "#7cb342", "#f44336"]

    // Clase para las bicicletas modernas
    class ModernBicycle {
      x: number
      y: number
      speed: number
      size: number
      wheelRadius: number
      frameColor: string
      wheelColor: string
      accentColor: string
      wheelRotation: number
      direction: number
      type: number // 0: mountain bike, 1: road bike, 2: hybrid
      hasLights: boolean
      hasFenders: boolean

      constructor(canvasWidth: number, canvasHeight: number) {
        this.size = Math.random() * 30 + 40 // Bicicletas más grandes
        this.wheelRadius = this.size / 3.2
        this.x = Math.random() * canvasWidth
        this.y = canvasHeight - this.size / 1.5 - this.wheelRadius - Math.random() * 30
        this.speed = (Math.random() + 0.8) * 2
        this.frameColor = frameColors[Math.floor(Math.random() * frameColors.length)]
        this.wheelColor = wheelColors[Math.floor(Math.random() * wheelColors.length)]
        this.accentColor = accentColors[Math.floor(Math.random() * accentColors.length)]
        this.wheelRotation = 0
        this.direction = Math.random() > 0.5 ? 1 : -1
        this.type = Math.floor(Math.random() * 3)
        this.hasLights = Math.random() > 0.5
        this.hasFenders = Math.random() > 0.7
      }

      draw(ctx: CanvasRenderingContext2D) {
        const x = this.x
        const y = this.y
        const size = this.size
        const wheelRadius = this.wheelRadius

        // Guardar el estado actual
        ctx.save()

        // Aplicar escala según la dirección
        ctx.translate(x, y)
        ctx.scale(this.direction, 1)

        // Dibujar ruedas con rines modernos
        this.drawWheel(ctx, 0, 0, wheelRadius)
        this.drawWheel(ctx, size, 0, wheelRadius)

        // Marco de la bicicleta según el tipo
        ctx.lineWidth = 3
        ctx.strokeStyle = this.frameColor
        ctx.lineJoin = "round"

        if (this.type === 0) {
          // Mountain bike - marco más robusto
          this.drawMountainBikeFrame(ctx, size, wheelRadius)
        } else if (this.type === 1) {
          // Road bike - marco más ligero y aerodinámico
          this.drawRoadBikeFrame(ctx, size, wheelRadius)
        } else {
          // Hybrid bike
          this.drawHybridBikeFrame(ctx, size, wheelRadius)
        }

        // Luces (opcional)
        if (this.hasLights) {
          // Luz delantera
          ctx.beginPath()
          ctx.arc(size + wheelRadius * 0.8, -size * 0.4, wheelRadius * 0.15, 0, Math.PI * 2)
          ctx.fillStyle = "#ffeb3b"
          ctx.fill()
          ctx.strokeStyle = "#ffd600"
          ctx.stroke()

          // Luz trasera
          ctx.beginPath()
          ctx.arc(-wheelRadius * 0.3, -size * 0.3, wheelRadius * 0.1, 0, Math.PI * 2)
          ctx.fillStyle = "#f44336"
          ctx.fill()
          ctx.strokeStyle = "#d32f2f"
          ctx.stroke()
        }

        // Restaurar el estado
        ctx.restore()
      }

      drawWheel(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
        // Neumático
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = "#333"
        ctx.lineWidth = radius / 5
        ctx.stroke()

        // Rin
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2)
        ctx.strokeStyle = this.wheelColor
        ctx.lineWidth = 2
        ctx.stroke()

        // Centro del rin
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2)
        ctx.fillStyle = this.accentColor
        ctx.fill()
        ctx.strokeStyle = "#333"
        ctx.lineWidth = 1
        ctx.stroke()

        // Radios modernos
        ctx.strokeStyle = "#777"
        ctx.lineWidth = 1.5

        for (let i = 0; i < 8; i++) {
          const angle = this.wheelRotation + (i * Math.PI) / 4
          ctx.beginPath()
          ctx.moveTo(centerX + radius * 0.15 * Math.cos(angle), centerY + radius * 0.15 * Math.sin(angle))
          ctx.lineTo(centerX + radius * 0.8 * Math.cos(angle), centerY + radius * 0.8 * Math.sin(angle))
          ctx.stroke()
        }

        // Guardabarros (opcional)
        if (this.hasFenders) {
          ctx.beginPath()
          ctx.arc(centerX, centerY, radius * 1.1, Math.PI * 0.8, Math.PI * 2.2)
          ctx.strokeStyle = this.frameColor
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }

      drawMountainBikeFrame(ctx: CanvasRenderingContext2D, size: number, wheelRadius: number) {
        const frameHeight = size * 0.6

        // Tubo inferior
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(size * 0.7, -frameHeight * 0.3)
        ctx.stroke()

        // Tubo superior
        ctx.beginPath()
        ctx.moveTo(size * 0.15, -frameHeight * 0.8)
        ctx.lineTo(size * 0.7, -frameHeight * 0.3)
        ctx.stroke()

        // Tubo del asiento
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(size * 0.15, -frameHeight * 0.8)
        ctx.stroke()

        // Tubo de dirección
        ctx.beginPath()
        ctx.moveTo(size * 0.7, -frameHeight * 0.3)
        ctx.lineTo(size, 0)
        ctx.stroke()

        // Vaina
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(size * 0.4, -size * 0.05)
        ctx.stroke()

        // Tirante
        ctx.beginPath()
        ctx.moveTo(size * 0.15, -frameHeight * 0.8)
        ctx.lineTo(size * 0.4, -size * 0.05)
        ctx.stroke()

        // Horquilla
        ctx.beginPath()
        ctx.moveTo(size, 0)
        ctx.lineTo(size * 0.7, -frameHeight * 0.3)
        ctx.stroke()

        // Manillar
        ctx.beginPath()
        ctx.moveTo(size * 0.7, -frameHeight * 0.3)
        ctx.lineTo(size * 0.7 + wheelRadius * 0.6, -frameHeight * 0.5)
        ctx.stroke()

        // Asiento
        ctx.beginPath()
        ctx.ellipse(size * 0.15, -frameHeight * 0.85, wheelRadius * 0.4, wheelRadius * 0.2, 0, 0, Math.PI * 2)
        ctx.fillStyle = "#333"
        ctx.fill()

        // Pedales y biela
        this.drawPedals(ctx, size * 0.4, -size * 0.05, wheelRadius)
      }

      drawRoadBikeFrame(ctx: CanvasRenderingContext2D, size: number, wheelRadius: number) {
        const frameHeight = size * 0.65

        // Tubo inferior (más inclinado)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(size * 0.75, -frameHeight * 0.25)
        ctx.stroke()

        // Tubo superior (más horizontal)
        ctx.beginPath()
        ctx.moveTo(size * 0.1, -frameHeight * 0.85)
        ctx.lineTo(size * 0.75, -frameHeight * 0.6)
        ctx.stroke()

        // Tubo del asiento
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(size * 0.1, -frameHeight * 0.85)
        ctx.stroke()

        // Tubo de dirección
        ctx.beginPath()
        ctx.moveTo(size * 0.75, -frameHeight * 0.25)
        ctx.lineTo(size * 0.75, -frameHeight * 0.6)
        ctx.stroke()

        // Horquilla
        ctx.beginPath()
        ctx.moveTo(size * 0.75, -frameHeight * 0.25)
        ctx.lineTo(size, 0)
        ctx.stroke()

        // Manillar de carretera (drop bars)
        ctx.beginPath()
        ctx.moveTo(size * 0.75, -frameHeight * 0.6)
        ctx.lineTo(size * 0.75 + wheelRadius * 0.4, -frameHeight * 0.7)
        ctx.lineTo(size * 0.75 + wheelRadius * 0.6, -frameHeight * 0.5)
        ctx.stroke()

        // Asiento delgado
        ctx.beginPath()
        ctx.ellipse(size * 0.1, -frameHeight * 0.9, wheelRadius * 0.35, wheelRadius * 0.15, 0, 0, Math.PI * 2)
        ctx.fillStyle = this.accentColor
        ctx.fill()
        ctx.strokeStyle = "#333"
        ctx.lineWidth = 1
        ctx.stroke()

        // Pedales y biela
        this.drawPedals(ctx, size * 0.4, -size * 0.05, wheelRadius)
      }

      drawHybridBikeFrame(ctx: CanvasRenderingContext2D, size: number, wheelRadius: number) {
        const frameHeight = size * 0.55

        // Tubo inferior
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(size * 0.7, -frameHeight * 0.3)
        ctx.stroke()

        // Tubo superior (ligeramente inclinado)
        ctx.beginPath()
        ctx.moveTo(size * 0.15, -frameHeight * 0.75)
        ctx.lineTo(size * 0.7, -frameHeight * 0.45)
        ctx.stroke()

        // Tubo del asiento
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(size * 0.15, -frameHeight * 0.75)
        ctx.stroke()

        // Tubo de dirección
        ctx.beginPath()
        ctx.moveTo(size * 0.7, -frameHeight * 0.3)
        ctx.lineTo(size * 0.7, -frameHeight * 0.45)
        ctx.stroke()

        // Horquilla
        ctx.beginPath()
        ctx.moveTo(size * 0.7, -frameHeight * 0.3)
        ctx.lineTo(size, 0)
        ctx.stroke()

        // Manillar plano
        ctx.beginPath()
        ctx.moveTo(size * 0.7 - wheelRadius * 0.4, -frameHeight * 0.5)
        ctx.lineTo(size * 0.7 + wheelRadius * 0.4, -frameHeight * 0.5)
        ctx.stroke()

        // Asiento cómodo
        ctx.beginPath()
        ctx.ellipse(size * 0.15, -frameHeight * 0.8, wheelRadius * 0.4, wheelRadius * 0.25, 0, 0, Math.PI * 2)
        ctx.fillStyle = "#333"
        ctx.fill()

        // Pedales y biela
        this.drawPedals(ctx, size * 0.4, -size * 0.05, wheelRadius)
      }

      drawPedals(ctx: CanvasRenderingContext2D, x: number, y: number, wheelRadius: number) {
        // Centro de los pedales
        ctx.beginPath()
        ctx.arc(x, y, wheelRadius * 0.2, 0, Math.PI * 2)
        ctx.fillStyle = this.accentColor
        ctx.fill()
        ctx.strokeStyle = "#333"
        ctx.lineWidth = 1
        ctx.stroke()

        // Bielas
        const pedalAngle = this.wheelRotation * 2

        // Biela 1
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + Math.cos(pedalAngle) * wheelRadius * 0.7, y + Math.sin(pedalAngle) * wheelRadius * 0.7)
        ctx.strokeStyle = "#555"
        ctx.lineWidth = 2
        ctx.stroke()

        // Pedal 1
        ctx.beginPath()
        ctx.rect(
          x + Math.cos(pedalAngle) * wheelRadius * 0.7 - wheelRadius * 0.15,
          y + Math.sin(pedalAngle) * wheelRadius * 0.7 - wheelRadius * 0.05,
          wheelRadius * 0.3,
          wheelRadius * 0.1,
        )
        ctx.fillStyle = "#333"
        ctx.fill()

        // Biela 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(
          x + Math.cos(pedalAngle + Math.PI) * wheelRadius * 0.7,
          y + Math.sin(pedalAngle + Math.PI) * wheelRadius * 0.7,
        )
        ctx.strokeStyle = "#555"
        ctx.lineWidth = 2
        ctx.stroke()

        // Pedal 2
        ctx.beginPath()
        ctx.rect(
          x + Math.cos(pedalAngle + Math.PI) * wheelRadius * 0.7 - wheelRadius * 0.15,
          y + Math.sin(pedalAngle + Math.PI) * wheelRadius * 0.7 - wheelRadius * 0.05,
          wheelRadius * 0.3,
          wheelRadius * 0.1,
        )
        ctx.fillStyle = "#333"
        ctx.fill()
      }

      update(canvasWidth: number) {
        this.x += this.speed * this.direction
        this.wheelRotation += this.speed * 0.1

        // Si la bicicleta sale del canvas, reiniciarla en el lado opuesto
        if (this.direction > 0 && this.x - this.wheelRadius > canvasWidth) {
          this.x = -this.size - this.wheelRadius
        } else if (this.direction < 0 && this.x + this.size + this.wheelRadius < 0) {
          this.x = canvasWidth + this.size + this.wheelRadius
        }
      }
    }

    // Crear bicicletas modernas
    const bicycles: ModernBicycle[] = []
    const bicycleCount = 5

    for (let i = 0; i < bicycleCount; i++) {
      bicycles.push(new ModernBicycle(canvas.width, canvas.height))
    }

    // Función de animación
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Dibujar una línea para el suelo
      ctx.beginPath()
      ctx.moveTo(0, canvas.height - 5)
      ctx.lineTo(canvas.width, canvas.height - 5)
      ctx.strokeStyle = "#ddd"
      ctx.lineWidth = 2
      ctx.stroke()

      // Actualizar y dibujar cada bicicleta
      bicycles.forEach((bicycle) => {
        bicycle.update(canvas.width)
        bicycle.draw(ctx)
      })

      requestAnimationFrame(animate)
    }

    // Iniciar animación
    animate()

    // Manejar redimensionamiento
    const handleResize = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight

      // Reposicionar bicicletas
      bicycles.forEach((bicycle) => {
        bicycle.y = canvas.height - bicycle.size / 1.5 - bicycle.wheelRadius - Math.random() * 30
      })
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="h-[300px] w-full rounded-lg md:h-[400px]" />
}
