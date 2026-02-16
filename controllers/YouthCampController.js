const YouthCampService = require('../services/YouthCampService');
const User = require('../models/user');
const { FACILITY_DATA } = require('../config/constants');

class YouthCampController {
  
  // جذب بازیکن جدید
  static async recruitPlayer(req, res) {
    try {
      const userId = req.user.id;
      
      const newPlayer = await YouthCampService.recruitPlayer(userId);
      
      res.json({
        success: true,
        player: newPlayer,
        message: `بازیکن جدید ${newPlayer.name} جذب شد`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // اخراج بازیکن
  static async firePlayer(req, res) {
    try {
      const { playerId } = req.params;
      const userId = req.user.id;
      
      const result = await YouthCampService.firePlayer(userId, playerId);
      
      res.json({
        success: true,
        remainingFires: result.remainingFires,
        message: 'بازیکن با موفقیت اخراج شد'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // دریافت اطلاعات کمپ
  static async getCampInfo(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'کاربر یافت نشد'
        });
      }

      if (!user.facilities || !user.facilities.youthCamp) {
        user.facilities = user.facilities || {};
        user.facilities.youthCamp = {
          level: 1,
          lastCollection: new Date(),
          currentCoins: 0
        };
        await user.save();
      }

      const campInfo = {
        level: user.facilities.youthCamp.level,
        playerOverall: FACILITY_DATA.youthCamp.playerOverall[user.facilities.youthCamp.level - 1],
        monthlyFires: user.monthlyStats?.playersFired || 0,
        maxFires: 3,
        playersCount: user.players?.length || 0,
        maxPlayers: 22
      };
      
      res.json({
        success: true,
        campInfo
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = YouthCampController;
