import React, { useState } from 'react';

const LandingPage = ({ onConnect }) => {
  const [connecting, setConnecting] = useState(false);

  const connectPhantom = async () => {
    setConnecting(true);
    try {
      if (window.phantom?.solana) {
        const resp = await window.phantom.solana.connect();
        onConnect({
          name: 'Phantom',
          address: resp.publicKey.toString()
        });
      } else if (window.solana) {
        const resp = await window.solana.connect();
        onConnect({
          name: 'Phantom',
          address: resp.publicKey.toString()
        });
      } else {
        alert('Phantom wallet not found. Please install it.');
        setConnecting(false);
      }
    } catch (err) {
      console.error('Connection failed:', err);
      setConnecting(false);
    }
  };

  return (
    <div className="landing">
      <h1>🍌 Fanana</h1>
      <p>Pick the most bananas. Win the SOL.</p>
      <button className="connect-btn" onClick={connectPhantom} disabled={connecting}>
        {connecting ? 'Connecting...' : 'Connect Phantom'}
      </button>
    </div>
  );
};

export default LandingPage;   
