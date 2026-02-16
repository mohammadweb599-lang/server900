const { Transaction } = require('../models/Transaction');
const { User } = require('../models/user');
const { ZARINPAL_CONFIG, PAYMENT_PACKAGES } = require('../config/zarinpal');
const axios = require('axios');


export class PaymentService {
  
  // ایجاد درخواست پرداخت
  static async createPaymentRequest(userId, packageId, mobile = null, email = null) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    // پیدا کردن پکیج
    const packageItem = this.findPackageById(packageId);
    if (!packageItem) {
      throw new Error('پکیج مورد نظر یافت نشد');
    }

    // ایجاد تراکنش در دیتابیس
    const transaction = new Transaction({
      user: userId,
      amount: packageItem.price,
      package: packageItem,
      status: 'pending'
    });

    await transaction.save();

    // درخواست به زرین‌پال
    const paymentData = {
      merchant_id: ZARINPAL_CONFIG.merchantId,
      amount: packageItem.price,
      callback_url: ZARINPAL_CONFIG.callbackURL,
      description: `خرید ${packageItem.description} - ${user.teamName}`,
      metadata: {
        mobile: mobile,
        email: email
      }
    };

    try {
      const response = await axios.post(
        `${ZARINPAL_CONFIG.baseURL}request.json`,
        paymentData
      );

      if (response.data.data && response.data.data.authority) {
        // ذخیره authority در تراکنش
        transaction.authority = response.data.data.authority;
        await transaction.save();

        return {
          success: true,
          paymentURL: `${ZARINPAL_CONFIG.baseURL.replace('/payment/', '')}/pg/StartPay/${response.data.data.authority}`,
          authority: response.data.data.authority,
          transactionId: transaction._id
        };
      } else {
        throw new Error('خطا در ارتباط با درگاه پرداخت');
      }
    } catch (error) {
      transaction.status = 'failed';
      await transaction.save();
      throw new Error('خطا در ایجاد درخواست پرداخت');
    }
  }

  // تأیید پرداخت
  static async verifyPayment(authority, status) {
    const transaction = await Transaction.findOne({ authority });
    if (!transaction) {
      throw new Error('تراکنش یافت نشد');
    }

    if (status !== 'OK') {
      transaction.status = 'failed';
      await transaction.save();
      throw new Error('پرداخت توسط کاربر لغو شد');
    }

    // درخواست تأیید به زرین‌پال
    const verifyData = {
      merchant_id: ZARINPAL_CONFIG.merchantId,
      authority: authority,
      amount: transaction.amount
    };

    try {
      const response = await axios.post(
        `${ZARINPAL_CONFIG.baseURL}verify.json`,
        verifyData
      );

      if (response.data.data && response.data.data.code === 100) {
        // پرداخت موفق
        transaction.status = 'verified';
        transaction.refId = response.data.data.ref_id;
        transaction.zarinpalData = response.data.data;
        await transaction.save();

        // واریز سکه/اسکناس به کاربر
        await this.depositToUser(transaction.user, transaction.package);

        return {
          success: true,
          refId: response.data.data.ref_id,
          amount: transaction.amount,
          package: transaction.package
        };
      } else {
        transaction.status = 'failed';
        await transaction.save();
        throw new Error('پرداخت ناموفق بود');
      }
    } catch (error) {
      transaction.status = 'failed';
      await transaction.save();
      throw new Error('خطا در تأیید پرداخت');
    }
  }

  // وب‌هوک زرین‌پال
  static async handleWebhook(webhookData) {
    const { authority, status, ref_id, amount } = webhookData;

    const transaction = await Transaction.findOne({ authority });
    if (!transaction) {
      throw new Error('تراکنش یافت نشد');
    }

    // ذخیره داده‌های وب‌هوک
    transaction.webhookData = webhookData;

    if (status === 'success' && ref_id) {
      // پرداخت موفق از طریق وب‌هوک
      transaction.status = 'success';
      transaction.refId = ref_id;
      await transaction.save();

      // واریز به کاربر (اگر قبلاً انجام نشده)
      if (!transaction.zarinpalData) {
        await this.depositToUser(transaction.user, transaction.package);
      }

      return { success: true, message: 'وب‌هوک با موفقیت پردازش شد' };
    } else {
      transaction.status = 'failed';
      await transaction.save();
      throw new Error('پرداخت در وب‌هوک ناموفق بود');
    }
  }

  // واریز به کاربر
  static async depositToUser(userId, packageItem) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('کاربر یافت نشد');
    }

    // واریز سکه
    if (packageItem.coins) {
      user.coins += packageItem.coins;
    }

    // واریز اسکناس
    if (packageItem.banknotes) {
      user.banknotes += packageItem.banknotes;
    }

    await user.save();

    // لاگ واریز
    console.log(`💰 واریز موفق: ${packageItem.coins || 0} سکه و ${packageItem.banknotes || 0} اسکناس به کاربر ${user.username}`);
  }

  // پیدا کردن پکیج بر اساس ID
  static findPackageById(packageId) {
    const allPackages = [
      ...PAYMENT_PACKAGES.coins,
      ...PAYMENT_PACKAGES.banknotes,
      ...PAYMENT_PACKAGES.special
    ];
    
    return allPackages.find(pkg => pkg.id === parseInt(packageId));
  }

  // دریافت تاریخچه تراکنش‌های کاربر
  static async getUserTransactions(userId, limit = 10) {
    return await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('amount package status refId createdAt');
  }

  // بررسی وضعیت تراکنش
  static async getTransactionStatus(transactionId) {
    return await Transaction.findById(transactionId)
      .populate('user', 'username teamName');
  }
}