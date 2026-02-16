// Jobهای روزانه
// این job می‌تواند با استفاده از node-cron یا cron package اجرا شود

const YouthCampService = require('../services/YouthCampService');

// تابع برای اجرای job
async function runDailyJobs() {
  console.log('🔄 Running daily jobs...');
  
  try {
    // بررسی بازنشستگی
    await YouthCampService.checkRetirements();
    
    console.log('✅ Daily jobs completed');
  } catch (error) {
    console.error('❌ Daily jobs failed:', error);
  }
}

// اگر cron نصب شده باشد، از آن استفاده می‌کند
let cronJob = null;
try {
  const { CronJob } = require('cron');
  cronJob = new CronJob(
    '0 0 * * *', // هر روز نیمه شب
    runDailyJobs,
    null,
    true,
    'Asia/Tehran'
  );
  console.log('✅ Daily jobs scheduled');
} catch (error) {
  console.log('⚠️ Cron package not found. Job will not run automatically.');
  console.log('   Install it with: npm install cron');
}

module.exports = {
  runDailyJobs,
  cronJob
};
