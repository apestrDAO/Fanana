import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import LandingPage from './components/LandingPage';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './App.css';

const App = () => {
  const [screen, setScreen] = useState('landing'); // landing, lobby, game
  const [wallet, setWallet] = useState(null);
  const [socket, setSocket] = useState(null);
  const [gameData, setGameData] = useState(null);

  const connectWallet = async (walletInfo) => {
    setWallet(walletInfo);
    const s = io('http://localhost:3001');
    setSocket(s);
    setScreen('lobby');

    s.on('gameStart', (data) => {
      setGameData(data);
      setScreen('game');
    });

    s.on('gameEnd', (data) => {
      setGameData((prev) => ({ ...prev, ...data }));
    });

    s.on('opponentJoined', (data) => {
      // opponent info
    });
  };

  const joinLobby = (wager) => {
    if (socket) {
      socket.emit('joinLobby', {
        lobbyId: wager.custom ? 'custom' : wager.amount,
        walletAddress: wallet.address,
        wager: wager.amount
      });
    }
  };

  const leaveToLobby = () => {
    setScreen('lobby');
    setGameData(null);
  };

  const handleGameEnd = useCallback(() => {
    setScreen('lobby');
    setGameData(null);
  }, []);

  return (
    <div className="App">
      {screen === 'landing' && (
        <LandingPage onConnect={connectWallet} />
      )}
      {screen === 'lobby' && (
        <Lobby
          wallet={wallet}
          onJoin={joinLobby}
          socket={socket}
        />
      )}
      {screen === 'game' && gameData && (
        <Game
          gameData={gameData}
          wallet={wallet}
          socket={socket}
          onEnd={handleGameEnd}
        />
      )}
    </div>
  );
};

export default App;   
