const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function createRoom(hostUsername, hostId) {
  const code = generateRoomCode();
  rooms[code] = {
    host: { username: hostUsername, id: hostId },
    players: [{ username: hostUsername, id: hostId, score: 0, lives: 5, status: '', eliminated: false }],
    mode: 'points',
    rounds: 0,
    state: 'lobby',
    currentChuck: null,
    word: null,
    answers: [],
    answerReveal: false,
    roundNumber: 0
  };
  return code;
}

function joinRoom(code, username, id) {
  if (!rooms[code]) return { success: false, message: 'Room does not exist.' };
  if (rooms[code].players.find(p => p.id === id)) return { success: true, players: rooms[code].players };
  rooms[code].players.push({ username, id, score: 0, lives: 5, status: '', eliminated: false });
  return { success: true, players: rooms[code].players };
}

function leaveRoom(code, id) {
  if (!rooms[code]) return;
  rooms[code].players = rooms[code].players.filter(p => p.id !== id);
}

function startGame(code, mode, rounds, io) {
  if (!rooms[code]) return;
  rooms[code].mode = mode;
  rooms[code].rounds = rounds;
  rooms[code].state = 'playing';
  rooms[code].roundNumber = 1;
  nextChuck(code, io);
}

function nextChuck(code, io) {
  const room = rooms[code];
  if (!room) return;
  const activePlayers = room.players.filter(p => !p.eliminated);
  if (activePlayers.length === 0) return;
  const chuckIndex = Math.floor(Math.random() * activePlayers.length);
  room.currentChuck = activePlayers[chuckIndex].id;
  room.word = null;
  room.answers = [];
  room.answerReveal = false;
  io.to(code).emit('newChuck', { currentChuck: room.currentChuck, roundNumber: room.roundNumber, players: room.players });
}

function submitWord(code, id, word, io) {
  const room = rooms[code];
  if (!room || room.currentChuck !== id) return;
  room.word = word;
  io.to(code).emit('wordReveal', { word: room.word });
}

function submitAnswer(code, id, answer, io) {
  const room = rooms[code];
  if (!room || !room.word) return;
  if (room.answers.find(a => a.id === id)) return;
  room.answers.push({ id, answer });
  if (room.answers.length === room.players.filter(p => !p.eliminated).length) {
    room.answerReveal = true;
    calculateScores(code, io);
  }
}

function calculateScores(code, io) {
  const room = rooms[code];
  if (!room) return;
  const answerMap = {};
  room.answers.forEach(({ id, answer }) => {
    if (!answerMap[answer]) answerMap[answer] = [];
    answerMap[answer].push(id);
  });

  room.answers.forEach(({ id, answer }) => {
    const player = room.players.find(p => p.id === id);
    const matches = answerMap[answer].length;
    if (matches === 1) {
      if (room.mode === 'points') {
        player.lives -= 1;
        player.status = 'QUACK'.slice(0, 5 - player.lives);
        if (player.lives <= 0) { player.eliminated = true; }
      }
    } else if (matches === 2) {
      player.score += 3;
    } else if (matches > 2) {
      player.score += 1;
    }
    const chuckPlayer = room.players.find(p => p.id === room.currentChuck);
    const chuckAnswer = room.answers.find(a => a.id === room.currentChuck)?.answer;
    if (player.id !== room.currentChuck && answer === chuckAnswer) {
      player.score += 2;
      chuckPlayer.score += 1;
    }
  });

  io.to(code).emit('answersReveal', { answers: room.answers, players: room.players });
  if (room.mode === 'points' && (room.players.some(p => p.score >= 20) || room.players.filter(p => !p.eliminated).length <= 1)) {
    room.state = 'ended';
    const winner = room.players.sort((a, b) => b.score - a.score)[0];
    io.to(code).emit('gameEnd', { winner: winner.username, players: room.players });
  } else if (room.mode === 'rounds' && room.roundNumber >= room.rounds) {
    room.state = 'ended';
    const winner = room.players.sort((a, b) => b.score - a.score)[0];
    io.to(code).emit('gameEnd', { winner: winner.username, players: room.players });
  }
}

function nextRound(code, io) {
  const room = rooms[code];
  if (!room) return;
  room.roundNumber += 1;
  nextChuck(code, io);
}

module.exports = { createRoom, joinRoom, leaveRoom, startGame, submitWord, submitAnswer, nextRound };
