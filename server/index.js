const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIO = require('socket.io');
const rooms = require('./rooms'); // Must be named exactly as the file

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });
const PORT = 4000;

io.on('connection', (socket) => {
  socket.on('createRoom', (username, cb) => {
    const roomCode = rooms.createRoom(username, socket.id);
    socket.join(roomCode);
    cb(roomCode);
    io.to(roomCode).emit('roomUpdate', rooms.joinRoom(roomCode));
  });

  socket.on('joinRoom', ({ username, roomCode }, cb) => {
    const res = rooms.joinRoom(roomCode, username, socket.id);
    if (res.success) {
      socket.join(roomCode);
      cb({ success: true });
      io.to(roomCode).emit('roomUpdate', rooms.joinRoom(roomCode));
    } else {
      cb({ success: false, message: res.message });
    }
  });

  socket.on('leaveRoom', ({ roomCode }) => {
    rooms.leaveRoom(roomCode, socket.id);
    socket.leave(roomCode);
    io.to(roomCode).emit('roomUpdate', rooms.joinRoom(roomCode));
  });

  socket.on('startGame', ({ roomCode, mode, rounds }) => {
    rooms.startGame(roomCode, mode, rounds, io);
  });

  socket.on('submitWord', ({ roomCode, word }) => {
    rooms.submitWord(roomCode, socket.id, word, io);
  });

  socket.on('submitAnswer', ({ roomCode, answer }) => {
    rooms.submitAnswer(roomCode, socket.id, answer, io);
  });

  socket.on('nextRound', ({ roomCode }) => {
    rooms.nextRound(roomCode, io);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
