import React, { useState } from 'react';
import socket from './socket';

function Lobby({ setScreen, setRoomCode, username, setUsername }) {
  const [roomInput, setRoomInput] = useState('');
  const [mode, setMode] = useState('points');
  const [rounds, setRounds] = useState(10);

  const handleHost = () => {
    socket.emit('createRoom', username, (code) => {
      setRoomCode(code);
      setScreen('game');
      socket.emit('startGame', { roomCode: code, mode, rounds });
    });
  };

  const handleJoin = () => {
    socket.emit('joinRoom', { username, roomCode: roomInput }, (res) => {
      if (res.success) {
        setRoomCode(roomInput);
        setScreen('game');
      } else {
        alert(res.message);
      }
    });
  };

  return (
    <div className="lobby-panel">
      <h1>🐥 Rhymes Game</h1>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your nickname" className="big-input" />
      <button className="primary" onClick={handleHost}>Host Room</button>
      <input value={roomInput} onChange={e => setRoomInput(e.target.value)} placeholder="Room Code" className="big-input" />
      <button className="primary" onClick={handleJoin}>Join Room</button>
      <div className="mode-select">
        <label>Mode:</label>
        <select value={mode} onChange={e => setMode(e.target.value)} className="big-select">
          <option value="points">Points</option>
          <option value="rounds">Rounds</option>
        </select>
        {mode === 'rounds' && <input type="number" min={1} value={rounds} onChange={e => setRounds(e.target.value)} className="rounds-input" placeholder="Rounds" />}
      </div>
    </div>
  );
}

export default Lobby;
