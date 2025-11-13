import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import socket from './socket';

function Game({ roomCode, username, setScreen }) {
  const [players, setPlayers] = useState([]);
  const [currentChuck, setCurrentChuck] = useState('');
  const [word, setWord] = useState('');
  const [answers, setAnswers] = useState([]);
  const [answer, setAnswer] = useState('');
  const [isChuckTurn, setIsChuckTurn] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [timer, setTimer] = useState(20);
  const [gameState, setGameState] = useState('playing');
  const [winner, setWinner] = useState('');

  useEffect(() => {
    socket.on('roomUpdate', state => {
      setPlayers(state.players);
    });
    socket.on('newChuck', ({ currentChuck, roundNumber, players }) => {
      setPlayers(players);
      setCurrentChuck(currentChuck);
      setRoundNumber(roundNumber);
      setWord('');
      setAnswer('');
      setAnswers([]);
      setIsChuckTurn(currentChuck === socket.id);
      setTimer(20);
      setGameState('playing');
    });
    socket.on('wordReveal', ({ word }) => {
      setWord(word);
      setTimer(20);
    });
    socket.on('answersReveal', ({ answers, players }) => {
      setAnswers(answers);
      setPlayers(players);
      setGameState('reveal');
      setTimer(7);
    });
    socket.on('gameEnd', ({ winner, players }) => {
      setWinner(winner);
      setPlayers(players);
      setGameState('ended');
    });
    return () => {
      socket.off('roomUpdate');
      socket.off('newChuck');
      socket.off('wordReveal');
      socket.off('answersReveal');
      socket.off('gameEnd');
    };
  }, []);

  useEffect(() => {
    if (timer > 0 && (gameState === 'playing' || gameState === 'reveal')) {
      const s = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(s);
    }
    if (timer === 0 && gameState === 'playing' && word && answer === '') {
      socket.emit('submitAnswer', { roomCode, answer: '' });
    }
  }, [timer, gameState, word, answer, roomCode]);

  const handleWordSubmit = () => {
    if (word.length === 0) return;
    socket.emit('submitWord', { roomCode, word });
    setIsChuckTurn(false);
  };

  const handleAnswerSubmit = () => {
    if (answer.length === 0) return;
    socket.emit('submitAnswer', { roomCode, answer });
  };

  const handleNextRound = () => {
    socket.emit('nextRound', { roomCode });
    setGameState('playing');
  };

  return (
    <div className="game-container">
      {gameState === 'ended' && (
        <>
          <Confetti numberOfPieces={350} recycle={false} />
          <div className="winner-banner">
            🎉 Winner: {winner} 🎉
            <button className="primary" onClick={() => setScreen('lobby')}>Back to Lobby</button>
          </div>
        </>
      )}
      {gameState !== 'ended' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div className={currentChuck === socket.id ? "chuck-highlight" : ""}>
              🐥 Chuck: {players.find(p => p.id === currentChuck)?.username}
            </div>
            <div className="timer-circle">{timer}</div>
          </div>
          <h2>Round {roundNumber}</h2>
          {isChuckTurn && (
            <div style={{ margin: '22px 0' }}>
              <input type="text" value={word} onChange={e => setWord(e.target.value)} placeholder="Chuck, write your word" className="big-input" />
              <button className="primary" onClick={handleWordSubmit}>Submit Word</button>
            </div>
          )}
          {!isChuckTurn && !word && <p>Waiting for Chuck to write a word...</p>}
          {word && (
            <div style={{ margin: '20px 0' }}>
              <div className="word-card">Word: <span>{word}</span></div>
              <input type="text" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Write a rhyme" className="big-input" disabled={isChuckTurn} />
              <button className="primary" onClick={handleAnswerSubmit} disabled={isChuckTurn || answer.length === 0}>Submit Rhyme</button>
            </div>
          )}
          {answers.length > 0 && (
            <table className="answers-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Avatar</th>
                  <th>Rhyme</th>
                  <th>Score</th>
                  <th>Lives</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.id} className={p.eliminated ? "eliminated-row" : ""}>
                    <td>{p.username}</td>
                    <td>
                      <span className="player-avatar">{p.username[0].toUpperCase()}</span>
                    </td>
                    <td>{answers.find(a => a.id === p.id)?.answer || ''}</td>
                    <td>{p.score}</td>
                    <td>{p.lives}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {answers.length > 0 && <button className="primary next-round-btn" onClick={handleNextRound}>Next Round</button>}
        </>
      )}
    </div>
  );
}

export default Game;
