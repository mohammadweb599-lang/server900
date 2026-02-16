import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Database } from './config/database.js';
import { MatchSocket } from './sockets/MatchSocket.js';

// Import jobs
import './jobs/CoinProductionJob.js';
import './jobs/DailyJobs.js'; 
import './jobs/LeagueJob.js';

// Import routes
import facilityRoutes from './routes/facilities.js';
import youthCampRoutes from './routes/youthCamp.js';
import paymentRoutes from './routes/payment.js'; // ✅ جدید

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// میدلورهای پایه
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // ✅ برای فایل‌های استاتیک

// راه‌اندازی دیتابیس
await Database.connect();

// راه‌اندازی Socket.io
MatchSocket.initialize(io);

// routes
app.use('/api/facilities', facilityRoutes);
app.use('/api/youth-camp', youthCampRoutes);
app.use('/api/payment', paymentRoutes); // ✅ جدید

// Route سلامت
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    payment: 'Zarinpal Integrated' // ✅ جدید
  });
});

// Route اصلی
app.get('/', (req, res) => {
  res.json({ 
    message: 'Football Manager API',
    version: '1.0.0',
    features: ['League System', 'Match Simulation', 'Payment Gateway'] // ✅ جدید
  });
});

// مدیریت خطا
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false,
    message: 'خطای سرور داخلی' 
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route یافت نشد' 
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳 Payment Gateway: Zarinpal ${process.env.NODE_ENV === 'production' ? 'Live' : 'Sandbox'}`); // ✅ جدید
});