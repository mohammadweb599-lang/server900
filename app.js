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

// ==================== ROUTES ====================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});



// ثبت‌نام تیم جدید و قرارگیری در لیگ
app.post('/api/team/register', async (req, res) => {
  try {
    const { userId, teamInfo, leagueInfo, financialInfo } = req.body;
    
    console.log('📝 ثبت تیم جدید:', teamInfo.name);
    
    // 1. پیدا کردن کاربر
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'کاربر یافت نشد' 
      });
    }
    
    // 2. آپدیت اطلاعات تیم کاربر
    user.teamName = teamInfo.name;
    user.teamCity = teamInfo.city;
    
    // 3. تنظیم لیگ (از LeagueService استفاده کن)
    const selectedLeague = leagues.find(l => l.id === leagueInfo.leagueId);
    user.league = {
      currentLeague: selectedLeague.name,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      matchesPlayed: 0
    };
    
    // 4. تنظیم منابع اولیه
    user.coins = financialInfo.startingBudget;
    
    // 5. ایجاد امکانات اولیه (از CoinService)
    user.facilities = {
      sponsor: { level: 1, lastCollection: new Date(), currentCoins: 0 },
      stadium: { level: 1, lastCollection: new Date(), currentCoins: 0 },
      tvRights: { level: 1, lastCollection: new Date(), currentCoins: 0 },
      youthCamp: { level: 1, lastCollection: new Date(), currentCoins: 0 }
    };
    
    // 6. ایجاد بازیکنان پایه (از YouthCampService - 11 بازیکن)
    user.players = generateBasePlayers();
    
    // 7. ذخیره کاربر
    await user.save();
    
    // 8. ثبت در لیگ (اگر نیاز به ثبت جداگانه باشد)
    // await LeagueService.registerForLeague(userId, selectedLeague.name);
    
    res.status(201).json({
      success: true,
      message: 'تیم با موفقیت ثبت شد',
      teamName: teamInfo.name,
      leagueName: selectedLeague.name,
      startingCoins: financialInfo.startingBudget,
      playersCount: user.players.length
    });
    
  } catch (error) {
    console.error('خطا در ثبت تیم:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت تیم'
    });
  }
});

// تابع تولید بازیکنان پایه
function generateBasePlayers() {
  const positions = ['GK', 'DF', 'MF', 'FW'];
  const players = [];
  
  // 1 دروازه‌بان
  players.push({
    name: 'دروازه‌بان پایه',
    position: 'GK',
    overall: 70,
    age: 25,
    skills: { speed: 40, shot: 30, pass: 45, stamina: 65, defense: 75, dribble: 35, physical: 70 },
    contract: {
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      originalCost: 3000,
      isBasePlayer: true
    }
  });
  
  // 10 بازیکن دیگر...
  for (let i = 0; i < 10; i++) {
    const position = positions[Math.floor(Math.random() * 3) + 1]; // DF, MF, FW
    players.push({
      name: `بازیکن پایه ${i + 1}`,
      position: position,
      overall: 65 + Math.floor(Math.random() * 10),
      age: 20 + Math.floor(Math.random() * 10),
      skills: generateSkills(position),
      contract: {
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        originalCost: 2000 + Math.floor(Math.random() * 2000),
        isBasePlayer: true
      }
    });
  }
  
  return players;
}


// 1. AUTH
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  console.log('📝 ثبت‌نام:', username);
  res.status(201).json({
    success: true,
    message: 'ثبت‌نام موفق',
    user: { id: '1', username, email, coins: 1000, teamName: username + ' تیم' },
    token: 'sample-token'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('🔑 ورود:', email);
  res.json({
    success: true,
    message: 'ورود موفق',
    user: { id: '1', username: 'کاربر', email, coins: 5000, teamName: 'تیم من' },
    token: 'sample-token'
  });
});

app.get('/api/auth/profile', (req, res) => {
  console.log('👤 پروفایل');
  res.json({
    success: true,
    username: "سی تی",
    coins: 15000,
    teamName: "سی تی",
    players: [
      { _id: "1", name: "بازیکن ۱", position: "GK", overall: 82 },
      { _id: "2", name: "بازیکن ۲", position: "DF", overall: 78 },
      { _id: "3", name: "بازیکن ۳", position: "MF", overall: 85 },
      { _id: "4", name: "بازیکن ۴", position: "FW", overall: 88 }
    ]
  });
});

// 2. PAYMENT
app.get('/api/payment/packages', (req, res) => {
  console.log('💰 بسته‌ها');
  res.json({
    success: true,
    packages: [
      { id: 1, name: "بسته طلایی", price: 100000, coins: 50000 },
      { id: 2, name: "بسته نقره‌ای", price: 50000, coins: 20000 },
      { id: 3, name: "بسته برنزی", price: 20000, coins: 8000 }
    ]
  });
});

// 3. YOUTH CAMP
app.get('/api/youth-camp/info', (req, res) => {
  console.log('🏟️ کمپ');
  res.json({
    success: true,
    campInfo: { level: 3, monthlyFires: 2, maxFires: 5 }
  });
});



app.get('/facilities', (req, res) => {
  res.json([
    { id: 1, name: 'امکانات ورزشی' },
    { id: 2, name: 'سالن کنفرانس' }
  ]);
});

app.post('/api/youth-camp/recruit', (req, res) => {
  console.log('➕ جذب');
  res.json({
    success: true,
    player: { _id: Date.now().toString(), name: "بازیکن جدید", position: "MF", overall: 75 }
  });
});

app.delete('/api/youth-camp/player/:id', (req, res) => {
  console.log('🗑️ اخراج:', req.params.id);
  res.json({ success: true, remainingFires: 4 });
});

// ==================== END ROUTES ====================

// راه‌اندازی
Database.connect().then(() => {
  MatchSocket.initialize(io);
  const PORT = process.env.PORT || 5003;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});