import { cn } from "@/lib/utils"

interface RNBLogoProps {
  size?: number
  className?: string
}

export function RNBLogo({ size = 40, className }: RNBLogoProps) {
  return (
    <div className={cn("flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Círculo exterior */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-bike-primary"
        />

        {/* Bicicleta estilizada */}
        <g className="text-bike-primary" fill="currentColor">
          {/* Ruedas */}
          <circle cx="25" cy="65" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="75" cy="65" r="8" stroke="currentColor" strokeWidth="2" fill="none" />

          {/* Marco */}
          <path
            d="M25 65 L45 35 L65 35 L75 65 M45 35 L25 65 M55 35 L55 50 L75 65"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />

          {/* Manillar */}
          <path d="M40 35 L50 35" stroke="currentColor" strokeWidth="2" />
        </g>

        {/* Texto RNB */}
        <text
          x="50"
          y="25"
          textAnchor="middle"
          className="text-bike-primary font-bold"
          fontSize="12"
          fill="currentColor"
        >
          RNB
        </text>
      </svg>
    </div>
  )
}
