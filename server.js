const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// اتصال به دیتابیس
connectDB();

// Middlewareها
app.use(cors());
app.use(express.json());

// روت‌ها
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));

// سرو کردن فایل‌های استاتیک (مثلاً تصاویر آپلود شده)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/status', (req, res) => {
    res.json({ status: 'Running' });
  });
  

// تعیین پورت و شروع سرور
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
