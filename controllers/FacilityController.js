const CoinService = require('../services/CoinService');
const User = require('../models/user');
const { FACILITY_DATA } = require('../config/constants');

class FacilityController {
  
  // برداشت سکه
  static async collectCoins(req, res) {
    try {
      const { facilityType } = req.params;
      const userId = req.user.id;
      
      const collectedCoins = await CoinService.collectCoins(userId, facilityType);
      
      res.json({
        success: true,
        collectedCoins,
        message: `${collectedCoins} سکه برداشت شد`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ارتقاء facility
  static async upgradeFacility(req, res) {
    try {
      const { facilityType } = req.params;
      const userId = req.user.id;
      
      const user = await CoinService.upgradeFacility(userId, facilityType);
      
      res.json({
        success: true,
        newLevel: user.facilities[facilityType].level,
        newCoinBalance: user.coins,
        message: `ارتقاء ${facilityType} با موفقیت انجام شد`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // دریافت وضعیت facilities
  static async getFacilities(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'کاربر یافت نشد'
        });
      }

      const facilitiesStatus = {};
      
      for (const facilityType of ['sponsor', 'stadium', 'tvRights', 'youthCamp']) {
        if (!user.facilities[facilityType]) {
          user.facilities[facilityType] = {
            level: 1,
            lastCollection: new Date(),
            currentCoins: 0
          };
        }
        
        const collectable = CoinService.calculateCollectableCoins(user, facilityType);
        const facility = user.facilities[facilityType];
        
        facilitiesStatus[facilityType] = {
          level: facility.level,
          collectableCoins: Math.floor(collectable),
          productionRate: FACILITY_DATA[facilityType].production[facility.level - 1],
          upgradeCost: FACILITY_DATA[facilityType].upgradeCost[facility.level] || 0,
          maxLevel: facility.level >= 20
        };
      }
      
      res.json({
        success: true,
        facilities: facilitiesStatus,
        coins: user.coins || 0
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = FacilityController;
