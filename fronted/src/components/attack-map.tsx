import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"

interface Attack {
  id: string
  origin: { lat: number; lng: number; country: string }
  target: { lat: number; lng: number; country: string }
  type: "ddos" | "malware" | "phishing" | "ransomware"
  timestamp: number
  severity: "low" | "medium" | "high"
}

interface AnimatedAttack extends Attack {
  progress: number
  x1: number
  y1: number
  x2: number
  y2: number
}

const ATTACK_TYPES = {
  ddos: { color: "#ef4444", name: "DDoS" },
  malware: { color: "#f97316", name: "Malware" },
  phishing: { color: "#eab308", name: "Phishing" },
  ransomware: { color: "#dc2626", name: "Ransomware" },
}

const SEVERITY_COLORS = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
}

// Sample coordinates for major cities
const LOCATIONS = [
  { lat: 40.7128, lng: -74.006, country: "New York, USA" },
  { lat: 51.5074, lng: -0.1278, country: "London, UK" },
  { lat: 35.6762, lng: 139.6503, country: "Tokyo, Japan" },
  { lat: 55.7558, lng: 37.6176, country: "Moscow, Russia" },
  { lat: 39.9042, lng: 116.4074, country: "Beijing, China" },
  { lat: 52.52, lng: 13.405, country: "Berlin, Germany" },
  { lat: -33.8688, lng: 151.2093, country: "Sydney, Australia" },
  { lat: 19.076, lng: 72.8777, country: "Mumbai, India" },
  { lat: -23.5505, lng: -46.6333, country: "São Paulo, Brazil" },
  { lat: 30.0444, lng: 31.2357, country: "Cairo, Egypt" },
]

export default function AttackMap() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [attacks, setAttacks] = useState<AnimatedAttack[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
  })

  // Convert lat/lng to SVG coordinates
  const projectCoordinates = (lat: number, lng: number, width: number, height: number) => {
    const x = ((lng + 180) / 360) * width
    const y = ((90 - lat) / 180) * height
    return { x, y }
  }

  // Generate random attack
  const generateAttack = (): Attack => {
    const origin = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]
    let target = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]

    // Ensure origin and target are different
    while (target === origin) {
      target = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]
    }

    const types = Object.keys(ATTACK_TYPES) as Array<keyof typeof ATTACK_TYPES>
    const severities = Object.keys(SEVERITY_COLORS) as Array<keyof typeof SEVERITY_COLORS>

    return {
      id: Math.random().toString(36).substr(2, 9),
      origin,
      target,
      type: types[Math.floor(Math.random() * types.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      timestamp: Date.now(),
    }
  }

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // Generate new attack occasionally
      if (Math.random() < 0.3) {
        const newAttack = generateAttack()
        const originCoords = projectCoordinates(newAttack.origin.lat, newAttack.origin.lng, width, height)
        const targetCoords = projectCoordinates(newAttack.target.lat, newAttack.target.lng, width, height)

        const animatedAttack: AnimatedAttack = {
          ...newAttack,
          progress: 0,
          x1: originCoords.x,
          y1: originCoords.y,
          x2: targetCoords.x,
          y2: targetCoords.y,
        }

        setAttacks((prev) => [...prev, animatedAttack])
        setStats((prev) => ({ ...prev, total: prev.total + 1, active: prev.active + 1 }))
      }

      // Update attack progress and remove completed ones
      setAttacks((prev) => {
        const updated = prev
          .map((attack) => ({
            ...attack,
            progress: Math.min(attack.progress + 0.02, 1),
          }))
          .filter((attack) => attack.progress < 1)

        const completed = prev.length - updated.length
        if (completed > 0) {
          setStats((prevStats) => ({
            ...prevStats,
            active: prevStats.active - completed,
            blocked: prevStats.blocked + completed,
          }))
        }

        return updated
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Attacks</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-500">{stats.active}</div>
          <div className="text-sm text-muted-foreground">Active Attacks</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">{stats.blocked}</div>
          <div className="text-sm text-muted-foreground">Blocked Attacks</div>
        </Card>
      </div>

      {/* Attack Legend */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Attack Types</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(ATTACK_TYPES).map(([type, config]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-sm text-muted-foreground">{config.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Map */}
      <Card className="p-4">
        <div className="relative w-full h-[600px] bg-slate-900 rounded-lg overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
            {/* World map background (simplified continents) */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.3" />
              </pattern>
            </defs>

            <rect width="1000" height="500" fill="url(#grid)" />

            {/* Simplified world continents */}
            <g fill="#334155" stroke="#475569" strokeWidth="1">
              {/* North America */}
              <path d="M 50 80 Q 150 60 250 100 L 280 180 Q 200 200 120 160 Z" />
              {/* South America */}
              <path d="M 200 250 Q 250 240 280 300 L 260 400 Q 220 380 200 320 Z" />
              {/* Europe */}
              <path d="M 450 80 Q 520 70 580 100 L 570 140 Q 500 150 450 120 Z" />
              {/* Africa */}
              <path d="M 480 150 Q 550 140 580 200 L 570 350 Q 520 360 480 300 Z" />
              {/* Asia */}
              <path d="M 600 60 Q 750 50 850 120 L 880 200 Q 800 220 650 180 Z" />
              {/* Australia */}
              <path d="M 750 350 Q 820 340 850 380 L 840 400 Q 780 410 750 380 Z" />
            </g>

            {/* Location dots */}
            {LOCATIONS.map((location, index) => {
              const coords = projectCoordinates(location.lat, location.lng, 1000, 500)
              return (
                <g key={index}>
                  <circle cx={coords.x} cy={coords.y} r="3" fill="#60a5fa" className="animate-pulse" />
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r="8"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                </g>
              )
            })}

            {/* Animated attack lines */}
            {attacks.map((attack) => {
              const currentX = attack.x1 + (attack.x2 - attack.x1) * attack.progress
              const currentY = attack.y1 + (attack.y2 - attack.y1) * attack.progress
              const color = ATTACK_TYPES[attack.type].color

              return (
                <g key={attack.id}>
                  {/* Attack trail */}
                  <line
                    x1={attack.x1}
                    y1={attack.y1}
                    x2={currentX}
                    y2={currentY}
                    stroke={color}
                    strokeWidth="2"
                    opacity={0.6}
                    strokeDasharray="5,5"
                  />

                  {/* Attack projectile */}
                  <circle cx={currentX} cy={currentY} r="4" fill={color} className="drop-shadow-lg">
                    <animate attributeName="r" values="4;6;4" dur="0.5s" repeatCount="indefinite" />
                  </circle>

                  {/* Pulsing origin */}
                  <circle cx={attack.x1} cy={attack.y1} r="6" fill={color} opacity="0.3">
                    <animate attributeName="r" values="6;12;6" dur="1s" repeatCount="indefinite" />
                  </circle>
                </g>
              )
            })}
          </svg>

          {/* Overlay info */}
          <div className="absolute top-4 left-4 text-white">
            <div className="text-sm opacity-75">Live Attack Monitor</div>
            <div className="text-xs opacity-50">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
