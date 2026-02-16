import { PaymentService } from './src/services/PaymentService.js';
import { User } from './src/models/User.js';
import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/football-manager-test');

console.log('🧪 شروع تست سیستم پرداخت...');

// ایجاد کاربر تستی
const testUser = new User({
  username: 'payment_test',
  teamName: 'تیم تست پرداخت',
  coins: 1000,
  banknotes: 5
});

await testUser.save();
console.log('✅ کاربر تست ایجاد شد');

// 1. تست ایجاد درخواست پرداخت
console.log('\n💰 تست ایجاد درخواست پرداخت:');
try {
  const paymentRequest = await PaymentService.createPaymentRequest(
    testUser._id, 
    1, // پکیج 10000 سکه
    '09123456789'
  );
  
  console.log('✅ درخواست پرداخت ایجاد شد:');
  console.log('   Authority:', paymentRequest.authority);
  console.log('   Payment URL:', paymentRequest.paymentURL);
} catch (error) {
  console.log('❌ خطا:', error.message);
}

// 2. تست واریز مستقیم (شبیه‌سازی پرداخت موفق)
console.log('\n🏦 تست واریز مستقیم:');
const testPackage = { coins: 50000, banknotes: 10, description: "پکیج تست" };
await PaymentService.depositToUser(testUser._id, testPackage);

const updatedUser = await User.findById(testUser._id);
console.log('✅ واریز انجام شد:');
console.log('   سکه جدید:', updatedUser.coins);
console.log('   اسکناس جدید:', updatedUser.banknotes);

// 3. تست تاریخچه تراکنش‌ها
console.log('\n📋 تست تاریخچه تراکنش‌ها:');
const transactions = await PaymentService.getUserTransactions(testUser._id);
console.log('تعداد تراکنش‌ها:', transactions.length);

console.log('\n🎉 تست سیستم پرداخت کامل شد!');
process.exit(0);