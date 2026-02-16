// Job برای تولید سکه هر 10 ساعت
// این job می‌تواند با استفاده از node-cron یا cron package اجرا شود
// برای استفاده، باید در app.js require شود

const CoinService = require('../services/CoinService');

// تابع برای اجرای job
async function runCoinProductionJob() {
  console.log('🔄 Running coin production job...');
  try {
    await CoinService.produceCoinsForAllUsers();
    console.log('✅ Coin production job completed');
  } catch (error) {
    console.error('❌ Coin production job failed:', error);
  }
}

// اگر cron نصب شده باشد، از آن استفاده می‌کند
let cronJob = null;
try {
  const { CronJob } = require('cron');
  cronJob = new CronJob(
    '0 */10 * * *', // هر 10 ساعت
    runCoinProductionJob,
    null,
    true,
    'Asia/Tehran'
  );
  console.log('✅ Coin production job scheduled');
} catch (error) {
  console.log('⚠️ Cron package not found. Job will not run automatically.');
  console.log('   Install it with: npm install cron');
}

module.exports = {
  runCoinProductionJob,
  cronJob
};
