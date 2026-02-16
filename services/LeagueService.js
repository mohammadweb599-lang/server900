const { User } = require('../models/user');
const { MatchService } = require('./MatchService');
const { LEAGUE_DATA } = require('../config/constants');
const mongoose = require('mongoose');

export class LeagueService {
  
  // لیگ‌ها به ترتیب
  static leagues = [
    'لیگ محلات دسته 3',
    'لیگ محلات دسته 2', 
    'لیگ محلات دسته 1',
    'لیگ استانی دسته 3',
    'لیگ استانی دسته 2',
    'لیگ استانی دسته 1',
    'لیگ برتر دسته 3',
    'لیگ برتر دسته 2',
    'لیگ برتر دسته 1',
    'لیگ ستارگان'
  ];

  // ثبت‌نام در لیگ
  static async registerForLeague(userId, leagueName) {
    const user = await User.findById(userId);
    if (!user) throw new Error('کاربر یافت نشد');

    if (!this.leagues.includes(leagueName)) {
      throw new Error('لیگ معتبر نیست');
    }

    user.league.currentLeague = leagueName;
    user.league.points = 0;
    user.league.goalsFor = 0;
    user.league.goalsAgainst = 0;
    user.league.matchesPlayed = 0;

    await user.save();
    return user;
  }

  // شبیه‌سازی تمام بازی‌های لیگ
  static async simulateLeagueMatches() {
    console.log('🏆 Starting league matches simulation...');
    
    for (const league of this.leagues) {
      await this.simulateLeague(league);
    }
    
    console.log('✅ All league matches completed');
  }

  // شبیه‌سازی یک لیگ خاص
  static async simulateLeague(leagueName) {
    const teams = await User.find({ 
      'league.currentLeague': leagueName 
    }).limit(10); // 10 تیم در هر لیگ

    if (teams.length < 2) {
      console.log(`Not enough teams in ${leagueName}`);
      return;
    }

    // ایجاد برنامه بازی‌ها
    const fixtures = this.generateFixtures(teams);
    
    for (const fixture of fixtures) {
      await MatchService.createMatch(
        fixture.homeTeam._id,
        fixture.awayTeam._id,
        leagueName
      );
      
      // تاخیر بین بازی‌ها
      await this.delay(5000); // 5 ثانیه
    }
  }

  // تولید برنامه بازی‌ها
  static generateFixtures(teams) {
    const fixtures = [];
    
    // بازی رفت
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          homeTeam: teams[i],
          awayTeam: teams[j]
        });
      }
    }
    
    // بازی برگشت
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          homeTeam: teams[j], 
          awayTeam: teams[i]
        });
      }
    }
    
    return fixtures;
  }

  // صعود و سقوط
  static async promoteAndRelegate() {
    console.log('🔄 Processing promotion and relegation...');
    
    for (let i = 0; i < this.leagues.length - 1; i++) {
      const currentLeague = this.leagues[i];
      const nextLeague = this.leagues[i + 1];
      const prevLeague = i > 0 ? this.leagues[i - 1] : null;
      
      // صعود 2 تیم برتر
      const topTeams = await User.find({
        'league.currentLeague': currentLeague
      })
      .sort({ 
        'league.points': -1,
        'league.goalsFor': -1,
        'league.goalsAgainst': 1 
      })
      .limit(2);

      for (const team of topTeams) {
        team.league.currentLeague = nextLeague;
        team.league.points = 0;
        team.league.goalsFor = 0;
        team.league.goalsAgainst = 0;
        team.league.matchesPlayed = 0;
        await team.save();
        console.log(`⬆️ ${team.teamName} promoted to ${nextLeague}`);
      }

      // سقوط 2 تیم انتهایی (به جز لیگ پایین)
      if (prevLeague) {
        const bottomTeams = await User.find({
          'league.currentLeague': currentLeague
        })
        .sort({ 
          'league.points': 1,
          'league.goalsFor': 1,
          'league.goalsAgainst': -1 
        })
        .limit(2);

        for (const team of bottomTeams) {
          team.league.currentLeague = prevLeague;
          team.league.points = 0;
          team.league.goalsFor = 0;
          team.league.goalsAgainst = 0;
          team.league.matchesPlayed = 0;
          await team.save();
          console.log(`⬇️ ${team.teamName} relegated to ${prevLeague}`);
        }
      }
    }

    // پرداخت جوایز لیگ ستارگان
    await this.distributeLeaguePrizes();
  }

  // توزیع جوایز لیگ
  static async distributeLeaguePrizes() {
    for (const leagueName of this.leagues) {
      if (leagueName === 'لیگ ستارگان') continue; // جایزه نقدی جداگانه
      
      const leagueData = LEAGUE_DATA[leagueName];
      if (!leagueData?.prizes) continue;

      const topTeams = await User.find({
        'league.currentLeague': leagueName
      })
      .sort({ 'league.points': -1 })
      .limit(3);

      for (let i = 0; i < topTeams.length && i < leagueData.prizes.length; i++) {
        const team = topTeams[i];
        const prize = leagueData.prizes[i];
        
        team.coins += prize.coins;
        team.banknotes += prize.banknotes;
        
        await team.save();
        console.log(`🎁 Prize given to ${team.teamName} in ${leagueName}`);
      }
    }
  }

  // دریافت جدول لیگ
  static async getLeagueTable(leagueName) {
    return await User.find({
      'league.currentLeague': leagueName
    })
    .select('teamName teamPower league.points league.goalsFor league.goalsAgainst league.matchesPlayed')
    .sort({ 
      'league.points': -1,
      'league.goalsFor': -1,
      'league.goalsAgainst': 1 
    });
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}import mongoose from 'mongoose';

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

export const User = mongoose.model('User', userSchema);