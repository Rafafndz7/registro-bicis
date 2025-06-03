"use client"

import { useEffect, useRef } from "react"

export function BicycleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar el tamaño del canvas
    const setCanvasSize = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    setCanvasSize()
    window.addEventListener("resize", setCanvasSize)

    // Configuración de la animación
    const bicycles: Bicycle[] = []
    const numBicycles = 5
    const colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"]

    // Clase para representar una bicicleta
    class Bicycle {
      x: number
      y: number
      speed: number
      size: number
      color: string
      wheelRotation: number
      rotationSpeed: number

      constructor(canvas: HTMLCanvasElement) {
        this.size = Math.random() * 20 + 30
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.speed = Math.random() * 1 + 0.5
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.wheelRotation = 0
        this.rotationSpeed = this.speed * 0.1
      }

      update(canvas: HTMLCanvasElement) {
        this.x += this.speed
        this.wheelRotation += this.rotationSpeed

        if (this.x > canvas.width + this.size) {
          this.x = -this.size
          this.y = Math.random() * canvas.height
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.translate(this.x, this.y)

        // Dibujar el marco de la bicicleta
        ctx.beginPath()
        ctx.strokeStyle = this.color
        ctx.lineWidth = 2
        ctx.moveTo(0, 0) // Centro de la rueda trasera
        ctx.lineTo(this.size * 0.7, -this.size * 0.5) // Parte superior del marco
        ctx.lineTo(this.size * 1.5, 0) // Centro de la rueda delantera
        ctx.moveTo(this.size * 0.7, -this.size * 0.5) // Parte superior del marco
        ctx.lineTo(this.size * 0.4, 0) // Parte inferior del marco
        ctx.stroke()

        // Dibujar las ruedas
        ctx.beginPath()
        ctx.strokeStyle = "#000"
        ctx.lineWidth = 1.5

        // Rueda trasera
        ctx.save()
        ctx.translate(0, 0)
        ctx.rotate(this.wheelRotation)
        ctx.beginPath()
        ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2)
        ctx.stroke()

        // Radios de la rueda trasera
        for (let i = 0; i < 8; i++) {
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos((Math.PI * i) / 4) * this.size * 0.4, Math.sin((Math.PI * i) / 4) * this.size * 0.4)
          ctx.stroke()
        }
        ctx.restore()

        // Rueda delantera
        ctx.save()
        ctx.translate(this.size * 1.5, 0)
        ctx.rotate(this.wheelRotation)
        ctx.beginPath()
        ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2)
        ctx.stroke()

        // Radios de la rueda delantera
        for (let i = 0; i < 8; i++) {
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos((Math.PI * i) / 4) * this.size * 0.4, Math.sin((Math.PI * i) / 4) * this.size * 0.4)
          ctx.stroke()
        }
        ctx.restore()

        // Dibujar el manillar
        ctx.beginPath()
        ctx.strokeStyle = this.color
        ctx.lineWidth = 2
        ctx.moveTo(this.size * 1.5, 0) // Centro de la rueda delantera
        ctx.lineTo(this.size * 1.5, -this.size * 0.3) // Manillar
        ctx.lineTo(this.size * 1.7, -this.size * 0.4) // Manillar extendido
        ctx.stroke()

        // Dibujar el asiento
        ctx.beginPath()
        ctx.strokeStyle = this.color
        ctx.lineWidth = 2
        ctx.moveTo(this.size * 0.4, 0) // Parte inferior del marco
        ctx.lineTo(this.size * 0.4, -this.size * 0.3) // Poste del asiento
        ctx.lineTo(this.size * 0.6, -this.size * 0.3) // Asiento
        ctx.stroke()

        // Dibujar los pedales
        ctx.save()
        ctx.translate(this.size * 0.7, 0)
        ctx.rotate(this.wheelRotation * 2)
        ctx.beginPath()
        ctx.strokeStyle = "#000"
        ctx.lineWidth = 2
        ctx.moveTo(0, -this.size * 0.2)
        ctx.lineTo(0, this.size * 0.2)
        ctx.stroke()
        ctx.restore()

        ctx.restore()
      }
    }

    // Crear bicicletas
    for (let i = 0; i < numBicycles; i++) {
      bicycles.push(new Bicycle(canvas))
    }

    // Función de animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Actualizar y dibujar cada bicicleta
      bicycles.forEach((bicycle) => {
        bicycle.update(canvas)
        bicycle.draw(ctx)
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasSize)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full min-h-[300px]" />
}
