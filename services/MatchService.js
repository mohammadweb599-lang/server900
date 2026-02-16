const { Match } = require('../models/Match.js');
const User = require('../models/user');
const CoinService = require('./CoinService.js');

// redisClient اختیاری است
let redisClient = null;
try {
  const dbConfig = require('../config/database.js');
  redisClient = dbConfig.redisClient;
} catch (error) {
  // Redis اختیاری است
}

class MatchService {
  
  // ایجاد بازی جدید
  static async createMatch(homeTeamId, awayTeamId, league) {
    const homeTeam = await User.findById(homeTeamId);
    const awayTeam = await User.findById(awayTeamId);
    
    if (!homeTeam || !awayTeam) {
      throw new Error('تیم‌ها یافت نشدند');
    }

    const match = new Match({
      homeTeam: homeTeamId,
      awayTeam: awayTeamId,
      homeTeamName: homeTeam.teamName,
      awayTeamName: awayTeam.teamName,
      stadium: `${homeTeam.teamName} Stadium`,
      league,
      startTime: new Date()
    });

    await match.save();
    
    // شروع شبیه‌سازی
    this.simulateMatch(match._id);
    
    return match;
  }

  // شبیه‌سازی بازی
  static async simulateMatch(matchId) {
    const match = await Match.findById(matchId);
    if (!match || match.isFinished) return;

    const homeTeam = await User.findById(match.homeTeam);
    const awayTeam = await User.findById(match.awayTeam);

    // شبیه‌سازی دقیقه به دقیقه
    for (let minute = 1; minute <= 90; minute++) {
      await this.delay(100); // تاخیر 100ms برای هر دقیقه
      
      match.matchTime = minute;
      await this.simulateMinute(match, homeTeam, awayTeam, minute);
      
      await match.save();
      
      // ارسال آپدیت از طریق Socket.io
      this.emitMatchUpdate(match);
    }

    // پایان بازی
    match.isFinished = true;
    await match.save();

    // محاسبه نتایج و درآمد
    await this.processMatchResult(match, homeTeam, awayTeam);
  }

  // شبیه‌سازی یک دقیقه از بازی
  static async simulateMinute(match, homeTeam, awayTeam, minute) {
    const homePower = homeTeam.teamPower;
    const awayPower = awayTeam.teamPower;
    
    // احتمال وقوع رویداد در هر دقیقه
    const eventProbability = 0.15; // 15% chance per minute
    
    if (Math.random() < eventProbability) {
      const eventType = this.getRandomEventType();
      const team = this.getEventTeam(homePower, awayPower);
      
      const event = {
        minute,
        type: eventType,
        team,
        playerName: this.getRandomPlayerName(team === 'home' ? homeTeam : awayTeam),
        description: this.generateEventDescription(eventType, team, minute)
      };

      match.events.push(event);
      
      // پردازش رویداد
      await this.processEvent(event, match, homeTeam, awayTeam);
    }
  }

  // دریافت نوع رویداد تصادفی
  static getRandomEventType() {
    const events = [
      { type: 'goal', weight: 8 },
      { type: 'yellowCard', weight: 12 },
      { type: 'redCard', weight: 2 },
      { type: 'injury', weight: 3 },
      { type: 'foul', weight: 15 },
      { type: 'corner', weight: 10 },
      { type: 'freeKick', weight: 8 },
      { type: 'penalty', weight: 2 }
    ];

    const totalWeight = events.reduce((sum, event) => sum + event.weight, 0);
    let random = Math.random() * totalWeight;

    for (const event of events) {
      random -= event.weight;
      if (random <= 0) {
        return event.type;
      }
    }

    return 'foul';
  }

  // انتخاب تیم برای رویداد (بر اساس قدرت)
  static getEventTeam(homePower, awayPower) {
    const homeAdvantage = 1.1; // Advantage for home team
    const totalPower = (homePower * homeAdvantage) + awayPower;
    const homeProbability = (homePower * homeAdvantage) / totalPower;
    
    return Math.random() < homeProbability ? 'home' : 'away';
  }

  // پردازش رویداد
  static async processEvent(event, match, homeTeam, awayTeam) {
    const team = event.team === 'home' ? homeTeam : awayTeam;
    
    switch (event.type) {
      case 'goal':
        if (event.team === 'home') {
          match.score.home++;
        } else {
          match.score.away++;
        }
        break;
        
      case 'redCard':
        // کاهش قدرت تیم برای بقیه بازی
        await this.applyRedCardEffect(team);
        break;
        
      case 'injury':
        // مصدومیت بازیکن
        await this.applyInjuryEffect(team);
        break;
        
      case 'penalty':
        // 80% chance to score penalty
        if (Math.random() < 0.8) {
          if (event.team === 'home') {
            match.score.home++;
          } else {
            match.score.away++;
          }
        }
        break;
    }
  }

  // اعمال اثر کارت قرمز
  static async applyRedCardEffect(team) {
    // کاهش قدرت تیم
    team.teamPower = Math.max(50, team.teamPower - 5);
    await team.save();
  }

  // اعمال اثر مصدومیت
  static async applyInjuryEffect(team) {
    const randomPlayer = team.players[Math.floor(Math.random() * team.players.length)];
    if (randomPlayer) {
      randomPlayer.isInjured = true;
      randomPlayer.injuryEndTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 روز
      await team.save();
    }
  }

  // پردازش نتیجه نهایی بازی
  static async processMatchResult(match, homeTeam, awayTeam) {
    // محاسبه امتیاز
    if (match.score.home > match.score.away) {
      homeTeam.league.points += 3;
    } else if (match.score.home < match.score.away) {
      awayTeam.league.points += 3;
    } else {
      homeTeam.league.points += 1;
      awayTeam.league.points += 1;
    }

    // آپدیت آمار
    homeTeam.league.goalsFor += match.score.home;
    homeTeam.league.goalsAgainst += match.score.away;
    homeTeam.league.matchesPlayed += 1;

    awayTeam.league.goalsFor += match.score.away;
    awayTeam.league.goalsAgainst += match.score.home;
    awayTeam.league.matchesPlayed += 1;

    await homeTeam.save();
    await awayTeam.save();

    // اضافه کردن درآمد از facilities
    await CoinService.addMatchIncome(homeTeam._id, 'sponsor');
    await CoinService.addMatchIncome(homeTeam._id, 'stadium');
    await CoinService.addMatchIncome(homeTeam._id, 'tvRights');
    await CoinService.addMatchIncome(homeTeam._id, 'youthCamp');

    await CoinService.addMatchIncome(awayTeam._id, 'sponsor');
    await CoinService.addMatchIncome(awayTeam._id, 'tvRights');
    await CoinService.addMatchIncome(awayTeam._id, 'youthCamp');
  }

  // تولید توضیح رویداد
  static generateEventDescription(type, team, minute) {
    const descriptions = {
      goal: `⚽ گل زیبا در دقیقه ${minute}!`,
      yellowCard: `🟨 کارت زرد در دقیقه ${minute}`,
      redCard: `🟥 کارت قرمز در دقیقه ${minute}!`,
      injury: `🤕 مصدومیت در دقیقه ${minute}`,
      foul: `📢 خطا در دقیقه ${minute}`,
      corner: `↩️ کرنر در دقیقه ${minute}`,
      freeKick: `🎯 ضربه آزاد در دقیقه ${minute}`,
      penalty: `🎯 پنالتی در دقیقه ${minute}!`
    };

    return descriptions[type] || `رویداد در دقیقه ${minute}`;
  }

  // دریافت نام تصادفی بازیکن
  static getRandomPlayerName(team) {
    if (!team.players || team.players.length === 0) return 'بازیکن ناشناس';
    const player = team.players[Math.floor(Math.random() * team.players.length)];
    return player.name;
  }

  // ارسال آپدیت از طریق Socket
  static emitMatchUpdate(match) {
    const io = global.io;
    if (io) {
      io.emit('matchUpdate', {
        matchId: match._id,
        score: match.score,
        events: match.events,
        matchTime: match.matchTime
      });
    }
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // دریافت بازی‌های زنده
  static async getLiveMatches() {
    return await Match.find({ 
      isFinished: false 
    })
    .sort({ createdAt: -1 })
    .limit(2) // فقط 2 بازی آخر
    .populate('homeTeam', 'teamName')
    .populate('awayTeam', 'teamName');
  }
}

module.exports = { MatchService };