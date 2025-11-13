import React, { useState } from 'react';
import Lobby from './Lobby';
import Game from './Game';

function App() {
  const [screen, setScreen] = useState('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');

  return (
    <>
      {screen === 'lobby' && <Lobby setScreen={setScreen} setRoomCode={setRoomCode} username={username} setUsername={setUsername} />}
      {screen === 'game' && <Game roomCode={roomCode} username={username} setScreen={setScreen} />}
    </>
  );
}

export default App;
