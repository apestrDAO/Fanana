import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const lobbies = {
  0.025: [],
  0.1: [],
  0.5: [],
  custom: []
};

const games = {};

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('joinLobby', ({ lobbyId, walletAddress, wager }) => {
    const key = lobbyId === 'custom' ? 'custom' : lobbyId;
    const lobby = lobbies[key];

    if (!lobby) return;

    // If lobby already has a player, start game
    if (lobby.length >= 1) {
      const opponent = lobby[0];
      startGame(socket.id, opponent.id, wager, key);
    } else {
      lobby.push({ id: socket.id, walletAddress, wager });
      socket.emit('waitingForOpponent');
    }
  });

  socket.on('click', ({ score }) => {
    // Find which game this socket is in
    for (const [gameId, game] of Object.entries(games)) {
      if (game.players.includes(socket.id)) {
        // Broadcast opponent score to the other player
        const opponentId = game.players.find((p) => p !== socket.id);
        if (opponentId) {
          io.to(opponentId).emit('opponentScore', { score });
        }
      }
    }
  });

  socket.on('gameEnd', ({ score }) => {
    for (const [gameId, game] of Object.entries(games)) {
      if (game.players.includes(socket.id)) {
        const opponentId = game.players.find((p) => p !== socket.id);
        if (opponentId) {
          io.to(opponentId).emit('gameEnd', { opponentScore: score });
        }
        delete games[gameId];
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    // Remove from any lobby
    for (const key of Object.keys(lobbies)) {
      const idx = lobbies[key].findIndex((p) => p.id === socket.id);
      if (idx !== -1) lobbies[key].splice(idx, 1);
    }
  });
});

function startGame(player1Id, player2Id, wager, lobbyKey) {
  const gameId = `game-${Date.now()}`;
  games[gameId] = {
    players: [player1Id, player2Id],
    wager,
    startTime: Date.now()
  };

  io.to(player1Id).emit('gameStart', {
    gameId,
    opponent: 'Player 2',
    wager
  });
  io.to(player2Id).emit('gameStart', {
    gameId,
    opponent: 'Player 1',
    wager
  });

  // Clear lobby
  lobbies[lobbyKey] = [];
}

server.listen(3001, () => {
  console.log('Fanana server running on port 3001');
});   
