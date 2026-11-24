import { useEffect, useRef, useState } from "react";
import { createGameScene } from "../game/createScene";
import { generateBoard } from "../game/boardData";

export default function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ReturnType<typeof createGameScene> | null>(null);

  const [version, setVersion] = useState(1);
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!canvasRef.current) return;

    const game = createGameScene(canvasRef.current);
    gameRef.current = game;

    game.updateBoard(generateBoard());

    const startedAt = Date.now();
    let lastVersion = 1;

    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const currentVersion = Math.floor(elapsed / 15) + 1;

      setTimeLeft(15 - (elapsed % 15));

      if (currentVersion > lastVersion) {
        game.updateBoard(generateBoard());
        lastVersion = currentVersion;
        setVersion(currentVersion);
      }
    }, 200);

    return () => {
      clearInterval(timer);
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="game-page">
      <header className="game-header">
        <h1>🐍 Snake Shift</h1>
        <div className="game-stats">
          <span>Board Version: {version}</span>
          <span>Next Shift: {timeLeft}s</span>
        </div>
      </header>

      <canvas ref={canvasRef} className="game-canvas" />

      <footer>Drag to rotate • Scroll to zoom</footer>
    </div>
  );
}
