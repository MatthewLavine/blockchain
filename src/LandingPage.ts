export const getLandingPage = () => {
  return `
    <html>
      <head>
        <title>Antigravity Blockchain Node</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 40px; line-height: 1.6; background: #0f0f0f; color: #00ff00; }
          h1 { color: #00ff00; border-bottom: 1px solid #00ff00; padding-bottom: 10px; }
          a { color: #00ff00; text-decoration: none; font-weight: bold; }
          a:hover { background: #00ff00; color: #000; }
          .endpoint { margin: 10px 0; }
          .method { color: #fff; background: #333; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; margin-right: 10px; display: inline-block; width: 40px; text-align: center; }
          .desc { color: #888; margin-left: 10px; }
        </style>
      </head>
      <body>
        <h1>ANTIGRAVITY_BLOCKCHAIN_NODE v1.0.0</h1>
        <p>> STATUS: ONLINE</p>
        <p>> AVAILABLE_ENDPOINTS:</p>
        <div class="endpoint"><span class="method">GET</span><a href="/blocks">/blocks</a><span class="desc">- Returns the entire blockchain</span></div>
        <div class="endpoint"><span class="method">GET</span><a href="/info">/info</a><span class="desc">- Returns metadata about the network</span></div>
        <div class="endpoint"><span class="method">GET</span><a href="/health">/health</a><span class="desc">- Node health check</span></div>
        <div class="endpoint"><span class="method">GET</span>/balance/:address<span class="desc">- Get wallet balance</span></div>
        <div class="endpoint"><span class="method">GET</span>/nonce/:address<span class="desc">- Get next expected nonce</span></div>
        <div class="endpoint"><span class="method">GET</span><a href="/pending">/pending</a><span class="desc">- Get pending transactions</span></div>
        <div class="endpoint"><span class="method">GET</span><a href="/peers">/peers</a><span class="desc">- Get connected peers</span></div>
        <div class="endpoint"><span class="method">POST</span>/transaction<span class="desc">- Submit a new transaction</span></div>
        <div class="endpoint"><span class="method">POST</span>/mine<span class="desc">- Mine pending transactions</span></div>
        <div class="endpoint"><span class="method">POST</span>/addPeer<span class="desc">- Manually connect to a peer</span></div>
        <div class="endpoint"><span class="method">POST</span>/reset<span class="desc">- Reset blockchain (development only)</span></div>
      </body>
    </html>
  `;
};
