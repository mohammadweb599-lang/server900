const User = require('../models/user');
const { FACILITY_DATA } = require('../config/constants');

class CoinService {
  
  // محاسبه سکه‌های قابل برداشت
  static calculateCollectableCoins(user, facilityType) {
    const facility = user.facilities[facilityType];
    if (!facility) return 0;
    
    const productionRate = FACILITY_DATA[facilityType].production[facility.level - 1];
    
    const now = new Date();
    const lastCollection = facility.lastCollection || now;
    const hoursPassed = (now.getTime() - lastCollection.getTime()) / (1000 * 60 * 60);
    
    const maxCoins = productionRate * 10; // حداکثر 10 ساعت
    const producedCoins = Math.min(productionRate * hoursPassed, maxCoins);
    
    return Math.min(producedCoins + (facility.currentCoins || 0), maxCoins);
  }

  // برداشت سکه
  static async collectCoins(userId, facilityType) {
    const user = await User.findById(userId);
    if (!user) throw new Error('کاربر یافت نشد');

    const collectableCoins = Math.floor(this.calculateCollectableCoins(user, facilityType));
    
    if (collectableCoins > 0) {
      user.coins = (user.coins || 0) + collectableCoins;
      if (!user.facilities[facilityType]) {
        user.facilities[facilityType] = {
          level: 1,
          lastCollection: new Date(),
          currentCoins: 0
        };
      }
      user.facilities[facilityType].currentCoins = 0;
      user.facilities[facilityType].lastCollection = new Date();
      
      await user.save();
    }
    
    return collectableCoins;
  }

  // ارتقاء facility
  static async upgradeFacility(userId, facilityType) {
    const user = await User.findById(userId);
    if (!user) throw new Error('کاربر یافت نشد');

    if (!user.facilities[facilityType]) {
      user.facilities[facilityType] = {
        level: 1,
        lastCollection: new Date(),
        currentCoins: 0
      };
    }

    const facility = user.facilities[facilityType];
    const currentLevel = facility.level;
    
    if (currentLevel >= 20) {
      throw new Error('حداکثر سطح رسیده است');
    }

    const upgradeCost = FACILITY_DATA[facilityType].upgradeCost[currentLevel];
    
    if ((user.coins || 0) < upgradeCost) {
      throw new Error('سکه کافی نیست');
    }

    user.coins -= upgradeCost;
    facility.level = currentLevel + 1;
    
    await user.save();
    
    return user;
  }

  // تولید سکه برای همه کاربران (Cron Job)
  static async produceCoinsForAllUsers() {
    console.log('🔄 Producing coins for all users...');
    
    const users = await User.find({});
    const batchSize = 100;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const updatePromises = batch.map(user => {
        const updates = {};
        
        // محاسبه سکه برای هر facility
        ['sponsor', 'stadium', 'tvRights', 'youthCamp'].forEach(facilityType => {
          if (user.facilities && user.facilities[facilityType]) {
            const collectable = this.calculateCollectableCoins(user, facilityType);
            const maxCoins = FACILITY_DATA[facilityType].production[user.facilities[facilityType].level - 1] * 10;
            updates[`facilities.${facilityType}.currentCoins`] = Math.min(collectable, maxCoins);
          }
        });
        
        return User.updateOne(
          { _id: user._id },
          { $set: updates }
        );
      });
      
      await Promise.all(updatePromises);
    }
    
    console.log(`✅ Produced coins for ${users.length} users`);
  }
}

module.exports = CoinService;
