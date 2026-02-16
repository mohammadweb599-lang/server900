const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  overall: { type: Number, required: true },
  position: { 
    type: String, 
    enum: ['GK', 'DF', 'MF', 'FW'],
    required: true 
  },
  skills: {
    speed: { type: Number, default: 50, min: 1, max: 99 },
    shot: { type: Number, default: 50, min: 1, max: 99 },
    pass: { type: Number, default: 50, min: 1, max: 99 },
    stamina: { type: Number, default: 50, min: 1, max: 99 },
    defense: { type: Number, default: 50, min: 1, max: 99 },
    dribble: { type: Number, default: 50, min: 1, max: 99 },
    physical: { type: Number, default: 50, min: 1, max: 99 }
  },
  contract: {
    expiresAt: { type: Date, required: true },
    originalCost: { type: Number, default: 0 },
    isBasePlayer: { type: Boolean, default: true }
  },
  isInjured: { type: Boolean, default: false },
  injuryEndTime: { type: Date }
});

const coachSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quality: { type: Number, required: true, min: 1, max: 5 },
  contract: {
    expiresAt: { type: Date, required: true },
    originalCost: { type: Number, required: true }
  }
});

const facilitySchema = new mongoose.Schema({
  level: { type: Number, default: 1, min: 1, max: 20 },
  lastCollection: { type: Date, default: Date.now },
  currentCoins: { type: Number, default: 0 }
});

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  password: { type: String, required: true },
  teamName: { 
    type: String, 
    required: true, 
    maxlength: 20,
    trim: true
  },
  coins: { type: Number, default: 10000, min: 0 },
  banknotes: { type: Number, default: 10, min: 0 },
  teamPower: { type: Number, default: 0 },
  
  facilities: {
    sponsor: { type: facilitySchema, default: () => ({}) },
    stadium: { type: facilitySchema, default: () => ({}) },
    tvRights: { type: facilitySchema, default: () => ({}) },
    youthCamp: { type: facilitySchema, default: () => ({}) }
  },
  
  players: [playerSchema],
  coach: { type: coachSchema, default: null },
  
  league: {
    currentLeague: { type: String, default: 'لیگ محلات دسته 3' },
    points: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    matchesPlayed: { type: Number, default: 0 }
  },
  
  monthlyStats: {
    playersFired: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  },
  
  settings: {
    teamNameChanged: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// محاسبه قدرت تیم
userSchema.pre('save', function(next) {
  if (this.players.length > 0) {
    const totalPower = this.players.reduce((sum, player) => sum + player.overall, 0);
    this.teamPower = Math.round(totalPower / this.players.length);
  }
  next();
});

// ایندکس برای بهینه‌سازی جستجوها
userSchema.index({ 'league.currentLeague': 1, 'league.points': -1 });
userSchema.index({ teamPower: -1 });
userSchema.index({ username: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);