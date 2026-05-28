"use client";

import { useGame } from "@/lib/game-context";
import Lobby from "./Lobby";
import PlayerSetup from "./PlayerSetup";
import Results from "./Results";
import GameBoard from "./GameBoard";
import GameOver from "./GameOver";

export default function GameContainer() {
  const game = useGame();

  switch (game.phase) {
    case "lobby":
      return <Lobby />;
    case "player-setup":
      return <PlayerSetup />;
    case "results":
      return <Results />;
    case "playing":
      return <GameBoard />;
    case "game-over":
      return <GameOver />;
    default:
      return <Lobby />;
  }
}
