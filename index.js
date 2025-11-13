const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIO = require('socket.io');
const { createRoom, joinRoom, leaveRoom, startGame, submitWord, submitAnswer, nextRound } = require('./rooms');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });
const PORT = 4000;

io.on('connection', (socket) => {
  socket.on('createRoom', (username, cb) => {
    const roomCode = createRoom(username, socket.id);
    socket.join(roomCode);
    cb(roomCode);
    io.to(roomCode).emit('roomUpdate', joinRoom(roomCode));
  });

  socket.on('joinRoom', ({ username, roomCode }, cb) => {
    const res = joinRoom(roomCode, username, socket.id);
    if (res.success) {
      socket.join(roomCode);
      cb({ success: true });
      io.to(roomCode).emit('roomUpdate', joinRoom(roomCode));
    } else {
      cb({ success: false, message: res.message });
    }
  });

  socket.on('leaveRoom', ({ roomCode }) => {
    leaveRoom(roomCode, socket.id);
    socket.leave(roomCode);
    io.to(roomCode).emit('roomUpdate', joinRoom(roomCode));
  });

  socket.on('startGame', ({ roomCode, mode, rounds }) => {
    startGame(roomCode, mode, rounds, io);
  });

  socket.on('submitWord', ({ roomCode, word }) => {
    submitWord(roomCode, socket.id, word, io);
  });

  socket.on('submitAnswer', ({ roomCode, answer }) => {
    submitAnswer(roomCode, socket.id, answer, io);
  });

  socket.on('nextRound', ({ roomCode }) => {
    nextRound(roomCode, io);
  });

  socket.on('disconnecting', () => {
    // Optionally handle disconnect
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
