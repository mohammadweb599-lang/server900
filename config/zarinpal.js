export const ZARINPAL_CONFIG = {
  merchantId: process.env.ZARINPAL_MERCHANT_ID || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  sandbox: process.env.NODE_ENV !== 'production',
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://api.zarinpal.com/pg/v4/payment/'
    : 'https://sandbox.zarinpal.com/pg/v4/payment/',
  callbackURL: process.env.PAYMENT_CALLBACK_URL || 'http://localhost:5000/api/payment/verify',
  webhookURL: process.env.PAYMENT_WEBHOOK_URL || 'http://localhost:5000/api/payment/webhook'
};

// پکیج‌های درگاه پرداخت
export const PAYMENT_PACKAGES = {
  coins: [
    { id: 1, coins: 10000, price: 10000, description: "۱۰,۰۰۰ سکه" },
    { id: 2, coins: 50000, price: 45000, description: "۵۰,۰۰۰ سکه (۱۰% تخفیف)" },
    { id: 3, coins: 100000, price: 80000, description: "۱۰۰,۰۰۰ سکه (۲۰% تخفیف)" },
    { id: 4, coins: 500000, price: 350000, description: "۵۰۰,۰۰۰ سکه (۳۰% تخفیف)" }
  ],
  banknotes: [
    { id: 5, banknotes: 10, price: 10000, description: "۱۰ اسکناس" },
    { id: 6, banknotes: 50, price: 45000, description: "۵۰ اسکناس (۱۰% تخفیف)" },
    { id: 7, banknotes: 100, price: 80000, description: "۱۰۰ اسکناس (۲۰% تخفیف)" },
    { id: 8, banknotes: 500, price: 350000, description: "۵۰۰ اسکناس (۳۰% تخفیف)" }
  ],
  special: [
    { id: 9, coins: 50000, banknotes: 20, price: 100000, description: "پکیج ویژه: ۵۰,۰۰۰ سکه + ۲۰ اسکناس" },
    { id: 10, coins: 200000, banknotes: 50, price: 300000, description: "پکیج طلایی: ۲۰۰,۰۰۰ سکه + ۵۰ اسکناس" }
  ]
};