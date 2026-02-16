import { PaymentService } from '../services/PaymentService.js';

export class PaymentController {
  
  // دریافت لیست پکیج‌ها
  static async getPackages(req, res) {
    try {
      const { ZARINPAL_CONFIG, PAYMENT_PACKAGES } = await import('../config/zarinpal.js');
      
      res.json({
        success: true,
        packages: PAYMENT_PACKAGES,
        config: {
          merchantId: ZARINPAL_CONFIG.merchantId,
          sandbox: ZARINPAL_CONFIG.sandbox
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت پکیج‌ها'
      });
    }
  }

  // ایجاد درخواست پرداخت
  static async createPayment(req, res) {
    try {
      const { packageId, mobile, email } = req.body;
      const userId = req.user._id;

      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: 'شناسه پکیج الزامی است'
        });
      }

      const result = await PaymentService.createPaymentRequest(
        userId, 
        packageId, 
        mobile, 
        email
      );

      res.json({
        success: true,
        paymentURL: result.paymentURL,
        authority: result.authority,
        transactionId: result.transactionId
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // تأیید پرداخت
  static async verifyPayment(req, res) {
    try {
      const { Authority, Status } = req.query;

      const result = await PaymentService.verifyPayment(Authority, Status);

      // نمایش صفحه موفقیت
      res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>پرداخت موفق</title>
            <style>
                body { font-family: Tahoma, Arial; text-align: center; padding: 50px; }
                .success { color: green; }
                .info { background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1 class="success">✅ پرداخت موفق</h1>
            <div class="info">
                <p>شناسه پرداخت: <strong>${result.refId}</strong></p>
                <p>مبلغ: <strong>${result.amount.toLocaleString()} تومان</strong></p>
                <p>پکیج: <strong>${result.package.description}</strong></p>
            </div>
            <p>سکه و اسکناس‌ها به حساب شما واریز شد.</p>
            <button onclick="window.close()">بستن</button>
        </body>
        </html>
      `);

    } catch (error) {
      res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>خطا در پرداخت</title>
            <style>
                body { font-family: Tahoma, Arial; text-align: center; padding: 50px; }
                .error { color: red; }
            </style>
        </head>
        <body>
            <h1 class="error">❌ پرداخت ناموفق</h1>
            <p>${error.message}</p>
            <button onclick="window.close()">بستن</button>
        </body>
        </html>
      `);
    }
  }

  // وب‌هوک زرین‌پال
  static async webhook(req, res) {
    try {
      const webhookData = req.body;
      
      await PaymentService.handleWebhook(webhookData);

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // تاریخچه تراکنش‌ها
  static async getTransactions(req, res) {
    try {
      const userId = req.user._id;
      const { limit = 10 } = req.query;

      const transactions = await PaymentService.getUserTransactions(userId, parseInt(limit));

      res.json({
        success: true,
        transactions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت تاریخچه تراکنش‌ها'
      });
    }
  }

  // وضعیت تراکنش
  static async getTransactionStatus(req, res) {
    try {
      const { transactionId } = req.params;

      const transaction = await PaymentService.getTransactionStatus(transactionId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'تراکنش یافت نشد'
        });
      }

      res.json({
        success: true,
        transaction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت وضعیت تراکنش'
      });
    }
  }
}