const User = require('../models/user');
const { FACILITY_DATA } = require('../config/constants');
const mongoose = require('mongoose');

class YouthCampService {
  
  // جذب بازیکن جدید
  static async recruitPlayer(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('کاربر یافت نشد');

    if (!user.players) {
      user.players = [];
    }

    // بررسی تعداد بازیکنان
    if (user.players.length >= 22) {
      throw new Error('تیم کامل است. حداکثر 22 بازیکن مجاز است');
    }

    if (!user.facilities || !user.facilities.youthCamp) {
      user.facilities = user.facilities || {};
      user.facilities.youthCamp = {
        level: 1,
        lastCollection: new Date(),
        currentCoins: 0
      };
    }

    const youthCampLevel = user.facilities.youthCamp.level;
    const overall = FACILITY_DATA.youthCamp.playerOverall[youthCampLevel - 1];
    
    const position = this.generatePosition();
    const newPlayer = {
      _id: new mongoose.Types.ObjectId(),
      name: this.generatePlayerName(),
      age: 18,
      overall,
      position,
      recruitedAt: new Date()
    };

    user.players.push(newPlayer);
    await user.save();
    
    return newPlayer;
  }

  // اخراج بازیکن
  static async firePlayer(userId, playerId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('کاربر یافت نشد');

    if (!user.monthlyStats) {
      user.monthlyStats = {
        playersFired: 0,
        lastReset: new Date()
      };
    }

    // بررسی محدودیت ماهانه
    const now = new Date();
    const lastReset = new Date(user.monthlyStats.lastReset);
    
    // اگر ماه تغییر کرده، ریست کن
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      user.monthlyStats.playersFired = 0;
      user.monthlyStats.lastReset = now;
    }

    if (user.monthlyStats.playersFired >= 3) {
      throw new Error('حداکثر 3 بازیکن در ماه می‌توانید اخراج کنید');
    }

    const player = user.players.id(playerId);
    if (!player) {
      throw new Error('بازیکن یافت نشد');
    }

    // حذف بازیکن
    user.players.pull(playerId);
    user.monthlyStats.playersFired += 1;
    
    await user.save();
    
    return { success: true, remainingFires: 3 - user.monthlyStats.playersFired };
  }

  // بررسی بازنشستگی
  static async checkRetirements() {
    const users = await User.find({
      'players.age': { $gte: 38 }
    });

    for (const user of users) {
      if (!user.players) continue;
      
      const retiredPlayers = user.players.filter(player => player.age >= 38);
      
      for (const player of retiredPlayers) {
        user.players.pull(player._id);
      }
      
      if (retiredPlayers.length > 0) {
        await user.save();
        console.log(`✅ ${retiredPlayers.length} players retired for user ${user.username}`);
      }
    }
  }

  // تولید نام بازیکن
  static generatePlayerName() {
    const firstNames = ['علی', 'محمد', 'حسین', 'رضا', 'امیر', 'سجاد', 'پارسا', 'کامیاب', 'مهدی', 'عباس'];
    const lastNames = ['محمدی', 'رضایی', 'حسینی', 'کریمی', 'جعفری', 'مهدوی', 'نوری', 'کاویانی', 'رحیمی', 'نجفی'];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
      lastNames[Math.floor(Math.random() * lastNames.length)]
    }`;
  }

  // تولید پست تصادفی
  static generatePosition() {
    const positions = ['GK', 'DF', 'MF', 'FW'];
    const weights = [1, 4, 4, 3];
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < positions.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return positions[i];
      }
    }
    
    return 'MF';
  }
}

module.exports = YouthCampService;
