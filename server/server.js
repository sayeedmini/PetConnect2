const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/db');

connectDB();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-booking', (bookingId) => {
    socket.join(bookingId);
  });

  socket.on('groomer-location-update', ({ bookingId, coordinates }) => {
    socket.to(bookingId).emit('location-updated', coordinates);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
