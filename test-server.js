import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());


// ارتباط با MongoDB
mongoose.connect('mongodb://localhost:27017/football-manager-test')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.log('❌ MongoDB error:', err));

// یک مدل ساده برای تست
const UserSchema = new mongoose.Schema({
  username: String,
  teamName: String,
  coins: { type: Number, default: 10000 }
});

const User = mongoose.model('User', UserSchema);

// Routes ساده برای تست
app.post('/api/register', async (req, res) => {
  try {
    const { username, teamName } = req.body;
    
    const user = new User({
      username,
      teamName,
      coins: 10000
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'ثبت‌نام موفق!',
      user: {
        id: user._id,
        username: user.username,
        teamName: user.teamName,
        coins: user.coins
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get('/api/user/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

// تست سیستم سکه
app.post('/api/add-coins/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId);
  user.coins += 1000;
  await user.save();
  res.json({ message: '1000 سکه اضافه شد!', newBalance: user.coins });
});

app.listen(5000, () => {
  console.log('🎮 سرور تست در حال اجرا روی پورت 5000');
  console.log('📝 دستورات تست:');
  console.log('   POST /api/register - ثبت‌نام کاربر جدید');
  console.log('   GET /api/users - لیست همه کاربران');
  console.log('   POST /api/add-coins/:userId - اضافه کردن سکه');
});