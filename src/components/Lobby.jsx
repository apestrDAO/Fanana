import React, { useState } from 'react';

const DEFAULT_WAGERS = [0.025, 0.1, 0.5];

const Lobby = ({ wallet, onJoin, socket }) => {
  const [selectedWager, setSelectedWager] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [matching, setMatching] = useState(false);

  const fee = isCustom ? 0.5 : 0.2;

  const handleJoin = () => {
    let amount;
    if (isCustom) {
      amount = parseFloat(customAmount);
      if (!amount || amount <= 0) return;
    } else {
      amount = selectedWager;
      if (!amount) return;
    }
    setMatching(true);
    onJoin({ amount, custom: isCustom });
  };

  return (
    <div className="lobby">
      <h2>🍌 Fanana Lobby</h2>
      <p>Wallet: {wallet.address.slice(0, 8)}...{wallet.address.slice(-4)}</p>
      <p style={{ marginTop: '10px', color: '#aaa' }}>
        Select your wager:
      </p>

      <div className="wager-options">
        {DEFAULT_WAGERS.map((w) => (
          <button
            key={w}
            className={`wager-btn ${selectedWager === w && !isCustom ? 'selected' : ''}`}
            onClick={() => { setSelectedWager(w); setIsCustom(false); }}
          >
            {w} SOL
          </button>
        ))}
        <button
          className={`wager-btn ${isCustom ? 'selected' : ''}`}
          onClick={() => { setIsCustom(true); setSelectedWager(null); }}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="custom-wager">
          <input
            type="number"
            placeholder="Amount (SOL)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            min="0.01"
            step="0.01"
          />
        </div>
      )}

      <p style={{ color: '#888', fontSize: '0.9em' }}>
        Fee: {fee}% per game
      </p>

      <button className="join-btn" onClick={handleJoin} disabled={matching}>
        {matching ? 'Matching...' : 'Join Lobby'}
      </button>

      {matching && (
        <div className="matching">
          <p>Waiting for opponent...</p>
        </div>
      )}
    </div>
  );
};

export default Lobby;   
