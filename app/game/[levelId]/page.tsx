import { Suspense } from "react"
import { GameInterface } from "@/components/game/game-interface"
import { Skeleton } from "@/components/ui/skeleton"

interface GamePageProps {
  params: {
    levelId: string
  }
}

export default function GamePage({ params }: GamePageProps) {
  const levelId = Number.parseInt(params.levelId, 10)

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <GameInterface levelId={levelId} />
      </Suspense>
    </div>
  )
}
