const { User } = require('../models/user');

export class ContractService {
  
  // تمدید قرارداد بازیکن
  static async renewPlayerContract(userId, playerId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('کاربر یافت نشد');

    const player = user.players.id(playerId);
    if (!player) throw new Error('بازیکن یافت نشد');

    // محاسبه هزینه تمدید (یک سوم قیمت اصلی)
    const renewalCost = Math.floor(player.contract.originalCost / 3);
    
    if (user.coins < renewalCost) {
      throw new Error('سکه کافی برای تمدید قرارداد نیست');
    }

    // کسر هزینه و تمدید قرارداد
    user.coins -= renewalCost;
    player.contract.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 روز دیگر

    await user.save();
    
    return { 
      success: true, 
      renewalCost,
      newExpiry: player.contract.expiresAt 
    };
  }

  // تمدید قرارداد سرمربی
  static async renewCoachContract(userId) {
    const user = await User.findById(userId);
    if (!user || !user.coach) throw new Error('سرمربی یافت نشد');

    const renewalCost = Math.floor(user.coach.contract.originalCost / 3);
    
    if (user.coins < renewalCost) {
      throw new Error('سکه کافی برای تمدید قرارداد سرمربی نیست');
    }

    user.coins -= renewalCost;
    user.coach.contract.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await user.save();
    
    return { 
      success: true, 
      renewalCost,
      newExpiry: user.coach.contract.expiresAt 
    };
  }

  // بررسی قراردادهای منقضی شده
  static async checkExpiredContracts() {
    const now = new Date();
    
    // بازیکنان
    const usersWithExpiredPlayers = await User.find({
      'players.contract.expiresAt': { $lt: now }
    });

    for (const user of usersWithExpiredPlayers) {
      const expiredPlayers = user.players.filter(player => 
        new Date(player.contract.expiresAt) < now && !player.contract.isBasePlayer
      );

      for (const player of expiredPlayers) {
        user.players.pull(player._id);
        console.log(`📝 Player ${player.name} removed from ${user.teamName} due to expired contract`);
      }

      if (expiredPlayers.length > 0) {
        await user.save();
      }
    }

    // سرمربیان
    const usersWithExpiredCoach = await User.find({
      'coach.contract.expiresAt': { $lt: now }
    });

    for (const user of usersWithExpiredCoach) {
      // بازگشت به سرمربی پیش‌فرض
      user.coach = {
        name: 'فیروز کریمی',
        quality: 1,
        contract: {
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 سال
          originalCost: 0
        }
      };

      await user.save();
      console.log(`👔 Coach reset to default for ${user.teamName}`);
    }
  }

  // خرید بازیکن از فروشگاه
  static async buyPlayerFromShop(userId, playerData, cost) {
    const user = await User.findById(userId);
    if (!user) throw new Error('کاربر یافت نشد');

    if (user.players.length >= 22) {
      throw new Error('تیم کامل است');
    }

    if (user.coins < cost) {
      throw new Error('سکه کافی نیست');
    }

    const newPlayer = {
      ...playerData,
      contract: {
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        originalCost: cost,
        isBasePlayer: false
      }
    };

    user.coins -= cost;
    user.players.push(newPlayer);
    await user.save();

    return newPlayer;
  }
}