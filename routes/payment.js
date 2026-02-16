import express from 'express';
import { PaymentController } from '../controllers/PaymentController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// routes عمومی
router.get('/packages', PaymentController.getPackages);
router.post('/verify', PaymentController.verifyPayment); // callback زرین‌پال
router.post('/webhook', PaymentController.webhook); // وب‌هوک زرین‌پال

// routes نیازمند احراز هویت
router.use(auth);
router.post('/create', PaymentController.createPayment);
router.get('/transactions', PaymentController.getTransactions);
router.get('/transaction/:transactionId', PaymentController.getTransactionStatus);

export default router;