
const app = require('./app');
const {createServer} = require('http');

const PORT = process.env.PORT || 4000;

const server = createServer(app);

server.on('listening', () => console.log(`Listening on ${PORT}`));
server.on('error', (err) => {
  if (err.syscall !== 'listen') throw err;
  const bind = typeof port === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;
  switch (err.code) {
    case 'EACCESS':
      console.log(`${bind} requires elevated privilege`);
      break;
    case 'EADDRINUSE':
      console.log(`${bind} is already in use`);
      break;
    default:
      throw err;
  }
});

server.listen(PORT);