const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../Middleware/auth');

// ثبت‌نام
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        console.log('Register request body:', req.body);

        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists:', email);
            return res.status(400).json({ msg: 'کاربر قبلاً ثبت‌نام کرده' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({
            username,
            email,
            password: hashedPassword,
            role: role && ['user', 'admin'].includes(role) ? role : 'user',
        });

        await user.save();
        console.log('User saved:', user);

        const payload = { user: { id: user.id, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, role: user.role, msg: 'ثبت‌نام با موفقیت انجام شد!' });
    } catch (err) {
        console.error('Error in /register:', err);
        res.status(500).json({ msg: 'خطای سرور' });
    }
});

// ورود
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log('Login request body:', req.body);

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ msg: 'کاربر یافت نشد' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Incorrect password for user:', email);
            return res.status(400).json({ msg: 'رمز عبور اشتباه است' });
        }

        const payload = { user: { id: user.id, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, role: user.role, msg: 'ورود با موفقیت انجام شد!' });
    } catch (err) {
        console.error('Error in /login:', err);
        res.status(500).json({ msg: 'خطای سرور' });
    }
});

// دریافت پروفایل
router.get('/profile', authMiddleware(), async (req, res) => {
    try {
        console.log('Profile request for user id:', req.user.id);

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            console.log('User not found for profile:', req.user.id);
            return res.status(404).json({ msg: 'کاربر یافت نشد' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error in /profile:', err);
        res.status(500).json({ msg: 'خطای سرور' });
    }
});

// به‌روزرسانی پروفایل
router.put('/profile', authMiddleware(), async (req, res) => {
    const { firstName, lastName, bio, avatar } = req.body;

    try {
        console.log('Update profile request for user id:', req.user.id, 'with data:', req.body);

        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('User not found for profile update:', req.user.id);
            return res.status(404).json({ msg: 'کاربر یافت نشد' });
        }

        user.profile = { firstName, lastName, bio, avatar };
        await user.save();

        res.json(user);
    } catch (err) {
        console.error('Error in PUT /profile:', err);
        res.status(500).json({ msg: 'خطای سرور' });
    }
});

// روت فقط برای ادمین (مثال)
router.get('/admin/users', authMiddleware(['admin']), async (req, res) => {
    try {
        console.log('Admin users request by user id:', req.user.id);

        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error('Error in /admin/users:', err);
        res.status(500).json({ msg: 'خطای سرور' });
    }
});

module.exports = router;
