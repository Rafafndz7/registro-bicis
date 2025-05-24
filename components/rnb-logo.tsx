interface RNBLogoProps {
  size?: number
  className?: string
}

export function RNBLogo({ size = 100, className = "" }: RNBLogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* Círculo de fondo */}
        <circle cx="50" cy="50" r="48" fill="#1e88e5" stroke="#1565c0" strokeWidth="2" />

        {/* Bicicleta simplificada */}
        <g transform="translate(20, 35)">
          {/* Rueda trasera */}
          <circle cx="10" cy="20" r="8" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="10" cy="20" r="3" fill="white" />

          {/* Rueda delantera */}
          <circle cx="50" cy="20" r="8" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="50" cy="20" r="3" fill="white" />

          {/* Marco */}
          <path
            d="M10 20 L30 5 L50 20 M10 20 L30 5 L30 20 M30 20 L50 20"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Manillar */}
          <path d="M45 8 L55 8" stroke="white" strokeWidth="2" strokeLinecap="round" />

          {/* Asiento */}
          <path d="M25 5 L35 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Texto RNB */}
        <text
          x="50"
          y="70"
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          RNB
        </text>
      </svg>
    </div>
  )
}
