import { Suspense } from "react"
import { GameInterface } from "@/components/game/game-interface"
import { GameLoadingScreen } from "@/components/ui/loading-screen"

interface GamePageProps {
  params: Promise<{ levelId: string }>
}

export default async function GamePage({ params }: GamePageProps) {
  const { levelId } = await params
  const parsedLevelId = Number.parseInt(levelId, 10)

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<GameLoadingScreen />}>
        <GameInterface levelId={parsedLevelId} />
      </Suspense>
    </div>
  )
}
