const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const User = require('../models/User');
const authMiddleware = require('../Middleware/auth');

// تنظیمات Multer برای ذخیره فایل در حافظه
const storage = multer.memoryStorage();
const upload = multer({ storage });

// روت آپلود تصویر پروفایل
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'کاربر یافت نشد' });

        // تبدیل تصویر به WebP و تغییر اندازه
        const webpBuffer = await sharp(req.file.buffer)
            .resize({ width: 200, height: 200 }) // تغییر اندازه دلخواه
            .webp({ quality: 80 }) // کیفیت WebP
            .toBuffer();

        // ساخت نام فایل با استفاده از template literal
        const fileName = `${user._id}-${Date.now()}.webp`;

        // مسیر ذخیره فایل
        const filePath = path.join(__dirname, '../uploads', fileName);

        // ذخیره تصویر در مسیر مشخص شده
        await sharp(webpBuffer).toFile(filePath);

        // به‌روزرسانی آدرس تصویر در پروفایل کاربر (مسیر برای دسترسی استاتیک)
        user.profile.avatar = `/uploads/${fileName}`;
        await user.save();

        res.json({ avatar: user.profile.avatar });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'خطای سرور' });
    }
});

module.exports = router;
