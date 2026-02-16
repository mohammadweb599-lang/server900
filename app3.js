require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { Database } = require('./config/db');
const { MatchSocket } = require('./sockets/MatchSocket');

// Import jobs
require('./jobs/CoinProductionJob');
require('./jobs/DailyJobs');
require('./jobs/LeagueJob');

// Import routes
const facilityRoutes = require('./routes/facilities');
const youthCampRoutes = require('./routes/youthCamp');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

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
app.use(express.urlencoded({ extended: true }));

// سرو کردن فایل‌های استاتیک (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route سلامت - باید قبل از routes دیگر باشد
//app.get('/health', (req, res) => {
 // res.json({ 
 //   status: 'OK', 
 //   timestamp: new Date().toISOString(),
 //   environment: process.env.NODE_ENV || 'development'
//  });
//});

// API routes - باید قبل از static files باشند
app.use('/api/facilities', facilityRoutes);
app.use('/api/youth-camp', youthCampRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// سرو کردن فایل‌های استاتیک React (build شده)
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

// برای SPA routing - همه route های غیر API را به index.html هدایت می‌کند
app.get('*', (req, res) => {
  // اگر route با /api شروع می‌شود، 404 برگردان
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ 
      success: false,
      message: 'Route یافت نشد' 
    });
  }
  // در غیر این صورت index.html را برگردان (برای React Router)
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// مدیریت خطا - باید در انتها باشد
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false,
    message: 'خطای سرور داخلی' 
  });
});

// راه‌اندازی دیتابیس و سرور
Database.connect().then(() => {
  // راه‌اندازی Socket.io
  MatchSocket.initialize(io);

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});