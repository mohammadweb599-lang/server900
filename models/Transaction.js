const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  package: {
    type: Object,
    required: true
  },
  authority: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'verified'],
    default: 'pending'
  },
  refId: {
    type: String
  },
  zarinpalData: {
    type: Object
  },
  webhookData: {
    type: Object
  }
}, {
  timestamps: true
});

// ایندکس برای جستجوی سریع
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ authority: 1 });
transactionSchema.index({ status: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);