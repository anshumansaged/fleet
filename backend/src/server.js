require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const config = require('./config');
const prisma = require('./config/prisma');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { registerEventHandlers } = require('./events/eventHandlers');

const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time updates
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  /\.vercel\.app$/,
  /\.onrender\.com$/,
];

const io = new Server(httpServer, {
  cors: {
    origin: config.nodeEnv === 'development' ? '*' : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO auth & room management
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join_owner_room', (ownerId) => {
    socket.join(`owner_${ownerId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('short'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API docs endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Fleet Accounting API',
    version: '1.0.0',
    status: 'running',
    frontend: 'https://fleet-accounting.vercel.app',
    docs: {
      auth: '/api/auth/',
      owners: '/api/owners/',
      drivers: '/api/drivers/',
      vehicles: '/api/vehicles/',
      trips: '/api/trips/',
      analytics: '/api/analytics/',
    },
  });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  // Prisma connects lazily, but let's verify connectivity
  await prisma.$connect();
  console.log('Database connected');

  registerEventHandlers(io);

  httpServer.listen(config.port, () => {
    console.log(`Fleet Accounting API running on port ${config.port}`);
  });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { app, io };
