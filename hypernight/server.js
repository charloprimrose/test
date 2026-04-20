const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let state = { red: 0, green: 0, blue: 0, max: 50 };

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'init', state }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'lap') {
        const { team, delta } = msg;
        if (team === 'red' || team === 'green' || team === 'blue') {
          state[team] = Math.max(0, Math.min(state.max, state[team] + delta));
          broadcast({ type: 'update', state });
        }
      } else if (msg.type === 'reset') {
        state.red = 0;
        state.green = 0;
        state.blue = 0;
        broadcast({ type: 'update', state });
      } else if (msg.type === 'setMax') {
        state.max = Math.max(1, parseInt(msg.max) || 50);
        broadcast({ type: 'update', state });
      }
    } catch (e) {
      console.error('Invalid message:', e.message);
    }
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🌙 HyperNight running on http://localhost:${PORT}`);
  console.log(`   Staff control : http://localhost:${PORT}/control.html`);
  console.log(`   Display screen: http://localhost:${PORT}/display.html\n`);
});
