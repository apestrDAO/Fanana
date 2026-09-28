import React, { useState, useEffect, useRef, useCallback } from 'react';

const WARMUP_SECONDS = 15;
const GAME_SECONDS = 22;
const BANANAS_PER_TREE = 88;

const generateBananas = (treeX, treeY, treeW, treeH) => {
  const bananas = [];
  for (let i = 0; i < BANANAS_PER_TREE; i++) {
    bananas.push({
      id: i,
      x: treeX + 20 + Math.random() * (treeW - 40),
      y: treeY + 20 + Math.random() * (treeH - 40),
      collected: false
    });
  }
  return bananas;
};

const Game = ({ gameData, wallet, socket, onEnd }) => {
  const [phase, setPhase] = useState('warmup'); // warmup, playing, ended
  const [countdown, setCountdown] = useState(WARMUP_SECONDS);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [bananas, setBananas] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [basketHighlight, setBasketHighlight] = useState(false);
  const [result, setResult] = useState(null);

  const gameAreaRef = useRef(null);
  const basketRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Generate bananas on mount
  useEffect(() => {
    const area = gameAreaRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const treeW = 200;
    const treeH = 250;
    const treeLeftX = rect.width * 0.25 - treeW / 2;
    const treeRightX = rect.width * 0.75 - treeW / 2;
    const treeY = rect.height * 0.5 - treeH / 2 - 50;

    const leftBananas = generateBananas(treeLeftX, treeY, treeW, treeH);
    const rightBananas = generateBananas(treeRightX, treeY, treeW, treeH);

    setBananas([...leftBananas, ...rightBananas]);
  }, []);

  // Warmup countdown
  useEffect(() => {
    if (phase !== 'warmup') return;
    if (countdown <= 0) {
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      setPhase('ended');
      const win = myScore > opponentScore;
      const tie = myScore === opponentScore;
      setResult(win ? 'win' : tie ? 'tie' : 'lose');
      if (socket) socket.emit('gameEnd', { score: myScore });
      return;
    }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  // Listen for opponent score updates
  useEffect(() => {
    if (!socket) return;
    const handleScore = (data) => setOpponentScore(data.score);
    socket.on('opponentScore', handleScore);
    return () => socket.off('opponentScore', handleScore);
  }, [socket]);

  const handleMouseDown = (e, banana) => {
    if (phase !== 'playing' || banana.collected) return;
    e.preventDefault();
    setDragging({
      id: banana.id,
      x: e.clientX,
      y: e.clientY
    });
    dragOffset.current = { x: 0, y: 0 };
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    setDragging((d) => ({ ...d, x: e.clientX, y: e.clientY }));

    // Check if over basket
    const basket = basketRef.current;
    if (basket) {
      const rect = basket.getBoundingClientRect();
      const over = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom;
      setBasketHighlight(over);
    }
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    if (!dragging) return;

    const basket = basketRef.current;
    if (basket) {
      const rect = basket.getBoundingClientRect();
      const over = dragging.x >= rect.left && dragging.x <= rect.right &&
                   dragging.y >= rect.top && dragging.y <= rect.bottom;
      if (over) {
        setBananas((prev) =>
          prev.map((b) => b.id === dragging.id ? { ...b, collected: true } : b)
        );
        setMyScore((s) => {
          const newScore = s + 1;
          if (socket) socket.emit('click', { score: newScore });
          return newScore;
        });
      }
    }

    setDragging(null);
    setBasketHighlight(false);
  }, [dragging, socket]);

  // Global mouse listeners while dragging
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const visibleBananas = bananas.filter((b) => !b.collected);

  return (
    <div className="game-container">
      {/* Header */}
      <div className="game-header">
        {phase === 'warmup' && (
          <div className="timer">{countdown}</div>
        )}
        {phase === 'playing' && (
          <div className="timer">{timeLeft}s</div>
        )}
        <div className="score">
          You: {myScore} 🍌 &nbsp;|&nbsp; Opponent: {opponentScore} 🍌
        </div>
      </div>

      {/* Game Area */}
      <div className="game-area" ref={gameAreaRef}>
        {/* Trees */}
        <div className="tree tree-left">
          <div className="tree-crown"></div>
          <div className="tree-trunk"></div>
        </div>
        <div className="tree tree-right">
          <div className="tree-crown"></div>
          <div className="tree-trunk"></div>
        </div>

        {/* Bananas */}
        {visibleBananas.map((b) => {
          const isDragged = dragging?.id === b.id;
          return (
            <span
              key={b.id}
              className={`banana ${isDragged ? 'dragging' : ''}`}
              style={{
                left: isDragged ? dragging.x - 14 : b.x,
                top: isDragged ? dragging.y - 14 : b.y,
                position: isDragged ? 'fixed' : 'absolute'
              }}
              onMouseDown={(e) => handleMouseDown(e, b)}
            >
              🍌
            </span>
          );
        })}

        {/* My Basket */}
        <div
          className={`basket basket-left ${basketHighlight ? 'highlight' : ''}`}
          ref={basketRef}
        >
          <span className="basket-count">{myScore}</span>
        </div>

        {/* Opponent Basket (visual only) */}
        <div className="basket basket-right">
          <span className="basket-count">{opponentScore}</span>
        </div>
      </div>

      {/* Warmup Overlay */}
      {phase === 'warmup' && (
        <div className="warmup-overlay">
          <h2>🍌 Fanana</h2>
          <p>Game starts in {countdown}s</p>
          <p style={{ marginTop: '10px', fontSize: '1em', color: '#888' }}>
            Drag bananas to your basket!
          </p>
        </div>
      )}

      {/* Game Over Overlay */}
      {phase === 'ended' && (
        <div className="game-over-overlay">
          <h2>
            {result === 'win' && '🏆 You Win!'}
            {result === 'lose' && '😢 You Lose'}
            {result === 'tie' && "🤝 It's a Tie"}
          </h2>
          <div className="scores">
            <p>You: {myScore} 🍌</p>
            <p>Opponent: {opponentScore} 🍌</p>
          </div>
          <button className="return-btn" onClick={onEnd}>
            Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
};

export default Game;   
