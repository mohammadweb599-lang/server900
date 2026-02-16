const mongoose = require('mongoose');

const matchEventSchema = new mongoose.Schema({
  minute: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['goal', 'yellowCard', 'redCard', 'injury', 'penalty', 'substitution', 'foul', 'corner', 'freeKick'],
    required: true 
  },
  team: { type: String, enum: ['home', 'away'], required: true },
  playerId: { type: mongoose.Schema.Types.ObjectId },
  playerName: { type: String },
  description: { type: String, required: true }
});

const matchSchema = new mongoose.Schema({
  homeTeam: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  awayTeam: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  homeTeamName: { type: String, required: true },
  awayTeamName: { type: String, required: true },
  stadium: { type: String, required: true },
  league: { type: String, required: true },
  
  score: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 }
  },
  
  events: [matchEventSchema],
  isFinished: { type: Boolean, default: false },
  matchTime: { type: Number, default: 0 }, // دقیقه فعلی بازی
  startTime: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// TTL ایندکس برای پاک شدن خودکار بازی‌های قدیمی
matchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 }); // 24 ساعت

// ایندکس برای بازی‌های زنده
matchSchema.index({ isFinished: 1, createdAt: -1 });

module.exports = mongoose.model('Match', matchSchema);