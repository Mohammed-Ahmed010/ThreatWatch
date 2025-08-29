import AttackMap from "@/components/attack-map"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Global Attack Monitor</h1>
          <p className="text-muted-foreground">Real-time visualization of cyber attacks worldwide</p>
        </div>
        <AttackMap />
      </div>
    </main>
  )
}
