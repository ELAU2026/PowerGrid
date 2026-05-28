import { GameProvider } from "@/lib/game-context";
import GameContainer from "@/components/game/GameContainer";

export default function Home() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}
